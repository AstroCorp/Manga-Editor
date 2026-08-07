import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref, shallowRef } from 'vue';
import { usePanelSelection } from '@/features/selection/usePanelSelection';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import * as textFabric from '@/lib/fabric/textFabric';
import {
	clearClipboard,
} from '@/lib/clipboard/editorClipboard';
import {
	peekCopiedText,
} from '@/lib/text/textClipboard';
import { TextBlock } from '@/models/TextBlock';
import { useMangaStore } from '@/stores/manga';
import type { Canvas, FabricObject } from 'fabric';

type ObjectMock = {
	left: number;
	top: number;
	isEditing?: boolean;
	get: (key: string) => unknown;
	set: ReturnType<typeof vi.fn>;
	setCoords: ReturnType<typeof vi.fn>;
};

const createTextMock = (text: TextBlock, isEditing = false): ObjectMock => {
	const object: ObjectMock = {
		left: text.left,
		top: text.top,
		isEditing,
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.Text;
			}

			if (key === 'textId') {
				return text.id;
			}

			return undefined;
		},
		set: vi.fn((props: { left?: number; top?: number }) => {
			if (props.left !== undefined) {
				object.left = props.left;
			}

			if (props.top !== undefined) {
				object.top = props.top;
			}
		}),
		setCoords: vi.fn(),
	};

	return object;
};

const createImageMock = (panelId: string, left: number, top: number): ObjectMock => {
	const object: ObjectMock = {
		left,
		top,
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.PanelImage;
			}

			if (key === 'panelId') {
				return panelId;
			}

			return undefined;
		},
		set: vi.fn((props: { left?: number; top?: number }) => {
			if (props.left !== undefined) {
				object.left = props.left;
			}

			if (props.top !== undefined) {
				object.top = props.top;
			}
		}),
		setCoords: vi.fn(),
	};

	return object;
};

const createCanvas = (active: ObjectMock | null) => {
	const handlers: Record<string, (event?: unknown) => void> = {};
	const canvas = {
		on: (event: string, handler: (event?: unknown) => void) => {
			handlers[event] = handler;
		},
		off: vi.fn(),
		getActiveObject: () => {
			return active as unknown as FabricObject;
		},
		fire: vi.fn((event: string, payload?: unknown) => {
			handlers[event]?.(payload);
		}),
		requestRenderAll: vi.fn(),
		remove: vi.fn(),
		discardActiveObject: vi.fn(),
		add: vi.fn(),
		setActiveObject: vi.fn(),
		getScenePoint: vi.fn((event: { clientX: number; clientY: number }) => {
			return { x: event.clientX, y: event.clientY };
		}),
	} as unknown as Canvas;

	return { canvas, handlers };
};

describe('usePanelSelection nudge', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('moves selected text with arrow keys and persists', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		mangaStore.addText(text);

		const textObject = createTextMock(text);
		const { canvas } = createCanvas(textObject);

		usePanelSelection({
			fabricCanvas: shallowRef(canvas),
			rootEl: ref(null),
			syncInteractionMode: vi.fn(),
			cancelStroke: vi.fn(),
		});

		const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
		const preventDefault = vi.spyOn(event, 'preventDefault');

		window.dispatchEvent(event);

		expect(textObject.set).toHaveBeenCalledWith({ left: 11, top: 20 });
		expect(textObject.setCoords).toHaveBeenCalled();
		expect(mangaStore.texts[0]?.left).toBe(11);
		expect(preventDefault).toHaveBeenCalled();
	});

	it('does not nudge text while editing', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		mangaStore.addText(text);

		const textObject = createTextMock(text, true);
		const { canvas } = createCanvas(textObject);

		usePanelSelection({
			fabricCanvas: shallowRef(canvas),
			rootEl: ref(null),
			syncInteractionMode: vi.fn(),
			cancelStroke: vi.fn(),
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

		expect(textObject.set).not.toHaveBeenCalled();
		expect(mangaStore.texts[0]?.top).toBe(20);
	});

	it('moves selected panel images with arrow keys', () => {
		const imageObject = createImageMock('panel-1', 40, 50);
		const { canvas } = createCanvas(imageObject);

		usePanelSelection({
			fabricCanvas: shallowRef(canvas),
			rootEl: ref(null),
			syncInteractionMode: vi.fn(),
			cancelStroke: vi.fn(),
		});

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));

		expect(imageObject.set).toHaveBeenCalledWith({ left: 40, top: 49 });
		expect(canvas.fire).toHaveBeenCalledWith('object:modified', {
			target: imageObject,
		});
	});

	it('uses a larger step when the key is held (repeat)', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		mangaStore.addText(text);

		const textObject = createTextMock(text);
		const { canvas } = createCanvas(textObject);

		usePanelSelection({
			fabricCanvas: shallowRef(canvas),
			rootEl: ref(null),
			syncInteractionMode: vi.fn(),
			cancelStroke: vi.fn(),
		});

		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowLeft', repeat: true }),
		);

		expect(textObject.set).toHaveBeenCalledWith({ left: 6, top: 20 });
	});
});

describe('usePanelSelection text clipboard', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		clearClipboard();
	});

	it('copies selected text and pastes a clone at the mouse position', async () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		text.applyPatch({ content: 'Copy me', fontSize: 30 });
		mangaStore.addText(text);

		const textObject = createTextMock(text);
		const { canvas, handlers } = createCanvas(textObject);
		const syncInteractionMode = vi.fn();
		const toFabric = vi
			.spyOn(textFabric, 'textBlockToFabric')
			.mockImplementation((block) => {
				return createTextMock(block) as never;
			});

		usePanelSelection({
			fabricCanvas: shallowRef(canvas),
			rootEl: ref(null),
			syncInteractionMode,
			cancelStroke: vi.fn(),
		});

		handlers['mouse:move']?.({
			e: { clientX: 120, clientY: 80 },
		});

		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }),
		);

		expect(peekCopiedText()?.content).toBe('Copy me');
		expect(peekCopiedText()?.fontSize).toBe(30);

		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }),
		);

		expect(mangaStore.texts).toHaveLength(2);
		expect(mangaStore.texts[1]?.content).toBe('Copy me');
		expect(mangaStore.texts[1]?.id).not.toBe(text.id);
		expect(mangaStore.texts[1]?.left).toBe(120);
		expect(mangaStore.texts[1]?.top).toBe(80);
		expect(canvas.add).toHaveBeenCalled();
		expect(canvas.setActiveObject).toHaveBeenCalled();
		expect(syncInteractionMode).toHaveBeenCalled();

		toFabric.mockRestore();
	});

	it('does not copy while editing text', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		mangaStore.addText(text);

		const textObject = createTextMock(text, true);
		const { canvas } = createCanvas(textObject);

		usePanelSelection({
			fabricCanvas: shallowRef(canvas),
			rootEl: ref(null),
			syncInteractionMode: vi.fn(),
			cancelStroke: vi.fn(),
		});

		clearClipboard();

		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }),
		);

		expect(peekCopiedText()?.id).not.toBe(text.id);
	});
});
