import type { Canvas } from 'fabric';
import type { ShallowRef } from 'vue';
import type { GridPoint } from '@/types/geometry';

export type SelectionDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	syncInteractionMode: () => void;
	cancelStroke: () => void;
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
	bold: boolean;
	italic: boolean;
	underline: boolean;
	linethrough: boolean;
	fontSize: number | null;
	dominantFontSize: number;
	left: number | null;
	top: number | null;
	placement: OverlayPlacement;
};

export type TextColorToolbarEmits = {
	setColor: [color: string];
	toggleBold: [];
	toggleItalic: [];
	toggleUnderline: [];
	toggleLinethrough: [];
	setFontSize: [fontSize: number];
};
