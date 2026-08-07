import type { Serializer } from '@vueuse/core';
import { createId } from '@/lib/id';
import { isLayoutJSON } from '@/lib/page/presetLayouts';
import type {
	LayoutJSON,
	LayoutLayerJSON,
	LayoutShapeJSON,
	PresetLayout,
} from '@/types/layouts';

export const CUSTOM_LAYOUTS_STORAGE_KEY = 'manga-editor-custom-layouts';

const stripShapeImages = (
	shapes: LayoutShapeJSON[] | undefined,
): LayoutShapeJSON[] => {
	return (shapes ?? []).map((shape) => {
		return {
			id: shape.id,
			points: shape.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			image: null,
		};
	});
};

/** Geometría lista para catálogo (sin id/name de página ni imágenes). */
const normalizeLayoutForCatalog = (layout: LayoutJSON): LayoutJSON => {
	const layers: LayoutLayerJSON[] = layout.layers.map((layer) => {
		return {
			name: layer.name,
			visible: layer.visible,
			shapes: stripShapeImages(layer.shapes),
			gridCols: layer.gridCols,
			gridRows: layer.gridRows,
			marginTop: layer.marginTop,
			marginRight: layer.marginRight,
			marginBottom: layer.marginBottom,
			marginLeft: layer.marginLeft,
			strokeWidth: layer.strokeWidth,
		};
	});

	return {
		width: layout.width,
		height: layout.height,
		layers,
	};
};

const isPresetLayoutEntry = (value: unknown): value is PresetLayout => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return typeof data.id === 'string' && isLayoutJSON(data.layout);
};

const parseCustomLayouts = (raw: string): PresetLayout[] => {
	try {
		const parsed: unknown = JSON.parse(raw);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed.filter(isPresetLayoutEntry).map((entry) => {
			return {
				id: entry.id,
				layout: normalizeLayoutForCatalog(entry.layout),
			};
		});
	} catch {
		return [];
	}
};

export const customLayoutsSerializer: Serializer<PresetLayout[]> = {
	read: (raw) => {
		return parseCustomLayouts(raw);
	},
	write: (value) => {
		return JSON.stringify(value);
	},
};

export const createCustomLayoutEntry = (layout: LayoutJSON): PresetLayout => {
	return {
		id: createId(),
		layout: normalizeLayoutForCatalog(layout),
	};
};
