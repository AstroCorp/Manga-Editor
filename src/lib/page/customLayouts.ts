import type { Serializer } from '@vueuse/core';
import { createId } from '@/lib/id';
import { isLayoutJSON } from '@/lib/page/presetLayouts';
import type { LayoutJSON, PresetLayout } from '@/types/layouts';

export const CUSTOM_LAYOUTS_STORAGE_KEY = 'manga-editor-custom-layouts';

/** Geometría lista para catálogo (sin id/name de página ni imágenes). */
const normalizeLayoutForCatalog = (layout: LayoutJSON): LayoutJSON => {
	const pageStroke = layout.strokeWidth;
	const shapes = (layout.shapes ?? []).map((shape) => {
		return {
			id: shape.id,
			points: shape.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokeWidth: pageStroke ?? shape.strokeWidth,
			image: null,
		};
	});

	return {
		width: layout.width,
		height: layout.height,
		shapes,
		gridCols: layout.gridCols,
		gridRows: layout.gridRows,
		marginTop: layout.marginTop,
		marginRight: layout.marginRight,
		marginBottom: layout.marginBottom,
		marginLeft: layout.marginLeft,
		strokeWidth: layout.strokeWidth,
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
				layout: normalizeLayoutForCatalog({
					...entry.layout,
					shapes: entry.layout.shapes ?? [],
				}),
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
		layout: normalizeLayoutForCatalog({
			...layout,
			shapes: layout.shapes ?? [],
		}),
	};
};
