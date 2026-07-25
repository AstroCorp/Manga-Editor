import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
	createCustomLayoutEntry,
	readCustomLayouts,
	writeCustomLayouts,
} from '@/lib/page/customLayouts';
import { listPresetLayouts } from '@/lib/page/presetLayouts';
import type { LayoutJSON, PresetLayout } from '@/types/page';

export const useLayoutsStore = defineStore('layouts', () => {
	const presets: PresetLayout[] = listPresetLayouts();
	const customLayouts = ref<PresetLayout[]>(readCustomLayouts());

	const addCustomLayout = (layout: LayoutJSON): PresetLayout => {
		const entry = createCustomLayoutEntry(layout);

		customLayouts.value = [...customLayouts.value, entry];
		writeCustomLayouts(customLayouts.value);

		return entry;
	};

	return {
		presets,
		customLayouts,
		addCustomLayout,
	};
});
