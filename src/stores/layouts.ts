/**
 * Catálogo de layouts: presets empaquetados (lazy) + custom en localStorage.
 */
import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
	createCustomLayoutEntry,
	readCustomLayouts,
	writeCustomLayouts,
} from '@/lib/page/customLayouts';
import { listPresetLayouts } from '@/lib/page/presetLayouts';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import type {
	LayoutJSON,
	PresetLayout,
	PresetsLoadStatus,
} from '@/types/layouts';

export const useLayoutsStore = defineStore('layouts', () => {
	const presets = ref<PresetLayout[]>([]);
	const presetsStatus = ref<PresetsLoadStatus>(PRESETS_LOAD_STATUS.Idle);
	const customLayouts = ref<PresetLayout[]>(readCustomLayouts());

	/** Carga presets empaquetados una sola vez (al abrir el panel Layouts). */
	const ensurePresetsLoaded = async () => {
		if (presetsStatus.value !== PRESETS_LOAD_STATUS.Idle) {
			return;
		}

		presetsStatus.value = PRESETS_LOAD_STATUS.Loading;

		try {
			presets.value = await listPresetLayouts();
			presetsStatus.value = PRESETS_LOAD_STATUS.Ready;
		} catch {
			presets.value = [];
			presetsStatus.value = PRESETS_LOAD_STATUS.Idle;
		}
	};

	const addCustomLayout = (layout: LayoutJSON): PresetLayout => {
		const entry = createCustomLayoutEntry(layout);

		customLayouts.value = [...customLayouts.value, entry];
		writeCustomLayouts(customLayouts.value);

		return entry;
	};

	return {
		presets,
		presetsStatus,
		customLayouts,
		ensurePresetsLoaded,
		addCustomLayout,
	};
});
