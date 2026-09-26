import type { Ref } from 'vue';
import type {
	PageTextAnchor,
	ShapeStroke,
	ShapeStrokePatch,
	TextBoxVerticalAlign,
	TextTextAlign,
} from '@/types/page';

/** API viva del panel seleccionado, publicada por el menú de forma. */
export type ShapeInspectorApi = {
	elementId: Ref<string | null>;
	hasImage: Ref<boolean>;
	isGrayscale: Ref<boolean>;
	isFlipX: Ref<boolean>;
	isFlipY: Ref<boolean>;
	fill: Ref<string | null>;
	strokes: Ref<ShapeStroke[]>;
	deleteShape: () => void;
	clearImage: () => void;
	placeImage: (file: File) => void;
	toggleGrayscale: () => void;
	toggleFlipX: () => void;
	toggleFlipY: () => void;
	toggleFill: () => void;
	setFillColor: (color: string) => void;
	previewFillColor: (color: string) => void;
	setEdgeStroke: (edgeIndex: number, patch: ShapeStrokePatch) => void;
	previewEdgeStroke: (edgeIndex: number, patch: ShapeStrokePatch) => void;
	highlightEdge: (edgeIndex: number | null) => void;
};

/** API viva del texto seleccionado, publicada por la toolbar de texto. */
export type TextInspectorApi = {
	elementId: Ref<string | null>;
	colors: Ref<string[]>;
	strokeColors: Ref<string[]>;
	bold: Ref<boolean>;
	italic: Ref<boolean>;
	underline: Ref<boolean>;
	linethrough: Ref<boolean>;
	fontSize: Ref<number | null>;
	dominantFontSize: Ref<number>;
	fontFamily: Ref<string | null>;
	dominantFontFamily: Ref<string>;
	strokeWidth: Ref<number | null>;
	dominantStrokeWidth: Ref<number>;
	lineHeight: Ref<number | null>;
	dominantLineHeight: Ref<number>;
	textAlign: Ref<TextTextAlign>;
	hasBox: Ref<boolean>;
	boxFill: Ref<string>;
	boxStroke: Ref<string>;
	boxStrokeWidth: Ref<number>;
	boxCornerRadius: Ref<number>;
	boxPadding: Ref<number>;
	boxWidth: Ref<number>;
	boxHeight: Ref<number>;
	boxVerticalAlign: Ref<TextBoxVerticalAlign>;
	setColor: (color: string) => void;
	setStrokeColor: (color: string) => void;
	toggleBold: () => void;
	toggleItalic: () => void;
	toggleUnderline: () => void;
	toggleLinethrough: () => void;
	setFontSize: (fontSize: number) => void;
	setFontFamily: (fontFamily: string) => void;
	setStrokeWidth: (strokeWidth: number) => void;
	setLineHeight: (lineHeight: number) => void;
	setTextAlign: (textAlign: TextTextAlign) => void;
	setBoxFill: (color: string) => void;
	setBoxStroke: (color: string) => void;
	setBoxStrokeWidth: (strokeWidth: number) => void;
	setBoxCornerRadius: (cornerRadius: number) => void;
	setBoxPadding: (padding: number) => void;
	setBoxWidth: (width: number) => void;
	setBoxHeight: (height: number) => void;
	setBoxVerticalAlign: (verticalAlign: TextBoxVerticalAlign) => void;
	alignToPage: (anchor: PageTextAnchor) => void;
	deleteText: () => void;
};
