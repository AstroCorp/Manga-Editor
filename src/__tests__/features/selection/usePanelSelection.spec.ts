import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { effectScope, ref, shallowRef } from 'vue';
import { usePanelSelection } from '@/features/selection/usePanelSelection';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import * as textFabric from '@/lib/fabric/textFabric';
import * as loadGoogleFont from '@/lib/fonts/loadGoogleFont';
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

const createCanvas = (
	active: ObjectMock | null,
	objects: ObjectMock[] = active ? [active] : [],
) => {
	const handlers: Record<string, (event?: unknown) => void> = {};
	const state = {
		active,
		objects: [...objects],
	};
	const canvas = {
		on: (event: string, handler: (event?: unknown) => void) => {
			handlers[event] = handler;
		},
		off: vi.fn(),
		getActiveObject: () => {
			return state.active as unknown as FabricObject;
		},
		getObjects: () => {
			return state.objects as unknown as FabricObject[];
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

	return { canvas, handlers, state };
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
		vi.restoreAllMocks();
		vi.spyOn(loadGoogleFont, 'ensureTextFontsLoaded').mockResolvedValue(
			undefined,
		);
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

		await vi.waitFor(() => {
			expect(mangaStore.texts).toHaveLength(2);
		});

		expect(mangaStore.texts[1]?.content).toBe('Copy me');
		expect(mangaStore.texts[1]?.id).not.toBe(text.id);
		expect(mangaStore.texts[1]?.left).toBe(120);
		expect(mangaStore.texts[1]?.top).toBe(80);
		expect(canvas.add).toHaveBeenCalled();
		expect(canvas.setActiveObject).toHaveBeenCalled();
		expect(syncInteractionMode).toHaveBeenCalled();
		expect(loadGoogleFont.ensureTextFontsLoaded).toHaveBeenCalled();

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

describe('usePanelSelection text editing lifecycle', () => {
	let selectionScope: ReturnType<typeof effectScope> | null = null;

	const mountSelection = (
		...args: Parameters<typeof usePanelSelection>
	) => {
		selectionScope?.stop();
		selectionScope = effectScope();
		selectionScope.run(() => {
			usePanelSelection(...args);
		});
	};

	beforeEach(() => {
		setActivePinia(createPinia());
		vi.restoreAllMocks();
	});

	afterEach(() => {
		selectionScope?.stop();
		selectionScope = null;
	});

	it('does not call set with locks while entering edit mode', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		mangaStore.addText(text);

		const textObject = createTextMock(text);
		const { canvas, handlers } = createCanvas(textObject);
		const cancelStroke = vi.fn();

		mountSelection({
			...selectionDeps(canvas),
			cancelStroke,
		});

		handlers['text:editing:entered']?.({ target: textObject });

		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(textObject.set).not.toHaveBeenCalled();
	});

	it('syncs interaction mode when editing exits even if persist fails', () => {
		const textObject = createTextMock(TextBlock.create(10, 20));
		const { canvas, handlers } = createCanvas(textObject);
		const syncInteractionMode = vi.fn();

		mountSelection({
			...selectionDeps(canvas),
			syncInteractionMode,
		});

		vi.spyOn(textFabric, 'textBlockFromFabric').mockImplementation(() => {
			throw new Error('persist failed');
		});

		expect(() => {
			handlers['text:editing:exited']?.({ target: textObject });
		}).toThrow('persist failed');

		expect(syncInteractionMode).toHaveBeenCalledOnce();
	});

	it('exits orphan boxed text editing when the group is deselected', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.createBoxed(10, 20);

		mangaStore.addText(text);

		const group = createTextMock(text);
		const exitEditing = vi.fn();
		const nestedTextbox = {
			isEditing: true,
			exitEditing,
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(
			nestedTextbox as never,
		);

		const { canvas, handlers, state } = createCanvas(group);

		mountSelection(selectionDeps(canvas));

		state.active = null;
		handlers['selection:cleared']?.();

		expect(exitEditing).toHaveBeenCalledOnce();
	});

	it('keeps editing while the host text remains selected', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const exitEditing = vi.fn();

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue({
			isEditing: true,
			exitEditing,
		} as never);

		const { canvas, handlers } = createCanvas(group);

		mountSelection(selectionDeps(canvas));
		handlers['selection:updated']?.();

		expect(exitEditing).not.toHaveBeenCalled();
	});

	it('forwards mouse caret updates to the nested textbox while editing', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const setCursorByClick = vi.fn();
		const register = vi.fn();
		const unregister = vi.fn();
		const endCurrentTransform = vi.fn();
		const nestedTextbox = {
			isEditing: true,
			selectionStart: 2,
			selectionEnd: 2,
			setCursorByClick,
			abortCursorAnimation: vi.fn(),
			renderCursorOrSelection: vi.fn(),
			hiddenTextarea: { focus: vi.fn() },
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(
			nestedTextbox as never,
		);

		const { canvas, handlers } = createCanvas(group);
		Object.assign(canvas, {
			endCurrentTransform,
			textEditingManager: { register, unregister },
		});

		mountSelection(selectionDeps(canvas));

		handlers['mouse:down']?.({
			e: { button: 0 },
			target: group,
		});

		expect(endCurrentTransform).toHaveBeenCalled();
		expect(register).toHaveBeenCalledWith(nestedTextbox);
		expect(setCursorByClick).toHaveBeenCalled();
		expect(nestedTextbox.hiddenTextarea.focus).toHaveBeenCalled();

		handlers['mouse:up']?.();

		expect(unregister).toHaveBeenCalledWith(nestedTextbox);
	});

	it('repaints hosted text selection after mouseup clears contextTop', () => {
		vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });

		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const nestedTextbox = {
			isEditing: true,
			selectionStart: 1,
			selectionEnd: 4,
			setCursorByClick: vi.fn(),
			abortCursorAnimation: vi.fn(),
			renderCursorOrSelection: vi.fn(),
			hiddenTextarea: { focus: vi.fn() },
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(
			nestedTextbox as never,
		);

		const { canvas, handlers } = createCanvas(group);
		Object.assign(canvas, {
			endCurrentTransform: vi.fn(),
			textEditingManager: { register: vi.fn(), unregister: vi.fn() },
		});

		mountSelection(selectionDeps(canvas));
		handlers['mouse:up']?.();

		expect(nestedTextbox.renderCursorOrSelection).not.toHaveBeenCalled();

		vi.runAllTimers();

		expect(nestedTextbox.renderCursorOrSelection).toHaveBeenCalledOnce();
		expect(nestedTextbox.selectionStart).toBe(1);
		expect(nestedTextbox.selectionEnd).toBe(4);

		vi.useRealTimers();
	});

	it('does not schedule selection repaint when the active object is the textbox', () => {
		vi.useFakeTimers({ toFake: ['requestAnimationFrame'] });

		const text = TextBlock.create(10, 20);
		const textObject = createTextMock(text, true);
		const textbox = {
			isEditing: true,
			selectionStart: 0,
			selectionEnd: 2,
			renderCursorOrSelection: vi.fn(),
			hiddenTextarea: { focus: vi.fn() },
		};
		const unregister = vi.fn();

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(textbox as never);

		const { canvas, handlers, state } = createCanvas(textObject);

		// Active === editing textbox ⇒ no hosted (Group) path.
		state.active = textbox as unknown as ObjectMock;
		Object.assign(canvas, {
			textEditingManager: { register: vi.fn(), unregister },
		});

		mountSelection(selectionDeps(canvas));
		handlers['mouse:up']?.();
		vi.runAllTimers();

		expect(unregister).not.toHaveBeenCalled();
		expect(textbox.renderCursorOrSelection).not.toHaveBeenCalled();
		expect(textbox.hiddenTextarea.focus).toHaveBeenCalled();

		vi.useRealTimers();
	});

	it('ignores keys from a focused listbox while editing', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const exitEditing = vi.fn();
		const textarea = {
			value: 'Hello',
			selectionStart: 0,
			selectionEnd: 5,
			focus: vi.fn(),
			setSelectionRange: vi.fn(),
			dispatchEvent: vi.fn(),
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue({
			isEditing: true,
			hiddenTextarea: textarea,
			exitEditing,
		} as never);

		const { canvas } = createCanvas(group);

		mountSelection(selectionDeps(canvas));

		const listbox = document.createElement('div');

		listbox.setAttribute('role', 'listbox');
		document.body.appendChild(listbox);

		listbox.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'a',
				bubbles: true,
			}),
		);

		expect(textarea.focus).not.toHaveBeenCalled();
		expect(textarea.value).toBe('Hello');
		expect(exitEditing).not.toHaveBeenCalled();

		listbox.remove();
	});

	it('selects the word on double click and all text on triple click', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const selectWord = vi.fn();
		const selectAll = vi.fn();
		const nestedTextbox = {
			isEditing: true,
			selectionStart: 3,
			selectWord,
			selectAll,
			getSelectionStartFromPointer: vi.fn(() => 3),
			renderCursorOrSelection: vi.fn(),
			hiddenTextarea: { focus: vi.fn() },
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(
			nestedTextbox as never,
		);

		const { canvas, handlers } = createCanvas(group);

		mountSelection(selectionDeps(canvas));
		handlers['mouse:dblclick']?.({
			e: { clientX: 10, clientY: 10 },
			target: group,
		});

		expect(selectWord).toHaveBeenCalledWith(3);
		expect(selectAll).not.toHaveBeenCalled();

		handlers['mouse:tripleclick']?.({ target: group });

		expect(selectAll).toHaveBeenCalledOnce();
		expect(nestedTextbox.hiddenTextarea.focus).toHaveBeenCalled();
	});

	it('exits editing with Escape when the textarea is not focused', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const exitEditing = vi.fn();
		const textarea = {
			selectionStart: 0,
			selectionEnd: 0,
			focus: vi.fn(),
			setSelectionRange: vi.fn(),
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue({
			isEditing: true,
			hiddenTextarea: textarea,
			exitEditing,
		} as never);

		const { canvas } = createCanvas(group);

		mountSelection(selectionDeps(canvas));

		const event = new KeyboardEvent('keydown', {
			key: 'Escape',
			bubbles: true,
		});
		const preventDefault = vi.spyOn(event, 'preventDefault');

		window.dispatchEvent(event);

		expect(exitEditing).toHaveBeenCalled();
		expect(preventDefault).toHaveBeenCalled();
	});

	it('keeps editing and ignores keys while a toolbar input is focused', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const exitEditing = vi.fn();
		const textarea = {
			value: 'Hello',
			selectionStart: 0,
			selectionEnd: 5,
			focus: vi.fn(),
			setSelectionRange: vi.fn(),
			dispatchEvent: vi.fn(),
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue({
			isEditing: true,
			hiddenTextarea: textarea,
			exitEditing,
		} as never);

		const { canvas } = createCanvas(group);

		mountSelection(selectionDeps(canvas));

		const input = document.createElement('input');

		document.body.appendChild(input);

		const event = new KeyboardEvent('keydown', {
			key: 'a',
			bubbles: true,
		});
		const preventDefault = vi.spyOn(event, 'preventDefault');

		input.dispatchEvent(event);

		expect(textarea.focus).not.toHaveBeenCalled();
		expect(textarea.setSelectionRange).not.toHaveBeenCalled();
		expect(textarea.value).toBe('Hello');
		expect(exitEditing).not.toHaveBeenCalled();
		expect(preventDefault).not.toHaveBeenCalled();

		input.remove();
	});

	it('does not exit editing with Escape from a focused toolbar input', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const exitEditing = vi.fn();
		const textarea = {
			selectionStart: 0,
			selectionEnd: 0,
			focus: vi.fn(),
			setSelectionRange: vi.fn(),
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue({
			isEditing: true,
			hiddenTextarea: textarea,
			exitEditing,
		} as never);

		const { canvas } = createCanvas(group);

		mountSelection(selectionDeps(canvas));

		const input = document.createElement('input');

		document.body.appendChild(input);

		input.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Escape',
				bubbles: true,
			}),
		);

		expect(exitEditing).not.toHaveBeenCalled();
		expect(textarea.focus).not.toHaveBeenCalled();

		input.remove();
	});

	it('enters editing and selects a word on first double click', () => {
		const text = TextBlock.createBoxed(10, 20);
		const group = createTextMock(text);
		const enterEditing = vi.fn();
		const selectWord = vi.fn();
		const nestedTextbox = {
			isEditing: false,
			selectionStart: 0,
			enterEditing,
			selectWord,
			getSelectionStartFromPointer: vi.fn(() => 2),
			renderCursorOrSelection: vi.fn(),
			hiddenTextarea: { focus: vi.fn() },
		};

		vi.spyOn(textFabric, 'getPageTextbox').mockReturnValue(
			nestedTextbox as never,
		);

		const { canvas, handlers } = createCanvas(null, [group]);

		mountSelection(selectionDeps(canvas));
		handlers['mouse:dblclick']?.({
			e: { clientX: 10, clientY: 10 },
			target: group,
		});

		expect(canvas.setActiveObject).toHaveBeenCalledWith(group);
		expect(enterEditing).toHaveBeenCalled();
		expect(selectWord).toHaveBeenCalledWith(2);
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

	it('focusLayerElement selects the panel image when the panel is filled', () => {
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
			selectable: false,
			get: (key: string) => {
				if (key === 'objectType') {
					return FABRIC_OBJECT_TYPE.Panel;
				}

				if (key === 'panelId') {
					return shape.id;
				}

				return undefined;
			},
		};
		const panelImage = {
			selectable: true,
			get: (key: string) => {
				if (key === 'objectType') {
					return FABRIC_OBJECT_TYPE.PanelImage;
				}

				if (key === 'panelId') {
					return shape.id;
				}

				return undefined;
			},
		};
		const registered: Record<string, (payload: unknown) => void> = {};
		const { canvas } = createCanvas(null);

		(canvas as { getObjects?: () => unknown[] }).getObjects = () => {
			return [panel, panelImage];
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

		expect(canvas.setActiveObject).toHaveBeenCalledWith(panelImage);
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
