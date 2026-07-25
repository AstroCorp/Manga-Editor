import { describe, it, expect } from 'vitest';
import {
	isLayoutJSON,
	listPresetLayouts,
} from '@/lib/page/presetLayouts';
import type { PresetLayout } from '@/types/layouts';

describe('presetLayouts', () => {
	it('isLayoutJSON accepts minimal page geometry', () => {
		expect(
			isLayoutJSON({
				width: 100,
				height: 200,
			}),
		).toBe(true);

		expect(
			isLayoutJSON({
				width: 100,
				height: 200,
				shapes: [],
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
				shapes: 'nope',
			}),
		).toBe(false);
	});

	it('listPresetLayouts loads packaged JSON presets', async () => {
		const presets: PresetLayout[] = await listPresetLayouts();

		expect(presets.length).toBeGreaterThanOrEqual(1);
		expect(
			presets.some((preset: PresetLayout) => {
				return preset.id === 'blank';
			}),
		).toBe(true);
		expect(
			presets.every((preset: PresetLayout) => {
				return (
					Array.isArray(preset.layout.shapes) &&
					!('id' in preset.layout) &&
					!('name' in preset.layout)
				);
			}),
		).toBe(true);
	});
});
