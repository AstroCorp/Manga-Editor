import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { CUSTOM_LAYOUTS_STORAGE_KEY } from '@/lib/page/customLayouts';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import * as presetLayouts from '@/lib/page/presetLayouts';
import { useLayoutsStore } from '@/stores/layouts';

describe('useLayoutsStore', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		localStorage.removeItem(CUSTOM_LAYOUTS_STORAGE_KEY);
		vi.restoreAllMocks();
	});

	it('loads the first preset page and can fetch more', async () => {
		const store = useLayoutsStore();

		expect(store.presetsStatus).toBe(PRESETS_LOAD_STATUS.Idle);

		await store.ensurePresetsLoaded();

		expect(store.presetsStatus).toBe(PRESETS_LOAD_STATUS.Ready);
		expect(store.presetIds.length).toBeGreaterThan(6);
		expect(store.presets).toHaveLength(6);
		expect(store.hasMorePresets).toBe(true);

		const firstLength = store.presets.length;

		await store.ensurePresetsLoaded();
		expect(store.presets).toHaveLength(firstLength);

		await store.loadMorePresets();

		expect(store.presets.length).toBeGreaterThan(firstLength);
		expect(store.presets.length).toBeLessThanOrEqual(store.presetIds.length);
	});

	it('loadMorePresets is a no-op before the first page is ready', async () => {
		const store = useLayoutsStore();

		expect(await store.loadMorePresets()).toBe(false);
		expect(store.presets).toEqual([]);
	});

	it('loadMorePresets stops when every preset id is loaded', async () => {
		const store = useLayoutsStore();

		await store.ensurePresetsLoaded();

		while (store.hasMorePresets) {
			await store.loadMorePresets();
		}

		expect(store.presets).toHaveLength(store.presetIds.length);
		expect(await store.loadMorePresets()).toBe(false);
	});

	it('adds and removes custom layouts', () => {
		const store = useLayoutsStore();
		const entry = store.addCustomLayout({
			width: 600,
			height: 900,
			layers: [
				{
					shapes: [
						{
							id: 'p1',
							points: [
								{ x: 0, y: 0 },
								{ x: 10, y: 0 },
								{ x: 10, y: 10 },
							],
							image: null,
						},
					],
					strokeWidth: 4,
				},
			],
		});

		expect(store.customLayouts).toHaveLength(1);
		expect(store.customLayouts[0]?.id).toBe(entry.id);
		expect(store.customLayouts[0]?.layout.layers[0]?.strokeWidth).toBe(4);
		expect(
			store.customLayouts[0]?.layout.layers[0]?.shapes?.[0],
		).not.toHaveProperty('strokeWidth');

		expect(store.removeCustomLayout('missing')).toBe(false);
		expect(store.removeCustomLayout(entry.id)).toBe(true);
		expect(store.customLayouts).toHaveLength(0);
	});

	it('resets to idle when preset listing fails', async () => {
		vi.spyOn(presetLayouts, 'listPresetIds').mockImplementationOnce(() => {
			throw new Error('network');
		});

		const store = useLayoutsStore();

		await store.ensurePresetsLoaded();

		expect(store.presets).toEqual([]);
		expect(store.presetsStatus).toBe(PRESETS_LOAD_STATUS.Idle);
	});
});
