import type { ShapeJSON } from '@/types/page';

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
};

export type PresetLayout = {
	id: string;
	layout: LayoutJSON;
};

/** Estado de carga lazy de presets empaquetados. */
export type PresetsLoadStatus = 'idle' | 'loading' | 'ready';
