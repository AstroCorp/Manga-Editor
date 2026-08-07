import type { Canvas } from 'fabric';
import type { Ref, ShallowRef } from 'vue';
import type { GridPoint } from '@/types/geometry';
import type {
	PageTextAnchor,
	TextBoxVerticalAlign,
	TextTextAlign,
} from '@/types/page';

export type SelectionDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	syncInteractionMode: () => void;
	cancelStroke: () => void;
};

export type TextColorToolbarDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	zoomFactor: Ref<number>;
	onChanged?: () => void;
};

export type GridPointHoverDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	strokePath: ShallowRef<GridPoint[]>;
};

export type ShapeActionMenuDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	onChanged?: () => void;
};

export type PageOverlayPosition = {
	left: number;
	top: number;
};

export type OverlayPlacement = 'above' | 'below';

export type PageOverlayAnchor = PageOverlayPosition & {
	placement: OverlayPlacement;
};

export type GridLineDelta = {
	x: number;
	y: number;
};

export type GridPointLabelProps = {
	delta: GridLineDelta | null;
	left: number | null;
	top: number | null;
};

export type ShapeActionMenuProps = {
	hasImage: boolean;
	isGrayscale: boolean;
	whiteFill: boolean;
	left: number | null;
	top: number | null;
	placement: OverlayPlacement;
};

export type ShapeActionMenuEmits = {
	deleteShape: [];
	clearImage: [];
	placeImage: [file: File];
	toggleGrayscale: [];
	toggleWhiteFill: [];
};

export type TextColorToolbarProps = {
	colors: string[];
	strokeColors: string[];
	bold: boolean;
	italic: boolean;
	underline: boolean;
	linethrough: boolean;
	fontSize: number | null;
	dominantFontSize: number;
	fontFamily: string | null;
	dominantFontFamily: string;
	strokeWidth: number | null;
	dominantStrokeWidth: number;
	lineHeight: number | null;
	dominantLineHeight: number;
	textAlign: TextTextAlign;
	hasBox: boolean;
	boxFill: string;
	boxStroke: string;
	boxStrokeWidth: number;
	boxCornerRadius: number;
	boxPadding: number;
	boxWidth: number;
	boxHeight: number;
	boxVerticalAlign: TextBoxVerticalAlign;
	left: number | null;
	top: number | null;
	placement: OverlayPlacement;
};

export type TextColorToolbarEmits = {
	setColor: [color: string];
	setStrokeColor: [color: string];
	toggleBold: [];
	toggleItalic: [];
	toggleUnderline: [];
	toggleLinethrough: [];
	setFontSize: [fontSize: number];
	setFontFamily: [fontFamily: string];
	setStrokeWidth: [strokeWidth: number];
	setLineHeight: [lineHeight: number];
	setTextAlign: [textAlign: TextTextAlign];
	setBoxFill: [color: string];
	setBoxStroke: [color: string];
	setBoxStrokeWidth: [strokeWidth: number];
	setBoxCornerRadius: [cornerRadius: number];
	setBoxPadding: [padding: number];
	setBoxWidth: [width: number];
	setBoxHeight: [height: number];
	setBoxVerticalAlign: [verticalAlign: TextBoxVerticalAlign];
	alignToPage: [anchor: PageTextAnchor];
	deleteText: [];
};
