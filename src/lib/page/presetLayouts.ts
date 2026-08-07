import type { LayoutJSON, PresetLayout } from '@/types/layouts';

/** Type guard: width/height; shapes/layers opcionales. */
export const isLayoutJSON = (value: unknown): value is LayoutJSON => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	if (typeof data.width !== 'number' || typeof data.height !== 'number') {
		return false;
	}

	if (data.shapes !== undefined && !Array.isArray(data.shapes)) {
		return false;
	}

	if (data.layers !== undefined && !Array.isArray(data.layers)) {
		return false;
	}

	return true;
};

const toLayoutJSON = (value: LayoutJSON): LayoutJSON => {
	const shapes = value.shapes ?? [];
	const layers =
		value.layers && value.layers.length > 0
			? value.layers
			: [
					{
						shapes,
						gridCols: value.gridCols,
						gridRows: value.gridRows,
						marginTop: value.marginTop,
						marginRight: value.marginRight,
						marginBottom: value.marginBottom,
						marginLeft: value.marginLeft,
						strokeWidth: value.strokeWidth,
					},
				];

	return {
		width: value.width,
		height: value.height,
		shapes,
		gridCols: value.gridCols,
		gridRows: value.gridRows,
		marginTop: value.marginTop,
		marginRight: value.marginRight,
		marginBottom: value.marginBottom,
		marginLeft: value.marginLeft,
		strokeWidth: value.strokeWidth,
		layers,
	};
};

/**
 * Layouts por defecto en `src/layouts/*.json`.
 * Lazy: Vite parte chunks y solo se piden al listar presets.
 */
const modules = import.meta.glob('../../layouts/*.json', {
	import: 'default',
}) as Record<string, () => Promise<unknown>>;

const fileIdFromPath = (path: string): string => {
	const file = path.split('/').pop() ?? path;

	return file.replace(/\.json$/i, '');
};

export const listPresetLayouts = async (): Promise<PresetLayout[]> => {
	const presets: PresetLayout[] = [];

	await Promise.all(
		Object.entries(modules).map(async ([path, load]) => {
			const value = await load();

			if (!isLayoutJSON(value)) {
				return;
			}

			presets.push({
				id: fileIdFromPath(path),
				layout: toLayoutJSON(value),
			});
		}),
	);

	return presets.sort((a, b) => {
		return a.id.localeCompare(b.id, undefined, {
			sensitivity: 'base',
		});
	});
};
