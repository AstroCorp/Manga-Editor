import type { LayoutJSON, PresetLayout } from '@/types/page';

/** Type guard: width/height; shapes opcionales (se normalizan a []). */
export const isLayoutJSON = (value: unknown): value is LayoutJSON => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	if (typeof data.width !== 'number' || typeof data.height !== 'number') {
		return false;
	}

	return data.shapes === undefined || Array.isArray(data.shapes);
};

const toLayoutJSON = (value: LayoutJSON): LayoutJSON => {
	return {
		width: value.width,
		height: value.height,
		shapes: value.shapes ?? [],
		gridCols: value.gridCols,
		gridRows: value.gridRows,
		marginTop: value.marginTop,
		marginRight: value.marginRight,
		marginBottom: value.marginBottom,
		marginLeft: value.marginLeft,
		strokeWidth: value.strokeWidth,
	};
};

/**
 * Layouts por defecto en `src/layouts/*.json`.
 * Añade más JSON en esa carpeta: Vite los incluye al recargar.
 */
const modules = import.meta.glob('../../layouts/*.json', {
	eager: true,
	import: 'default',
}) as Record<string, unknown>;

const fileIdFromPath = (path: string): string => {
	const file = path.split('/').pop() ?? path;

	return file.replace(/\.json$/i, '');
};

export const listPresetLayouts = (): PresetLayout[] => {
	const presets: PresetLayout[] = [];

	for (const [path, value] of Object.entries(modules)) {
		if (!isLayoutJSON(value)) {
			continue;
		}

		const id = fileIdFromPath(path);

		presets.push({
			id,
			layout: toLayoutJSON(value),
		});
	}

	return presets.sort((a, b) => {
		return a.id.localeCompare(b.id, undefined, {
			sensitivity: 'base',
		});
	});
};
