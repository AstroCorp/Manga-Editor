import type { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';
import type { Ref } from 'vue';
import type { Layer } from '@/models/Layer';

export type PagePoint = {
	x: number;
	y: number;
};

export type ShapeImageJSON = {
	src: string;
	left: number;
	top: number;
	scaleX: number;
	scaleY: number;
	originX: 'center' | 'left';
	originY: 'center' | 'top';
	width: number;
	height: number;
	/** Filtro B/N (opcional para layouts antiguos). */
	grayscale?: boolean;
};

export type ShapeJSON = {
	id: string;
	points: PagePoint[];
	strokeWidth: number;
	image: ShapeImageJSON | null;
};

export type ShapeLike =
	| Pick<ShapeJSON, 'points' | 'strokeWidth' | 'image'>
	| Shape;

export type PagePreviewPanel = {
	points: string;
	strokeWidth: number;
};

export type PagePreviewImage = {
	href: string;
	x: number;
	y: number;
	width: number;
	height: number;
	grayscale: boolean;
};

export type PagePreviewModel = {
	width: number;
	height: number;
	panels: PagePreviewPanel[];
	images: PagePreviewImage[];
};

export type ContentResetDeps = {
	contentResetEpoch: Ref<number>;
	applyReset: () => Promise<void>;
	discardSelection?: () => void;
};

export type PageRotateDirection = 'clockwise' | 'counterclockwise';

export type PageMarginSide =
	| 'marginTop'
	| 'marginRight'
	| 'marginBottom'
	| 'marginLeft';

export type PageMargins = Record<PageMarginSide, number>;

export type ShapeImageValue = {
	src: string;
	left: number;
	top: number;
	scaleX: number;
	scaleY: number;
	originX?: 'center' | 'left';
	originY?: 'center' | 'top';
	width?: number;
	height?: number;
	grayscale?: boolean;
};

export type ShapeValue = {
	id: string;
	points: PagePoint[];
	strokeWidth: number;
	image?: ShapeImage | null;
};

export type LayerValue = {
	id: string;
	name: string;
	visible?: boolean;
	shapes?: Shape[];
	gridCols?: number;
	gridRows?: number;
	strokeWidth?: number;
};

export type ResetLayerOptions = {
	gridCols?: number;
	gridRows?: number;
	margins?: PageMargins;
	strokeWidth?: number;
};

export type PageValue = {
	id: string;
	name: string;
	width: number;
	height: number;
	layers?: Layer[];
	activeLayerId?: string;
};

