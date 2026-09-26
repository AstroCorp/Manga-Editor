<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import ShapeElementOptions from '@/components/sidebar/ShapeElementOptions.vue';
import TextElementOptions from '@/components/sidebar/TextElementOptions.vue';
import { listLayerElements } from '@/lib/page/layerElements';
import { useMangaStore } from '@/stores/manga';
import { useSelectionStore } from '@/stores/selection';

const mangaStore = useMangaStore();
const selectionStore = useSelectionStore();
const { focused } = storeToRefs(selectionStore);

const elementLabel = computed(() => {
	const current = focused.value;

	if (!current) {
		return '';
	}

	const layer = mangaStore.layers.find((item) => {
		return item.id === current.layerId;
	});
	const fallback = current.kind === 'shape' ? 'Panel' : 'Text';

	if (!layer) {
		return fallback;
	}

	const match = listLayerElements(layer).find((item) => {
		return item.kind === current.kind && item.id === current.id;
	});

	return match?.label ?? fallback;
});
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Element options">
		<p
			v-if="!focused"
			class="py-5 text-sm text-slate-500 dark:text-slate-400"
		>
			Select a panel or a text to edit it. You can also use Show options on
			an element.
		</p>

		<template v-else>
			<p class="pt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
				{{ elementLabel }}
			</p>
			<ShapeElementOptions v-if="focused.kind === 'shape'" />
			<TextElementOptions v-else />
		</template>
	</div>
</template>
