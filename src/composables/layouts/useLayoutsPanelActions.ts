import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useNearBottomLoad } from '@/composables/ui/useNearBottomLoad';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { isSingleLayerLayout } from '@/lib/page/resolveLayoutFields';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import { useEditorStore } from '@/stores/editor';
import { useLayoutsStore } from '@/stores/layouts';
import type { PresetLayout } from '@/types/layouts';

/** Acciones del panel Layouts. */
export const useLayoutsPanelActions = () => {
	const editorStore = useEditorStore();
	const layoutsStore = useLayoutsStore();
	const { pageHasDrawing, activeLayerHasDrawing } = useActivePageLayout();
	const {
		presets,
		presetsStatus,
		presetsLoadingMore,
		hasMorePresets,
		customLayouts,
	} = storeToRefs(layoutsStore);

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

	const presetsLoading = computed(() => {
		return presetsStatus.value === PRESETS_LOAD_STATUS.Loading;
	});

	const {
		scrollEl: presetsScrollEl,
		sentinelEl: presetsSentinelEl,
		notifyLayoutReady: notifyPresetsLayoutReady,
		tryLoadMore: tryLoadMorePresets,
	} = useNearBottomLoad({
		waitForLayoutReady: true,
		canLoadMore: () => {
			return hasMorePresets.value && !presetsLoadingMore.value;
		},
		onLoadMore: () => {
			void layoutsStore.loadMorePresets().then((loaded) => {
				if (!loaded) {
					notifyPresetsLayoutReady();
				}
			});
		},
	});

	/** 1 capa → capa activa; multi → cualquier capa con contenido. */
	const shouldConfirmApply = (preset: PresetLayout): boolean => {
		if (isSingleLayerLayout(preset.layout)) {
			return activeLayerHasDrawing.value;
		}

		return pageHasDrawing.value;
	};

	const applyMessage = computed(() => {
		if (pendingPreset.value && isSingleLayerLayout(pendingPreset.value.layout)) {
			return 'Replace the content of the current layer with the selected layout?';
		}

		return 'Replace all layers on this page with the selected layout?';
	});

	const applyLayout = (preset: PresetLayout) => {
		editorStore.applyPageLayout(preset.layout);
	};

	const requestApply = (preset: PresetLayout) => {
		if (shouldConfirmApply(preset)) {
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
		presets,
		customLayouts,
		presetsLoading,
		presetsLoadingMore,
		hasMorePresets,
		presetsScrollEl,
		presetsSentinelEl,
		notifyPresetsLayoutReady,
		tryLoadMorePresets,
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
