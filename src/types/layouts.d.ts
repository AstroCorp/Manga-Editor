import type { ShapeJSON } from '@/types/page';

/** Una capa dentro de un layout (formato multi-capa). */
export type LayoutLayerJSON = {
	name?: string;
	visible?: boolean;
	shapes?: ShapeJSON[];
	gridCols?: number;
	gridRows?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	strokeWidth?: number;
};

/**
 * Layout de página.
 * Legado: `shapes` + métricas en la raíz = una sola capa.
 * Multi-capa: `layers` (si hay ítems, tiene prioridad sobre la raíz).
 */
export type LayoutJSON = {
	width: number;
	height: number;
	shapes: ShapeJSON[];
	gridCols?: number;
	gridRows?: number;
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
	strokeWidth?: number;
	layers?: LayoutLayerJSON[];
};

export type PresetLayout = {
	id: string;
	layout: LayoutJSON;
};

/** Estado de carga lazy de presets empaquetados. */
export type PresetsLoadStatus = 'idle' | 'loading' | 'ready';
