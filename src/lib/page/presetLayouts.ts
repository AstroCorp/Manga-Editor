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
 * Lazy: Vite parte chunks; cada `load()` pide solo ese JSON.
 */
const modules = import.meta.glob('../../layouts/*.json', {
	import: 'default',
}) as Record<string, () => Promise<unknown>>;

const fileIdFromPath = (path: string): string => {
	const file = path.split('/').pop() ?? path;

	return file.replace(/\.json$/i, '');
};

const modulesById = new Map<string, () => Promise<unknown>>();

for (const [path, load] of Object.entries(modules)) {
	modulesById.set(fileIdFromPath(path), load);
}

const comparePresetId = (a: string, b: string) => {
	return a.localeCompare(b, undefined, { sensitivity: 'base' });
};

/** Ids de presets empaquetados (sin leer JSON). */
export const listPresetIds = (): string[] => {
	return [...modulesById.keys()].sort(comparePresetId);
};

/** Carga solo los presets indicados (chunks bajo demanda). */
export const loadPresetLayoutsByIds = async (
	ids: readonly string[],
): Promise<PresetLayout[]> => {
	const presets: PresetLayout[] = [];

	await Promise.all(
		ids.map(async (id) => {
			const load = modulesById.get(id);

			if (!load) {
				return;
			}

			const value = await load();

			if (!isLayoutJSON(value)) {
				return;
			}

			presets.push({
				id,
				layout: normalizePresetLayout(value),
			});
		}),
	);

	return presets.sort((a, b) => {
		return comparePresetId(a.id, b.id);
	});
};

/** Carga todos los presets (tests / utilidades). */
export const listPresetLayouts = async (): Promise<PresetLayout[]> => {
	return loadPresetLayoutsByIds(listPresetIds());
};
