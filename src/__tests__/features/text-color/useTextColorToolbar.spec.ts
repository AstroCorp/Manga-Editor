import { describe, expect, it, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref, shallowRef } from 'vue';
import { useTextColorToolbar } from '@/features/text-color/useTextColorToolbar';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { DEFAULT_TEXT_FONT_SIZE, TextBlock } from '@/models/TextBlock';
import { useMangaStore } from '@/stores/manga';
import type { Canvas, FabricObject } from 'fabric';
import type { TextTextAlign } from '@/types/page';

type TextObjectMock = {
	text: string;
	left: number;
	top: number;
	width: number;
	fontSize: number;
	fill: string;
	fontWeight: string;
	fontStyle: string;
	underline: boolean;
	linethrough: boolean;
	stroke: string | null;
	strokeWidth: number;
	lineHeight: number;
	textAlign: TextTextAlign;
	angle: number;
	styles: Record<string, Record<string, Record<string, unknown>>>;
	isEditing: boolean;
	selectionStart: number;
	selectionEnd: number;
	get: (key: string) => unknown;
	set: ReturnType<typeof vi.fn>;
	setSelectionStyles: ReturnType<typeof vi.fn>;
	removeStyle: ReturnType<typeof vi.fn>;
	getSelectionStyles: () => Array<Record<string, unknown>>;
	getBoundingRect: () => {
		left: number;
		top: number;
		width: number;
		height: number;
	};
	setCoords: ReturnType<typeof vi.fn>;
	initDimensions: ReturnType<typeof vi.fn>;
	calcTextWidth: () => number;
	aCoords: {
		bl: { x: number; y: number };
		br: { x: number; y: number };
	};
};

const createTextObject = (text: TextBlock): TextObjectMock => {
	const textObject: TextObjectMock = {
		text: text.content,
		left: text.left,
		top: text.top,
		width: text.width,
		fontSize: text.fontSize,
		fill: text.fill,
		fontWeight: text.fontWeight,
		fontStyle: text.fontStyle,
		underline: text.underline,
		linethrough: text.linethrough,
		stroke: text.stroke,
		strokeWidth: text.strokeWidth,
		lineHeight: text.lineHeight,
		textAlign: text.textAlign,
		angle: text.angle,
		styles: {},
		isEditing: false,
		selectionStart: 0,
		selectionEnd: 0,
		get: (key: string) => {
			if (key === 'objectType') {
				return FABRIC_OBJECT_TYPE.Text;
			}

			if (key === 'textId') {
				return text.id;
			}

			return textObject[key as keyof TextObjectMock];
		},
		set: vi.fn((key: string | Record<string, unknown>, value?: unknown) => {
			if (typeof key === 'object') {
				Object.assign(textObject, key);

				return;
			}

			(textObject as Record<string, unknown>)[key] = value;
		}),
		setSelectionStyles: vi.fn(),
		removeStyle: vi.fn(),
		getSelectionStyles: () => {
			return [{}];
		},
		calcTextWidth: () => {
			return textObject.width >= 1_000_000
				? textObject.fontSize * 5
				: textObject.width;
		},
		getBoundingRect: () => {
			return {
				left: textObject.left,
				top: textObject.top,
				width: textObject.width,
				height: textObject.fontSize,
			};
		},
		setCoords: vi.fn(),
		initDimensions: vi.fn(),
		aCoords: {
			bl: { x: text.left, y: text.top + text.fontSize },
			br: { x: text.left + text.width, y: text.top + text.fontSize },
		},
	};

	return textObject;
};

const createCanvas = (textObject: TextObjectMock | null) => {
	const handlers: Record<string, () => void> = {};
	const canvas = {
		on: (event: string, handler: () => void) => {
			handlers[event] = handler;
		},
		off: vi.fn(),
		getActiveObject: () => {
			return textObject as unknown as FabricObject;
		},
		requestRenderAll: vi.fn(),
	} as unknown as Canvas;

	return { canvas, handlers };
};

const createToolbar = (
	canvas: Canvas | null,
	overrides: {
		rootEl?: HTMLElement | null;
		zoomFactor?: number;
		onChanged?: () => void;
	} = {},
) => {
	return useTextColorToolbar({
		fabricCanvas: shallowRef(canvas),
		rootEl: ref(overrides.rootEl ?? null),
		zoomFactor: ref(overrides.zoomFactor ?? 1),
		onChanged: overrides.onChanged,
	});
};

describe('useTextColorToolbar', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('setFontSize updates fabric and persists TextBlock', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(10, 20);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();

		expect(api.fontSize.value).toBe(text.fontSize);

		api.setFontSize(36);

		expect(textObject.set).toHaveBeenCalledWith('fontSize', 36);
		expect(textObject.removeStyle).toHaveBeenCalledWith('fontSize');
		expect(textObject.initDimensions).toHaveBeenCalled();
		expect(mangaStore.texts[0]?.fontSize).toBe(36);
		expect(api.fontSize.value).toBe(36);
		expect(canvas.requestRenderAll).toHaveBeenCalled();
	});

	it('setFontSize ignores invalid sizes', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.setFontSize(Number.NaN);

		expect(textObject.set).not.toHaveBeenCalled();
		expect(mangaStore.texts[0]?.fontSize).toBe(DEFAULT_TEXT_FONT_SIZE);
	});

	it('toggleBold applies bold to the active text', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.toggleBold();

		expect(textObject.set).toHaveBeenCalledWith({ fontWeight: 'bold' });
		expect(mangaStore.texts[0]?.fontWeight).toBe('bold');
	});

	it('applies italic, underline and strikethrough toggles', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.toggleItalic();
		api.toggleUnderline();
		api.toggleLinethrough();

		expect(textObject.set).toHaveBeenCalledWith({ fontStyle: 'italic' });
		expect(textObject.set).toHaveBeenCalledWith({ underline: true });
		expect(textObject.set).toHaveBeenCalledWith({ linethrough: true });
		expect(mangaStore.texts[0]?.fontStyle).toBe('italic');
		expect(mangaStore.texts[0]?.underline).toBe(true);
		expect(mangaStore.texts[0]?.linethrough).toBe(true);
	});

	it('setColor updates fill and persists', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.setColor('#ff0000');

		expect(textObject.set).toHaveBeenCalledWith({ fill: '#ff0000' });
		expect(mangaStore.texts[0]?.fill).toBe('#ff0000');
		expect(api.color.value).toBe('#ff0000');
	});

	it('applies styles to the selection range while editing', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);

		textObject.isEditing = true;
		textObject.selectionStart = 0;
		textObject.selectionEnd = 4;
		textObject.getSelectionStyles = () => {
			return [{}, {}, {}, {}];
		};

		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.toggleBold();
		api.setColor('#00ff00');

		expect(textObject.setSelectionStyles).toHaveBeenCalledWith(
			{ fontWeight: 'bold' },
			0,
			4,
		);
		expect(textObject.setSelectionStyles).toHaveBeenCalledWith(
			{ fill: '#00ff00' },
			0,
			4,
		);
		expect(textObject.set).not.toHaveBeenCalled();
	});

	it('setFontSize is a no-op without selection', () => {
		const api = createToolbar(null);

		expect(() => {
			api.setFontSize(40);
		}).not.toThrow();
	});

	it('clearMenu resets format state on selection:cleared', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.setFontSize(40);
		handlers['selection:cleared']?.();

		expect(api.position.value).toBeNull();
		expect(api.fontSize.value).toBe(DEFAULT_TEXT_FONT_SIZE);
		expect(api.bold.value).toBe(false);
	});

	it('tracks mixed colors from selection styles', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);

		textObject.isEditing = true;
		textObject.selectionStart = 0;
		textObject.selectionEnd = 2;
		textObject.getSelectionStyles = () => {
			return [{ fill: '#ff0000' }, { fill: '#0000ff' }];
		};

		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();

		expect(api.colors.value).toEqual(['#ff0000', '#0000ff']);
		expect(api.color.value).toBe('#ff0000');
	});

	it('unbinds canvas events when fabricCanvas is cleared', async () => {
		const text = TextBlock.create(0, 0);
		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const fabricCanvas = shallowRef<Canvas | null>(canvas);
		const api = useTextColorToolbar({ fabricCanvas, rootEl: ref(null), zoomFactor: ref(1) });

		handlers['selection:created']?.();
		expect(api.position.value).not.toBeNull();

		fabricCanvas.value = null;
		await nextTick();

		expect(canvas.off).toHaveBeenCalled();
		expect(api.position.value).toBeNull();
	});

	it('setStrokeColor and setStrokeWidth update fabric and persist', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.setStrokeColor('#00ff00');
		api.setStrokeWidth(4);

		expect(textObject.set).toHaveBeenCalledWith({ stroke: '#00ff00' });
		expect(mangaStore.texts[0]?.stroke).toBe('#00ff00');
		expect(mangaStore.texts[0]?.strokeWidth).toBe(4);
		expect(api.strokeWidth.value).toBe(4);
		expect(api.strokeColors.value[0]).toBe('#00ff00');
	});

	it('setLineHeight updates fabric and persists TextBlock', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.setLineHeight(1.8);

		expect(textObject.set).toHaveBeenCalledWith('lineHeight', 1.8);
		expect(textObject.initDimensions).toHaveBeenCalled();
		expect(mangaStore.texts[0]?.lineHeight).toBe(1.8);
		expect(api.lineHeight.value).toBe(1.8);
	});

	it('alignToPage moves the text AABB to the page anchor', async () => {
		const mangaStore = useMangaStore();

		mangaStore.setActivePageSize(1000, 2000);

		const text = TextBlock.create(100, 200);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		textObject.getBoundingRect = () => {
			return {
				left: textObject.left,
				top: textObject.top,
				width: textObject.width,
				height: 80,
			};
		};

		const stage = {
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 1000, height: 2000 };
			},
		};
		const rootEl = {
			firstElementChild: stage,
			clientWidth: 400,
			clientHeight: 300,
			scrollWidth: 1000,
			scrollHeight: 2000,
			scrollLeft: 0,
			scrollTop: 0,
			getBoundingClientRect: () => {
				return { left: 0, top: 0, width: 400, height: 300 };
			},
			scrollTo(options: ScrollToOptions) {
				this.scrollLeft = options.left ?? this.scrollLeft;
				this.scrollTop = options.top ?? this.scrollTop;
			},
		} as unknown as HTMLElement;

		const { canvas, handlers } = createCanvas(textObject);
		const calcOffset = vi.fn();

		Object.assign(canvas, { calcOffset });

		const api = createToolbar(canvas, { rootEl });

		handlers['selection:created']?.();
		api.alignToPage('bottom-right');
		await nextTick();

		expect(textObject.set).toHaveBeenCalledWith({
			left: 800,
			top: 1920,
		});
		expect(mangaStore.texts[0]?.left).toBe(800);
		expect(mangaStore.texts[0]?.top).toBe(1920);
		// Centro (900, 1960); viewport 400×300 → scroll clampado al máximo disponible
		expect(rootEl.scrollLeft).toBe(600);
		expect(rootEl.scrollTop).toBe(1700);
		expect(calcOffset).toHaveBeenCalled();
	});

	it('deleteText removes the active text from store and canvas', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);
		const onChanged = vi.fn();

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const remove = vi.fn();
		const discardActiveObject = vi.fn();

		Object.assign(canvas, { remove, discardActiveObject });

		const api = createToolbar(canvas, { onChanged });

		handlers['selection:created']?.();
		api.deleteText();

		expect(mangaStore.texts).toHaveLength(0);
		expect(remove).toHaveBeenCalledWith(textObject);
		expect(discardActiveObject).toHaveBeenCalled();
		expect(api.position.value).toBeNull();
		expect(onChanged).toHaveBeenCalled();
	});

	it('setTextAlign updates fabric and persists', () => {
		const mangaStore = useMangaStore();
		const text = TextBlock.create(0, 0);

		mangaStore.addText(text);

		const textObject = createTextObject(text);
		const { canvas, handlers } = createCanvas(textObject);
		const api = createToolbar(canvas);

		handlers['selection:created']?.();
		api.setTextAlign('justify-center');

		expect(textObject.set).toHaveBeenCalledWith('textAlign', 'justify-center');
		expect(mangaStore.texts[0]?.textAlign).toBe('justify-center');
		expect(api.textAlign.value).toBe('justify-center');
	});
});
