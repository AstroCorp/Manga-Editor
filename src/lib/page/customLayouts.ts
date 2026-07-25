import { createId } from '@/lib/id';
import { isLayoutJSON } from '@/lib/page/presetLayouts';
import type { LayoutJSON, PresetLayout } from '@/types/page';

export const CUSTOM_LAYOUTS_STORAGE_KEY = 'manga-editor-custom-layouts';

/** Geometría lista para catálogo (sin id/name de página ni imágenes). */
export const normalizeLayoutForCatalog = (layout: LayoutJSON): LayoutJSON => {
	const shapes = (layout.shapes ?? []).map((shape) => {
		return {
			id: shape.id,
			points: shape.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokeWidth: shape.strokeWidth,
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

export const readCustomLayouts = (): PresetLayout[] => {
	if (typeof localStorage === 'undefined') {
		return [];
	}

	try {
		const raw = localStorage.getItem(CUSTOM_LAYOUTS_STORAGE_KEY);

		if (!raw) {
			return [];
		}

		const parsed: unknown = JSON.parse(raw);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.filter(isPresetLayoutEntry)
			.map((entry) => {
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

export const writeCustomLayouts = (layouts: PresetLayout[]): void => {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(CUSTOM_LAYOUTS_STORAGE_KEY, JSON.stringify(layouts));
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
