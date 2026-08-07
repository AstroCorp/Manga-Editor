import { computed, nextTick, shallowRef, watch } from 'vue';
import type { Canvas, FabricObject, Textbox } from 'fabric';
import { getTextId, isGuide, isPageText } from '@/lib/fabric/isGuide';
import { getObjectOverlayAnchor } from '@/lib/fabric/overlayAnchor';
import { alignTextToPage } from '@/lib/fabric/pageAlign';
import {
	applyTextBoxStyle,
	getPageTextbox,
	getTextBoxStyle,
	syncBoxedTextGeometry,
	textBlockFromFabric,
} from '@/lib/fabric/textFabric';
import {
	applyTextAlign,
	applyTextFontFamily,
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
import { normalizeFontFamilyName } from '@/lib/fonts/googleFontsCatalog';
import { ensureFontFamilyLoaded } from '@/lib/fonts/loadGoogleFont';
import { scrollPageRectIntoView } from '@/lib/fabric/visiblePagePoint';
import {
	DEFAULT_TEXT_ALIGN,
	DEFAULT_TEXT_BOX,
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_FAMILY,
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_LINE_HEIGHT,
	DEFAULT_TEXT_STROKE,
	DEFAULT_TEXT_STROKE_WIDTH,
} from '@/models/TextBlock';
import { useMangaStore } from '@/stores/manga';
import type { PageTextObject } from '@/types/fabric';
import type {
	OverlayPlacement,
	PageOverlayPosition,
	TextColorToolbarDeps,
} from '@/types/panel';
import type { PageTextAnchor, TextBoxVerticalAlign, TextCharStyle, TextTextAlign } from '@/types/page';

const DEFAULT_FLAGS: TextFormatFlags = {
	bold: false,
	italic: false,
	underline: false,
	linethrough: false,
	fontSize: DEFAULT_TEXT_FONT_SIZE,
	dominantFontSize: DEFAULT_TEXT_FONT_SIZE,
	fontFamily: DEFAULT_TEXT_FONT_FAMILY,
	dominantFontFamily: DEFAULT_TEXT_FONT_FAMILY,
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
	'object:resizing',
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
	const fontFamily = shallowRef<string | null>(DEFAULT_FLAGS.fontFamily);
	const dominantFontFamily = shallowRef(DEFAULT_FLAGS.dominantFontFamily);
	const strokeWidth = shallowRef<number | null>(DEFAULT_FLAGS.strokeWidth);
	const dominantStrokeWidth = shallowRef(DEFAULT_FLAGS.dominantStrokeWidth);
	const lineHeight = shallowRef<number | null>(DEFAULT_FLAGS.lineHeight);
	const dominantLineHeight = shallowRef(DEFAULT_FLAGS.dominantLineHeight);
	const textAlign = shallowRef<TextTextAlign>(DEFAULT_FLAGS.textAlign);
	const hasBox = shallowRef(false);
	const boxFill = shallowRef(DEFAULT_TEXT_BOX.fill);
	const boxStroke = shallowRef(DEFAULT_TEXT_BOX.stroke);
	const boxStrokeWidth = shallowRef(DEFAULT_TEXT_BOX.strokeWidth);
	const boxCornerRadius = shallowRef(DEFAULT_TEXT_BOX.cornerRadius);
	const boxPadding = shallowRef(DEFAULT_TEXT_BOX.padding);
	const boxWidth = shallowRef(DEFAULT_TEXT_BOX.width);
	const boxHeight = shallowRef(DEFAULT_TEXT_BOX.height);
	const boxVerticalAlign = shallowRef<TextBoxVerticalAlign>(
		DEFAULT_TEXT_BOX.verticalAlign,
	);
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
		fontFamily.value = DEFAULT_FLAGS.fontFamily;
		dominantFontFamily.value = DEFAULT_FLAGS.dominantFontFamily;
		strokeWidth.value = DEFAULT_FLAGS.strokeWidth;
		dominantStrokeWidth.value = DEFAULT_FLAGS.dominantStrokeWidth;
		lineHeight.value = DEFAULT_FLAGS.lineHeight;
		dominantLineHeight.value = DEFAULT_FLAGS.dominantLineHeight;
		textAlign.value = DEFAULT_FLAGS.textAlign;
		hasBox.value = false;
		boxFill.value = DEFAULT_TEXT_BOX.fill;
		boxStroke.value = DEFAULT_TEXT_BOX.stroke;
		boxStrokeWidth.value = DEFAULT_TEXT_BOX.strokeWidth;
		boxCornerRadius.value = DEFAULT_TEXT_BOX.cornerRadius;
		boxPadding.value = DEFAULT_TEXT_BOX.padding;
		boxWidth.value = DEFAULT_TEXT_BOX.width;
		boxHeight.value = DEFAULT_TEXT_BOX.height;
		boxVerticalAlign.value = DEFAULT_TEXT_BOX.verticalAlign;
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

	const persistActiveText = (object: PageTextObject) => {
		const id = getTextId(object);

		if (!id) {
			return;
		}

		syncBoxedTextGeometry(object);
		mangaStore.updateText(id, textBlockFromFabric(object));
	};

	const applyFlags = (flags: TextFormatFlags) => {
		bold.value = flags.bold;
		italic.value = flags.italic;
		underline.value = flags.underline;
		linethrough.value = flags.linethrough;
		fontSize.value = flags.fontSize;
		dominantFontSize.value = flags.dominantFontSize;
		fontFamily.value = flags.fontFamily;
		dominantFontFamily.value = flags.dominantFontFamily;
		strokeWidth.value = flags.strokeWidth;
		dominantStrokeWidth.value = flags.dominantStrokeWidth;
		lineHeight.value = flags.lineHeight;
		dominantLineHeight.value = flags.dominantLineHeight;
		textAlign.value = flags.textAlign;
	};

	const applyBoxFlags = (object: PageTextObject) => {
		const box = getTextBoxStyle(object);

		hasBox.value = Boolean(box);

		if (!box) {
			return;
		}

		boxFill.value = box.fill;
		boxStroke.value = box.stroke;
		boxStrokeWidth.value = box.strokeWidth;
		boxCornerRadius.value = box.cornerRadius;
		boxPadding.value = box.padding;
		boxWidth.value = box.width;
		boxHeight.value = box.height;
		boxVerticalAlign.value = box.verticalAlign;
	};

	const refreshMenu = () => {
		const canvas = fabricCanvas.value;
		const active = getActiveText();
		const textbox = active ? getPageTextbox(active) : null;

		if (!canvas || !active || !textbox || !getTextId(active)) {
			clearMenu();

			return;
		}

		const anchor = getObjectOverlayAnchor(active);

		colors.value = collectTextColors(textbox);
		strokeColors.value = collectTextStrokeColors(textbox);
		applyFlags(collectTextFormat(textbox));
		applyBoxFlags(active);
		position.value = { left: anchor.left, top: anchor.top };
		placement.value = anchor.placement;
	};

	const withActivePageText = (mutate: (object: PageTextObject) => void) => {
		const canvas = fabricCanvas.value;
		const active = getActiveText();

		if (!canvas || !active) {
			return;
		}

		mutate(active);
		persistActiveText(active);
		canvas.requestRenderAll();
		refreshMenu();
	};

	const withActiveTextbox = (mutate: (textbox: Textbox) => void) => {
		withActivePageText((active) => {
			const textbox = getPageTextbox(active);

			if (!textbox) {
				return;
			}

			mutate(textbox);
		});
	};

	const setColor = (nextColor: string) => {
		withActiveTextbox((textbox) => {
			applyTextStyle(textbox, { fill: toHexColor(nextColor) });
		});
	};

	const setStrokeColor = (nextColor: string) => {
		withActiveTextbox((textbox) => {
			applyTextStyle(textbox, { stroke: toHexColor(nextColor, DEFAULT_TEXT_STROKE) });
		});
	};

	const applyToggle = (styles: Partial<TextCharStyle>) => {
		withActiveTextbox((textbox) => {
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

		withActiveTextbox((textbox) => {
			applyTextFontSize(textbox, size);
		});
	};

	const setFontFamily = async (nextFamily: string) => {
		const family = normalizeFontFamilyName(nextFamily);

		if (!family) {
			return;
		}

		await ensureFontFamilyLoaded(family);

		withActiveTextbox((textbox) => {
			applyTextFontFamily(textbox, family);
		});
	};

	const setStrokeWidth = (nextWidth: number) => {
		const width = normalizeStrokeWidth(nextWidth);

		if (width === null) {
			return;
		}

		withActiveTextbox((textbox) => {
			applyTextStrokeWidth(textbox, width);
		});
	};

	const setLineHeight = (nextHeight: number) => {
		const height = normalizeLineHeight(nextHeight);

		if (height === null) {
			return;
		}

		withActiveTextbox((textbox) => {
			applyTextLineHeight(textbox, height);
		});
	};

	const setTextAlign = (nextAlign: TextTextAlign) => {
		const align = normalizeTextAlign(nextAlign);

		if (!align) {
			return;
		}

		withActiveTextbox((textbox) => {
			applyTextAlign(textbox, align);
		});
	};

	const alignToPage = (anchor: PageTextAnchor) => {
		const page = mangaStore.activePage;
		const root = rootEl.value;
		const zoom = zoomFactor.value;

		withActivePageText((object) => {
			alignTextToPage(
				object,
				{ width: page.width, height: page.height },
				anchor,
			);
		});

		// Tras el focus del select (preventScroll) y el reposition de la toolbar.
		void nextTick(() => {
			const object = getActiveText();

			if (!root || !object) {
				return;
			}

			object.setCoords?.();
			scrollPageRectIntoView(root, object.getBoundingRect(), zoom);
			fabricCanvas.value?.calcOffset();
			refreshMenu();
		});
	};

	const clampBoxMetric = (value: number) => {
		return Math.max(0, Math.round(value));
	};

	const setBoxFill = (color: string) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, { fill: toHexColor(color, DEFAULT_TEXT_BOX.fill) });
		});
	};

	const setBoxStroke = (color: string) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, {
				stroke: toHexColor(color, DEFAULT_TEXT_BOX.stroke),
			});
		});
	};

	const setBoxStrokeWidth = (strokeWidth: number) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, {
				strokeWidth: clampBoxMetric(strokeWidth),
			});
		});
	};

	const setBoxCornerRadius = (cornerRadius: number) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, {
				cornerRadius: clampBoxMetric(cornerRadius),
			});
		});
	};

	const setBoxPadding = (padding: number) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, {
				padding: clampBoxMetric(padding),
			});
		});
	};

	const setBoxWidth = (width: number) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, {
				width: Math.max(1, clampBoxMetric(width)),
			});
		});
	};

	const setBoxHeight = (height: number) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, {
				height: Math.max(1, clampBoxMetric(height)),
			});
		});
	};

	const setBoxVerticalAlign = (verticalAlign: TextBoxVerticalAlign) => {
		withActivePageText((object) => {
			applyTextBoxStyle(object, { verticalAlign });
		});
	};

	const deleteText = () => {
		const canvas = fabricCanvas.value;
		const object = getActiveText();
		const id = object ? getTextId(object) : null;

		if (!canvas || !object || !id) {
			return;
		}

		mangaStore.removeText(id);
		canvas.remove(object);
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
		fontFamily,
		dominantFontFamily,
		strokeWidth,
		dominantStrokeWidth,
		lineHeight,
		dominantLineHeight,
		textAlign,
		hasBox,
		boxFill,
		boxStroke,
		boxStrokeWidth,
		boxCornerRadius,
		boxPadding,
		boxWidth,
		boxHeight,
		boxVerticalAlign,
		position,
		placement,
		setColor,
		setStrokeColor,
		toggleBold,
		toggleItalic,
		toggleUnderline,
		toggleLinethrough,
		setFontSize,
		setFontFamily,
		setStrokeWidth,
		setLineHeight,
		setTextAlign,
		setBoxFill,
		setBoxStroke,
		setBoxStrokeWidth,
		setBoxCornerRadius,
		setBoxPadding,
		setBoxWidth,
		setBoxHeight,
		setBoxVerticalAlign,
		alignToPage,
		deleteText,
		clearMenu,
	};
};
