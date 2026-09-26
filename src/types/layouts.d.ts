import type { PagePoint, ShapeImageJSON, ShapeStroke } from '@/types/page';

/**
 * Geometría de panel en un layout. `strokes` es opcional: los layouts
 * antiguos heredan el stroke de la capa en cada arista.
 */
export type LayoutShapeJSON = {
	id: string;
	points: PagePoint[];
	strokes?: ShapeStroke[];
	image: ShapeImageJSON | null;
};

/** Una capa: grid, márgenes y stroke por defecto para paneles nuevos. */
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
	strokeColor?: string;
};

/**
 * Layout de página: tamaño + capas (contenido solo en `layers`).
 */
export type LayoutJSON = {
	width: number;
	height: number;
	/** Fondo de página. Ausente en layouts antiguos: al aplicarlos se conserva el fondo actual. */
	backgroundColor?: string;
	layers: LayoutLayerJSON[];
};

export type PresetLayout = {
	id: string;
	layout: LayoutJSON;
};

/** Estado de carga lazy de presets empaquetados. */
export type PresetsLoadStatus = 'idle' | 'loading' | 'ready';
