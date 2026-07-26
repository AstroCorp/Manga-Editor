import type { Canvas } from 'fabric';
import type { ShallowRef } from 'vue';
import type { GridPoint } from '@/types/geometry';

export type GuidesDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
};

export type SelectionDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	syncInteractionMode: () => void;
	cancelStroke: () => void;
};

export type StrokeDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
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
	visible: boolean;
	hasImage: boolean;
	left: number | null;
	top: number | null;
};

export type ShapeActionMenuEmits = {
	deleteShape: [];
	clearImage: [];
	placeImage: [file: File];
};
