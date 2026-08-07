import type { LayoutJSON, PresetLayout } from '@/types/layouts';

/** Type guard: width/height y al menos una capa. */
export const isLayoutJSON = (value: unknown): value is LayoutJSON => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	if (typeof data.width !== 'number' || typeof data.height !== 'number') {
		return false;
	}

	if (!Array.isArray(data.layers) || data.layers.length < 1) {
		return false;
	}

	return true;
};

const normalizePresetLayout = (value: LayoutJSON): LayoutJSON => {
	return {
		width: value.width,
		height: value.height,
		layers: value.layers,
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
				layout: normalizePresetLayout(value),
			});
		}),
	);

	return presets.sort((a, b) => {
		return a.id.localeCompare(b.id, undefined, {
			sensitivity: 'base',
		});
	});
};
