import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import { useEditorStore } from '@/stores/editor';
import { useLayoutsStore } from '@/stores/layouts';
import type { PresetLayout } from '@/types/layouts';

/** Acciones del panel Layouts. */
export const useLayoutsPanelActions = () => {
	const editorStore = useEditorStore();
	const layoutsStore = useLayoutsStore();
	const { activePage, pageHasDrawing } = useActivePageLayout();
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

	const presetsLoading = computed(() => {
		return presetsStatus.value === PRESETS_LOAD_STATUS.Loading;
	});

	/** Confirmar si hay dibujo o más de una capa (el apply borra todo). */
	const shouldConfirmApply = computed(() => {
		return pageHasDrawing.value || activePage.value.layers.length > 1;
	});

	const applyMessage = computed(() => {
		return 'Replace all layers on this page with the selected layout?';
	});

	const applyLayout = (preset: PresetLayout) => {
		editorStore.applyPageLayout(preset.layout);
	};

	const requestApply = (preset: PresetLayout) => {
		if (shouldConfirmApply.value) {
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
