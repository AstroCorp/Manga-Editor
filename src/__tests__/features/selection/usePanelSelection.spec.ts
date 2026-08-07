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
import { Shape } from '@/models/Shape';
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

const selectionDeps = (canvas: Canvas) => {
	return {
		fabricCanvas: shallowRef(canvas),
		rootEl: ref(null),
		syncInteractionMode: vi.fn(),
		cancelStroke: vi.fn(),
		discardSelection: vi.fn(),
		registerCanvasAction: vi.fn(),
		onAfterPageApply: vi.fn(),
	};
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

		usePanelSelection(selectionDeps(canvas));

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

		usePanelSelection(selectionDeps(canvas));

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

		expect(textObject.set).not.toHaveBeenCalled();
		expect(mangaStore.texts[0]?.top).toBe(20);
	});

	it('moves selected panel images with arrow keys', () => {
		const imageObject = createImageMock('panel-1', 40, 50);
		const { canvas } = createCanvas(imageObject);

		usePanelSelection(selectionDeps(canvas));

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

		usePanelSelection(selectionDeps(canvas));

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
			...selectionDeps(canvas),
			syncInteractionMode,
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

		usePanelSelection(selectionDeps(canvas));

		clearClipboard();

		window.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }),
		);

		expect(peekCopiedText()?.id).not.toBe(text.id);
	});
});

describe('usePanelSelection Escape and layer element actions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('Escape cancels stroke and discards selection', () => {
		const { canvas } = createCanvas(null);
		const cancelStroke = vi.fn();
		const discardSelection = vi.fn();

		usePanelSelection({
			...selectionDeps(canvas),
			cancelStroke,
			discardSelection,
		});

		const event = new KeyboardEvent('keydown', { key: 'Escape' });
		const preventDefault = vi.spyOn(event, 'preventDefault');

		window.dispatchEvent(event);

		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(discardSelection).toHaveBeenCalledOnce();
		expect(canvas.requestRenderAll).toHaveBeenCalled();
		expect(preventDefault).toHaveBeenCalled();
	});

	it('registers focusLayerElement and selects on the active layer', () => {
		const mangaStore = useMangaStore();
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 10, y: 0 },
				{ x: 10, y: 10 },
			],
			2,
		);

		mangaStore.addShape(shape);

		const panel = {
			left: 0,
			top: 0,
			selectable: true,
			get: (key: string) => {
				if (key === 'objectType') {
					return FABRIC_OBJECT_TYPE.Panel;
				}

				if (key === 'panelId') {
					return shape.id;
				}

				if (key === 'layerId') {
					return mangaStore.activeLayer.id;
				}

				return undefined;
			},
		};
		const registered: Record<string, (payload: unknown) => void> = {};
		const { canvas } = createCanvas(null);

		(canvas as { getObjects?: () => unknown[] }).getObjects = () => {
			return [panel];
		};
		(canvas as { setActiveObject: ReturnType<typeof vi.fn> }).setActiveObject =
			vi.fn();

		usePanelSelection({
			...selectionDeps(canvas),
			registerCanvasAction: (actions) => {
				Object.assign(registered, actions);
			},
		});

		registered.focusLayerElement?.({
			layerId: mangaStore.activeLayer.id,
			kind: 'shape',
			id: shape.id,
		});

		expect(canvas.setActiveObject).toHaveBeenCalledWith(panel);
	});

	it('deleteLayerElement removes text from store and canvas', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(4, 5);

		mangaStore.addText(text);

		const textObject = createTextMock(text);
		const registered: Record<string, (payload: unknown) => void> = {};
		const { canvas } = createCanvas(textObject);

		(canvas as { getObjects?: () => unknown[] }).getObjects = () => {
			return [textObject];
		};

		usePanelSelection({
			...selectionDeps(canvas),
			registerCanvasAction: (actions) => {
				Object.assign(registered, actions);
			},
		});

		registered.deleteLayerElement?.({
			layerId: mangaStore.activeLayer.id,
			kind: 'text',
			id: text.id,
		});

		expect(mangaStore.texts).toHaveLength(0);
		expect(canvas.remove).toHaveBeenCalledWith(textObject);
		expect(canvas.discardActiveObject).toHaveBeenCalled();
	});
});
