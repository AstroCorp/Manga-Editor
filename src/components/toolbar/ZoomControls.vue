<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import NumberInput from '@/components/ui/NumberInput.vue';
import { MAX_ZOOM_PERCENT, MIN_ZOOM_PERCENT } from '@/lib/zoom';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();
const { zoomPercent } = storeToRefs(editorStore);
</script>

<template>
	<div class="flex items-center gap-2" aria-label="Zoom">
		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			aria-label="Zoom out"
			title="Zoom out"
			:disabled="zoomPercent <= MIN_ZOOM_PERCENT"
			@click="editorStore.zoomOut()"
		>
			<Icon icon="fluent:zoom-out-24-regular" class="size-5" />
		</button>
		<NumberInput
			:model-value="zoomPercent"
			:min="MIN_ZOOM_PERCENT"
			:max="MAX_ZOOM_PERCENT"
			input-width-class="w-10"
			ariaLabel="Zoom"
			increase-label="Increase zoom"
			decrease-label="Decrease zoom"
			suffix="%"
			@update:model-value="editorStore.setZoomPercent"
		/>
		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			aria-label="Zoom in"
			title="Zoom in"
			:disabled="zoomPercent >= MAX_ZOOM_PERCENT"
			@click="editorStore.zoomIn()"
		>
			<Icon icon="fluent:zoom-in-24-regular" class="size-5" />
		</button>
		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			aria-label="Reset zoom"
			title="Reset zoom"
			@click="editorStore.resetZoom()"
		>
			<Icon icon="fluent:arrow-reset-24-regular" class="size-5" />
		</button>
	</div>
</template>
