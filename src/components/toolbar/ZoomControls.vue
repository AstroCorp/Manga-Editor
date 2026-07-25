<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { MAX_ZOOM_PERCENT, MIN_ZOOM_PERCENT } from '@/lib/zoom';
import { useEditorStore } from '@/stores/editor';

const editorStore = useEditorStore();
const { zoomPercent } = storeToRefs(editorStore);

const onZoomInput = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value);

	if (!Number.isFinite(value)) {
		return;
	}

	editorStore.setZoomPercent(value);
};
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
		<label
			class="flex h-9 items-center rounded-md border border-slate-200 bg-white pr-2 pl-2.5 text-sm text-slate-900 transition hover:border-blue-600/50 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus-within:border-blue-500 dark:focus-within:ring-blue-500/25"
		>
			<span class="sr-only">Zoom</span>
			<input
				type="number"
				class="w-10 border-0 bg-transparent p-0 text-center text-sm text-inherit tabular-nums outline-none"
				:value="zoomPercent"
				:min="MIN_ZOOM_PERCENT"
				:max="MAX_ZOOM_PERCENT"
				@change="onZoomInput"
			/>
			<span
				class="select-none text-slate-500 dark:text-slate-400 ml-1"
				aria-hidden="true"
			>
				%
			</span>
		</label>
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
