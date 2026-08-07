import { describe, it, expect } from 'vitest';
import {
	isLayoutJSON,
	listPresetIds,
	listPresetLayouts,
	loadPresetLayoutsByIds,
} from '@/lib/page/presetLayouts';
import type { PresetLayout } from '@/types/layouts';

describe('presetLayouts', () => {
	it('isLayoutJSON accepts width, height and layers', () => {
		expect(
			isLayoutJSON({
				width: 100,
				height: 200,
				layers: [{ shapes: [] }],
			}),
		).toBe(true);
	});

	it('isLayoutJSON rejects invalid payloads', () => {
		expect(isLayoutJSON(null)).toBe(false);
		expect(isLayoutJSON({ name: 'x' })).toBe(false);
		expect(
			isLayoutJSON({
				width: 1,
				height: 1,
			}),
		).toBe(false);
		expect(
			isLayoutJSON({
				width: 1,
				height: 1,
				layers: [],
			}),
		).toBe(false);
		expect(
			isLayoutJSON({
				width: 1,
				height: 1,
				layers: 'nope',
			}),
		).toBe(false);
	});

	it('listPresetIds returns sorted packaged ids without loading JSON', () => {
		const ids = listPresetIds();

		expect(ids.length).toBeGreaterThanOrEqual(1);
		expect(ids).toContain('01');
		expect([...ids].sort((a, b) => a.localeCompare(b))).toEqual(ids);
	});

	it('loadPresetLayoutsByIds loads only requested presets', async () => {
		const presets = await loadPresetLayoutsByIds(['01']);

		expect(presets).toHaveLength(1);
		expect(presets[0]?.id).toBe('01');
		expect(presets[0]?.layout.layers.length).toBeGreaterThanOrEqual(1);
	});

	it('listPresetLayouts loads packaged JSON presets', async () => {
		const presets: PresetLayout[] = await listPresetLayouts();

		expect(presets.length).toBeGreaterThanOrEqual(1);
		expect(
			presets.some((preset: PresetLayout) => {
				return preset.id === '01';
			}),
		).toBe(true);
		expect(
			presets.every((preset: PresetLayout) => {
				const layout = preset.layout;

				return (
					Array.isArray(layout.layers) &&
					layout.layers.length >= 1 &&
					!('shapes' in layout) &&
					!('id' in layout) &&
					!('name' in layout)
				);
			}),
		).toBe(true);
	});
});
