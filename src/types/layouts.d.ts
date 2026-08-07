import type { PagePoint, ShapeImageJSON } from '@/types/page';

/** Geometría de panel en un layout (el stroke vive en la capa). */
export type LayoutShapeJSON = {
	id: string;
	points: PagePoint[];
	image: ShapeImageJSON | null;
};

/** Una capa: grid, márgenes y stroke propios. */
export type LayoutLayerJSON = {
	name?: string;
	visible?: boolean;
	shapes?: LayoutShapeJSON[];
	gridCols?: number;
	gridRows?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	strokeWidth?: number;
};

/**
 * Layout de página: tamaño + capas (contenido solo en `layers`).
 */
export type LayoutJSON = {
	width: number;
	height: number;
	layers: LayoutLayerJSON[];
};

export type PresetLayout = {
	id: string;
	layout: LayoutJSON;
};

/** Estado de carga lazy de presets empaquetados. */
export type PresetsLoadStatus = 'idle' | 'loading' | 'ready';
