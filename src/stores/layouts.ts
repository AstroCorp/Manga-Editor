import { useLocalStorage } from '@vueuse/core';
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
	CUSTOM_LAYOUTS_STORAGE_KEY,
	createCustomLayoutEntry,
	customLayoutsSerializer,
} from '@/lib/page/customLayouts';
import {
	listPresetIds,
	loadPresetLayoutsByIds,
} from '@/lib/page/presetLayouts';
import { PRESETS_LOAD_STATUS } from '@/lib/layouts/presetsLoadStatus';
import type {
	LayoutJSON,
	PresetLayout,
	PresetsLoadStatus,
} from '@/types/layouts';

const PRESET_PAGE_SIZE = 6;

export const useLayoutsStore = defineStore('layouts', () => {
	const presetIds = ref<string[]>([]);
	const presets = ref<PresetLayout[]>([]);
	const presetsStatus = ref<PresetsLoadStatus>(PRESETS_LOAD_STATUS.Idle);
	const presetsLoadingMore = ref(false);
	const customLayouts = useLocalStorage<PresetLayout[]>(
		CUSTOM_LAYOUTS_STORAGE_KEY,
		[],
		{ serializer: customLayoutsSerializer },
	);

	const hasMorePresets = computed(() => {
		return presets.value.length < presetIds.value.length;
	});

	const appendPresetPage = async (count: number) => {
		const loaded = new Set(
			presets.value.map((preset) => {
				return preset.id;
			}),
		);
		const nextIds = presetIds.value
			.filter((id) => {
				return !loaded.has(id);
			})
			.slice(0, count);

		if (nextIds.length === 0) {
			return false;
		}

		const batch = await loadPresetLayoutsByIds(nextIds);

		presets.value = [...presets.value, ...batch];

		return batch.length > 0;
	};

	/** Primera página de presets empaquetados (al abrir el panel Layouts). */
	const ensurePresetsLoaded = async () => {
		if (presetsStatus.value !== PRESETS_LOAD_STATUS.Idle) {
			return;
		}

		presetsStatus.value = PRESETS_LOAD_STATUS.Loading;

		try {
			presetIds.value = listPresetIds();
			presets.value = [];
			await appendPresetPage(PRESET_PAGE_SIZE);
			presetsStatus.value = PRESETS_LOAD_STATUS.Ready;
		} catch {
			presetIds.value = [];
			presets.value = [];
			presetsStatus.value = PRESETS_LOAD_STATUS.Idle;
		}
	};

	/** Siguiente página de JSON de presets (infinite scroll). */
	const loadMorePresets = async (count = PRESET_PAGE_SIZE) => {
		if (
			presetsStatus.value !== PRESETS_LOAD_STATUS.Ready ||
			presetsLoadingMore.value ||
			!hasMorePresets.value
		) {
			return false;
		}

		presetsLoadingMore.value = true;

		try {
			return await appendPresetPage(count);
		} catch {
			return false;
		} finally {
			presetsLoadingMore.value = false;
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
		presetIds,
		presets,
		presetsStatus,
		presetsLoadingMore,
		hasMorePresets,
		customLayouts,
		ensurePresetsLoaded,
		loadMorePresets,
		addCustomLayout,
		removeCustomLayout,
	};
});
