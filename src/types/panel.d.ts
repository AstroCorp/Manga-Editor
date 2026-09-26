import type { Canvas } from 'fabric';
import type { Ref, ShallowRef } from 'vue';
import type { CanvasActions } from '@/types/editor';
import type { GridPoint } from '@/types/geometry';
import type {
	PageTextAnchor,
	ShapeStroke,
	ShapeStrokePatch,
	TextBoxVerticalAlign,
	TextTextAlign,
} from '@/types/page';

export type SelectionDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	syncInteractionMode: () => void;
	cancelStroke: () => void;
	discardSelection: () => void;
	registerCanvasAction: (partial: Partial<CanvasActions>) => void;
	onAfterPageApply: (hook: () => void) => void;
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

export type RotationAngleLabelDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
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

export type RotationAngleLabelProps = {
	angle: number | null;
	left: number | null;
	top: number | null;
};

export type ShapeActionMenuProps = {
	hasImage: boolean;
	isGrayscale: boolean;
	isFlipX: boolean;
	isFlipY: boolean;
	whiteFill: boolean;
	/** Trazo de cada arista del panel seleccionado (orden de sus puntos). */
	strokes: ShapeStroke[];
	left: number | null;
	top: number | null;
	placement: OverlayPlacement;
};

export type ShapeActionMenuEmits = {
	deleteShape: [];
	clearImage: [];
	placeImage: [file: File];
	toggleGrayscale: [];
	toggleFlipX: [];
	toggleFlipY: [];
	toggleWhiteFill: [];
	/** Cambio definitivo de una arista (se registra en el historial). */
	setEdgeStroke: [edgeIndex: number, patch: ShapeStrokePatch];
	/** Cambio en vivo mientras se arrastra el color picker (sin historial). */
	previewEdgeStroke: [edgeIndex: number, patch: ShapeStrokePatch];
	/** Fila de arista bajo el cursor o el foco; `null` al salir. */
	hoverEdge: [edgeIndex: number | null];
};

export type EdgeStrokeMenuProps = {
	strokes: ShapeStroke[];
};

export type EdgeStrokeMenuEmits = Pick<
	ShapeActionMenuEmits,
	'setEdgeStroke' | 'previewEdgeStroke' | 'hoverEdge'
>;

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
