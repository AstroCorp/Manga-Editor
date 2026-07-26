import { useLocalStorage } from '@vueuse/core';
import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
	CUSTOM_LAYOUTS_STORAGE_KEY,
	createCustomLayoutEntry,
	customLayoutsSerializer,
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
	const customLayouts = useLocalStorage<PresetLayout[]>(
		CUSTOM_LAYOUTS_STORAGE_KEY,
		[],
		{ serializer: customLayoutsSerializer },
	);

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

		return entry;
	};

	const removeCustomLayout = (layoutId: string): boolean => {
		const next = customLayouts.value.filter((entry) => {
			return entry.id !== layoutId;
		});

		if (next.length === customLayouts.value.length) {
			return false;
		}

		customLayouts.value = next;

		return true;
	};

	return {
		presets,
		presetsStatus,
		customLayouts,
		ensurePresetsLoaded,
		addCustomLayout,
		removeCustomLayout,
	};
});
