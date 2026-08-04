import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import { useEditorStore } from '@/stores/editor';
import { useLayoutsStore } from '@/stores/layouts';
import { useMangaStore } from '@/stores/manga';
import type { PresetLayout } from '@/types/layouts';

/**
 * Acciones del panel Layouts (plano: solo stores + lib).
 * La UI puede combinarlo con `useActivePageLayout` si necesita lecturas extra.
 */
export const useLayoutsPanelActions = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const layoutsStore = useLayoutsStore();
	const { activePage } = storeToRefs(mangaStore);
	const { presets, presetsStatus, customLayouts } = storeToRefs(layoutsStore);

	const {
		pending: pendingPreset,
		request: requestPendingPreset,
		cancel: cancelApply,
		confirm: confirmPendingPreset,
	} = createConfirmPayload<PresetLayout>();

	const {
		pending: pendingDeleteCustom,
		request: requestPendingDelete,
		cancel: cancelDeleteCustom,
		confirm: confirmPendingDelete,
	} = createConfirmPayload<PresetLayout>();

	const pageHasDrawing = computed(() => {
		return activePage.value.shapes.length > 0;
	});

	const presetsLoading = computed(() => {
		return presetsStatus.value === PRESETS_LOAD_STATUS.Loading;
	});

	const applyMessage = computed(() => {
		return `Replace the content of '${activePage.value.name}'?`;
	});

	const applyLayout = (preset: PresetLayout) => {
		editorStore.applyPageLayout(preset.layout);
	};

	const requestApply = (preset: PresetLayout) => {
		if (pageHasDrawing.value) {
			requestPendingPreset(preset);

			return;
		}

		applyLayout(preset);
	};

	const confirmApply = () => {
		confirmPendingPreset(applyLayout);
	};

	const requestDeleteCustom = (preset: PresetLayout) => {
		requestPendingDelete(preset);
	};

	const confirmDeleteCustom = () => {
		confirmPendingDelete((preset) => {
			layoutsStore.removeCustomLayout(preset.id);
		});
	};

	return {
		activePage,
		presets,
		customLayouts,
		presetsLoading,
		pendingPreset,
		pendingDeleteCustom,
		applyMessage,
		loadPresets: () => {
			return layoutsStore.ensurePresetsLoaded();
		},
		requestApply,
		cancelApply,
		confirmApply,
		requestDeleteCustom,
		cancelDeleteCustom,
		confirmDeleteCustom,
		exportJson: () => {
			editorStore.exportPageJson();
		},
		importJson: (file: File) => {
			void editorStore.importPageJson(file);
		},
	};
};
