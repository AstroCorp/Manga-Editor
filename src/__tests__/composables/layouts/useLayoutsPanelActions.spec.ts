import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLayoutsPanelActions } from '@/composables/layouts/useLayoutsPanelActions';
import { Shape } from '@/models/Shape';
import { useEditorStore } from '@/stores/editor';
import { useLayoutsStore } from '@/stores/layouts';
import { useMangaStore } from '@/stores/manga';
import type { PresetLayout } from '@/types/layouts';

const samplePreset = (id: string): PresetLayout => {
	return {
		id,
		layout: {
			width: 600,
			height: 900,
			shapes: [
				{
					id: 'panel-1',
					points: [
						{ x: 0, y: 0 },
						{ x: 40, y: 0 },
						{ x: 40, y: 40 },
					],
					strokeWidth: 2,
					image: null,
				},
			],
		},
	};
};

describe('useLayoutsPanelActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('applies a layout immediately on an empty page', () => {
		const editorStore = useEditorStore();
		const applyPageLayout = vi.spyOn(editorStore, 'applyPageLayout');
		const { requestApply, pendingPreset } = useLayoutsPanelActions();
		const preset = samplePreset('01');

		requestApply(preset);

		expect(pendingPreset.value).toBeNull();
		expect(applyPageLayout).toHaveBeenCalledExactlyOnceWith(preset.layout);
	});

	it('confirms apply when the page already has drawings', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const applyPageLayout = vi.spyOn(editorStore, 'applyPageLayout');
		const { requestApply, confirmApply, cancelApply, pendingPreset } =
			useLayoutsPanelActions();
		const preset = samplePreset('02');

		mangaStore.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				2,
			),
		);

		requestApply(preset);
		expect(pendingPreset.value).toEqual(preset);
		expect(applyPageLayout).not.toHaveBeenCalled();

		cancelApply();
		expect(pendingPreset.value).toBeNull();

		requestApply(preset);
		confirmApply();

		expect(pendingPreset.value).toBeNull();
		expect(applyPageLayout).toHaveBeenCalledExactlyOnceWith(preset.layout);
	});

	it('confirms apply when there are multiple layers even if empty', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const applyPageLayout = vi.spyOn(editorStore, 'applyPageLayout');
		const { requestApply, pendingPreset } = useLayoutsPanelActions();
		const preset = samplePreset('03');

		mangaStore.addLayer();
		requestApply(preset);

		expect(pendingPreset.value).toEqual(preset);
		expect(applyPageLayout).not.toHaveBeenCalled();
	});

	it('confirms custom layout deletion', () => {
		const layoutsStore = useLayoutsStore();
		const removeCustomLayout = vi.spyOn(layoutsStore, 'removeCustomLayout');
		const {
			requestDeleteCustom,
			confirmDeleteCustom,
			cancelDeleteCustom,
			pendingDeleteCustom,
		} = useLayoutsPanelActions();
		const preset = samplePreset('custom-1');

		requestDeleteCustom(preset);
		expect(pendingDeleteCustom.value).toEqual(preset);

		cancelDeleteCustom();
		expect(pendingDeleteCustom.value).toBeNull();
		expect(removeCustomLayout).not.toHaveBeenCalled();

		requestDeleteCustom(preset);
		confirmDeleteCustom();

		expect(removeCustomLayout).toHaveBeenCalledExactlyOnceWith('custom-1');
	});

	it('delegates JSON export and import', () => {
		const editorStore = useEditorStore();
		const exportPageJson = vi.spyOn(editorStore, 'exportPageJson');
		const importPageJson = vi
			.spyOn(editorStore, 'importPageJson')
			.mockResolvedValue(undefined);
		const { exportJson, importJson } = useLayoutsPanelActions();
		const file = new File(['{}'], 'page.json', { type: 'application/json' });

		exportJson();
		importJson(file);

		expect(exportPageJson).toHaveBeenCalledOnce();
		expect(importPageJson).toHaveBeenCalledExactlyOnceWith(file);
	});
});
