import { computed, nextTick, shallowRef, watch, type Ref, type ShallowRef } from 'vue';
import type { Canvas, FabricObject } from 'fabric';
import { getTextId, isGuide, isPageText } from '@/lib/fabric/isGuide';
import { getObjectOverlayAnchor } from '@/lib/fabric/overlayAnchor';
import { alignTextToPage } from '@/lib/fabric/pageAlign';
import { textBlockFromFabric } from '@/lib/fabric/textFabric';
import {
	applyTextAlign,
	applyTextFontSize,
	applyTextLineHeight,
	applyTextStrokeWidth,
	applyTextStyle,
	collectTextColors,
	collectTextFormat,
	collectTextStrokeColors,
	normalizeFontSize,
	normalizeLineHeight,
	normalizeStrokeWidth,
	normalizeTextAlign,
	toHexColor,
	type TextFormatFlags,
} from '@/lib/fabric/textStyles';
import { scrollPageRectIntoView } from '@/lib/fabric/visiblePagePoint';
import {
	DEFAULT_TEXT_ALIGN,
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_LINE_HEIGHT,
	DEFAULT_TEXT_STROKE,
	DEFAULT_TEXT_STROKE_WIDTH,
} from '@/models/TextBlock';
import { useMangaStore } from '@/stores/manga';
import type { PageTextObject } from '@/types/fabric';
import type { OverlayPlacement, PageOverlayPosition } from '@/types/panel';
import type { PageTextAnchor, TextCharStyle, TextTextAlign } from '@/types/page';

type TextColorToolbarDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	zoomFactor: Ref<number>;
	onChanged?: () => void;
};

const DEFAULT_FLAGS: TextFormatFlags = {
	bold: false,
	italic: false,
	underline: false,
	linethrough: false,
	fontSize: DEFAULT_TEXT_FONT_SIZE,
	dominantFontSize: DEFAULT_TEXT_FONT_SIZE,
	strokeWidth: DEFAULT_TEXT_STROKE_WIDTH,
	dominantStrokeWidth: DEFAULT_TEXT_STROKE_WIDTH,
	lineHeight: DEFAULT_TEXT_LINE_HEIGHT,
	dominantLineHeight: DEFAULT_TEXT_LINE_HEIGHT,
	textAlign: DEFAULT_TEXT_ALIGN,
};

const REFRESH_EVENTS = [
	'selection:created',
	'selection:updated',
	'object:modified',
	'object:moving',
	'object:scaling',
	'object:rotating',
	'text:editing:entered',
	'text:editing:exited',
	'text:selection:changed',
] as const;

export const useTextColorToolbar = ({
	fabricCanvas,
	rootEl,
	zoomFactor,
	onChanged,
}: TextColorToolbarDeps) => {
	const mangaStore = useMangaStore();

	const colors = shallowRef<string[]>([DEFAULT_TEXT_FILL]);
	const strokeColors = shallowRef<string[]>([DEFAULT_TEXT_STROKE]);
	const bold = shallowRef(DEFAULT_FLAGS.bold);
	const italic = shallowRef(DEFAULT_FLAGS.italic);
	const underline = shallowRef(DEFAULT_FLAGS.underline);
	const linethrough = shallowRef(DEFAULT_FLAGS.linethrough);
	const fontSize = shallowRef<number | null>(DEFAULT_FLAGS.fontSize);
	const dominantFontSize = shallowRef(DEFAULT_FLAGS.dominantFontSize);
	const strokeWidth = shallowRef<number | null>(DEFAULT_FLAGS.strokeWidth);
	const dominantStrokeWidth = shallowRef(DEFAULT_FLAGS.dominantStrokeWidth);
	const lineHeight = shallowRef<number | null>(DEFAULT_FLAGS.lineHeight);
	const dominantLineHeight = shallowRef(DEFAULT_FLAGS.dominantLineHeight);
	const textAlign = shallowRef<TextTextAlign>(DEFAULT_FLAGS.textAlign);
	const position = shallowRef<PageOverlayPosition | null>(null);
	const placement = shallowRef<OverlayPlacement>('above');

	const color = computed(() => {
		return colors.value[0] ?? DEFAULT_TEXT_FILL;
	});

	const clearMenu = () => {
		colors.value = [DEFAULT_TEXT_FILL];
		strokeColors.value = [DEFAULT_TEXT_STROKE];
		bold.value = DEFAULT_FLAGS.bold;
		italic.value = DEFAULT_FLAGS.italic;
		underline.value = DEFAULT_FLAGS.underline;
		linethrough.value = DEFAULT_FLAGS.linethrough;
		fontSize.value = DEFAULT_FLAGS.fontSize;
		dominantFontSize.value = DEFAULT_FLAGS.dominantFontSize;
		strokeWidth.value = DEFAULT_FLAGS.strokeWidth;
		dominantStrokeWidth.value = DEFAULT_FLAGS.dominantStrokeWidth;
		lineHeight.value = DEFAULT_FLAGS.lineHeight;
		dominantLineHeight.value = DEFAULT_FLAGS.dominantLineHeight;
		textAlign.value = DEFAULT_FLAGS.textAlign;
		position.value = null;
		placement.value = 'above';
	};

	const getActiveText = (): PageTextObject | null => {
		const active = fabricCanvas.value?.getActiveObject() as FabricObject | null;

		if (!active || isGuide(active) || !isPageText(active)) {
			return null;
		}

		return active as PageTextObject;
	};

	const persistActiveText = (textbox: PageTextObject) => {
		const id = getTextId(textbox);

		if (!id) {
			return;
		}

		mangaStore.updateText(id, textBlockFromFabric(textbox));
	};

	const applyFlags = (flags: TextFormatFlags) => {
		bold.value = flags.bold;
		italic.value = flags.italic;
		underline.value = flags.underline;
		linethrough.value = flags.linethrough;
		fontSize.value = flags.fontSize;
		dominantFontSize.value = flags.dominantFontSize;
		strokeWidth.value = flags.strokeWidth;
		dominantStrokeWidth.value = flags.dominantStrokeWidth;
		lineHeight.value = flags.lineHeight;
		dominantLineHeight.value = flags.dominantLineHeight;
		textAlign.value = flags.textAlign;
	};

	const refreshMenu = () => {
		const canvas = fabricCanvas.value;
		const textbox = getActiveText();

		if (!canvas || !textbox || !getTextId(textbox)) {
			clearMenu();

			return;
		}

		const anchor = getObjectOverlayAnchor(textbox);

		colors.value = collectTextColors(textbox);
		strokeColors.value = collectTextStrokeColors(textbox);
		applyFlags(collectTextFormat(textbox));
		position.value = { left: anchor.left, top: anchor.top };
		placement.value = anchor.placement;
	};

	const withActiveText = (mutate: (textbox: PageTextObject) => void) => {
		const canvas = fabricCanvas.value;
		const textbox = getActiveText();

		if (!canvas || !textbox) {
			return;
		}

		mutate(textbox);
		persistActiveText(textbox);
		canvas.requestRenderAll();
		refreshMenu();
	};

	const setColor = (nextColor: string) => {
		withActiveText((textbox) => {
			applyTextStyle(textbox, { fill: toHexColor(nextColor) });
		});
	};

	const setStrokeColor = (nextColor: string) => {
		withActiveText((textbox) => {
			applyTextStyle(textbox, { stroke: toHexColor(nextColor, DEFAULT_TEXT_STROKE) });
		});
	};

	const applyToggle = (styles: Partial<TextCharStyle>) => {
		withActiveText((textbox) => {
			applyTextStyle(textbox, styles);
		});
	};

	const toggleBold = () => {
		applyToggle({ fontWeight: bold.value ? 'normal' : 'bold' });
	};

	const toggleItalic = () => {
		applyToggle({ fontStyle: italic.value ? 'normal' : 'italic' });
	};

	const toggleUnderline = () => {
		applyToggle({ underline: !underline.value });
	};

	const toggleLinethrough = () => {
		applyToggle({ linethrough: !linethrough.value });
	};

	const setFontSize = (nextSize: number) => {
		const size = normalizeFontSize(nextSize);

		if (size === null) {
			return;
		}

		withActiveText((textbox) => {
			applyTextFontSize(textbox, size);
		});
	};

	const setStrokeWidth = (nextWidth: number) => {
		const width = normalizeStrokeWidth(nextWidth);

		if (width === null) {
			return;
		}

		withActiveText((textbox) => {
			applyTextStrokeWidth(textbox, width);
		});
	};

	const setLineHeight = (nextHeight: number) => {
		const height = normalizeLineHeight(nextHeight);

		if (height === null) {
			return;
		}

		withActiveText((textbox) => {
			applyTextLineHeight(textbox, height);
		});
	};

	const setTextAlign = (nextAlign: TextTextAlign) => {
		const align = normalizeTextAlign(nextAlign);

		if (!align) {
			return;
		}

		withActiveText((textbox) => {
			applyTextAlign(textbox, align);
		});
	};

	const alignToPage = (anchor: PageTextAnchor) => {
		const page = mangaStore.activePage;
		const root = rootEl.value;
		const zoom = zoomFactor.value;

		withActiveText((textbox) => {
			alignTextToPage(
				textbox,
				{ width: page.width, height: page.height },
				anchor,
			);
		});

		// Tras el focus del select (preventScroll) y el reposition de la toolbar.
		void nextTick(() => {
			const textbox = getActiveText();

			if (!root || !textbox) {
				return;
			}

			textbox.setCoords?.();
			scrollPageRectIntoView(root, textbox.getBoundingRect(), zoom);
			fabricCanvas.value?.calcOffset();
			refreshMenu();
		});
	};

	const deleteText = () => {
		const canvas = fabricCanvas.value;
		const textbox = getActiveText();
		const id = textbox ? getTextId(textbox) : null;

		if (!canvas || !textbox || !id) {
			return;
		}

		mangaStore.removeText(id);
		canvas.remove(textbox);
		canvas.discardActiveObject();
		clearMenu();
		onChanged?.();
		canvas.requestRenderAll();
	};

	const bindCanvasEvents = (canvas: Canvas) => {
		for (const event of REFRESH_EVENTS) {
			canvas.on(event, refreshMenu);
		}

		canvas.on('selection:cleared', clearMenu);
	};

	const unbindCanvasEvents = (canvas: Canvas) => {
		for (const event of REFRESH_EVENTS) {
			canvas.off(event, refreshMenu);
		}

		canvas.off('selection:cleared', clearMenu);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				clearMenu();

				return;
			}

			bindCanvasEvents(canvas);

			onCleanup(() => {
				unbindCanvasEvents(canvas);
				clearMenu();
			});
		},
		{ immediate: true },
	);

	return {
		color,
		colors,
		strokeColors,
		bold,
		italic,
		underline,
		linethrough,
		fontSize,
		dominantFontSize,
		strokeWidth,
		dominantStrokeWidth,
		lineHeight,
		dominantLineHeight,
		textAlign,
		position,
		placement,
		setColor,
		setStrokeColor,
		toggleBold,
		toggleItalic,
		toggleUnderline,
		toggleLinethrough,
		setFontSize,
		setStrokeWidth,
		setLineHeight,
		setTextAlign,
		alignToPage,
		deleteText,
		clearMenu,
	};
};
