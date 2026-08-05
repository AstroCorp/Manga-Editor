import { computed, shallowRef, watch } from 'vue';
import type { Canvas, FabricObject } from 'fabric';
import { getTextId, isGuide, isPageText } from '@/lib/fabric/isGuide';
import { getObjectOverlayAnchor } from '@/lib/fabric/overlayAnchor';
import { textBlockFromFabric } from '@/lib/fabric/textFabric';
import {
	applyTextFontSize,
	applyTextStyle,
	collectTextColors,
	collectTextFormat,
	normalizeFontSize,
	toHexColor,
	type TextFormatFlags,
} from '@/lib/fabric/textStyles';
import {
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_SIZE,
} from '@/models/TextBlock';
import { useMangaStore } from '@/stores/manga';
import type { PageTextObject } from '@/types/fabric';
import type { OverlayPlacement, PageOverlayPosition } from '@/types/panel';
import type { ShallowRef } from 'vue';
import type { TextCharStyle } from '@/types/page';

type TextColorToolbarDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
};

const DEFAULT_FLAGS: TextFormatFlags = {
	bold: false,
	italic: false,
	underline: false,
	linethrough: false,
	fontSize: DEFAULT_TEXT_FONT_SIZE,
	dominantFontSize: DEFAULT_TEXT_FONT_SIZE,
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

export const useTextColorToolbar = ({ fabricCanvas }: TextColorToolbarDeps) => {
	const mangaStore = useMangaStore();

	const colors = shallowRef<string[]>([DEFAULT_TEXT_FILL]);
	const bold = shallowRef(DEFAULT_FLAGS.bold);
	const italic = shallowRef(DEFAULT_FLAGS.italic);
	const underline = shallowRef(DEFAULT_FLAGS.underline);
	const linethrough = shallowRef(DEFAULT_FLAGS.linethrough);
	const fontSize = shallowRef<number | null>(DEFAULT_FLAGS.fontSize);
	const dominantFontSize = shallowRef(DEFAULT_FLAGS.dominantFontSize);
	const position = shallowRef<PageOverlayPosition | null>(null);
	const placement = shallowRef<OverlayPlacement>('above');

	const color = computed(() => {
		return colors.value[0] ?? DEFAULT_TEXT_FILL;
	});

	const clearMenu = () => {
		colors.value = [DEFAULT_TEXT_FILL];
		bold.value = DEFAULT_FLAGS.bold;
		italic.value = DEFAULT_FLAGS.italic;
		underline.value = DEFAULT_FLAGS.underline;
		linethrough.value = DEFAULT_FLAGS.linethrough;
		fontSize.value = DEFAULT_FLAGS.fontSize;
		dominantFontSize.value = DEFAULT_FLAGS.dominantFontSize;
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
		bold,
		italic,
		underline,
		linethrough,
		fontSize,
		dominantFontSize,
		position,
		placement,
		setColor,
		toggleBold,
		toggleItalic,
		toggleUnderline,
		toggleLinethrough,
		setFontSize,
		clearMenu,
	};
};
