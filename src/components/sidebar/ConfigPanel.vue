<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import {
	MAX_GRID_POINTS,
	MAX_PAGE_SIZE,
	MAX_STROKE_WIDTH,
	MIN_GRID_POINTS,
	MIN_PAGE_SIZE,
	MIN_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { PageMarginSide } from '@/types/page';

const mangaStore = useMangaStore();
const editorStore = useEditorStore();
const { selectedStrokeWidth } = storeToRefs(editorStore);
const { activePage, pageSize, gridSize, margins, strokeWidth } =
	useActivePageLayout();

/** Con selección: stroke del panel; sin ella: stroke por defecto de la página. */
const panelStrokeWidth = computed(() => {
	return selectedStrokeWidth.value ?? strokeWidth.value;
});

const onWidthChange = (event: Event) => {
	mangaStore.setActivePageSize(
		Number((event.target as HTMLInputElement).value),
		pageSize.value.height,
	);
};

const onHeightChange = (event: Event) => {
	mangaStore.setActivePageSize(
		pageSize.value.width,
		Number((event.target as HTMLInputElement).value),
	);
};

const onColsChange = (event: Event) => {
	mangaStore.setActivePageGrid(
		Number((event.target as HTMLInputElement).value),
		gridSize.value.rows,
	);
};

const onRowsChange = (event: Event) => {
	mangaStore.setActivePageGrid(
		gridSize.value.cols,
		Number((event.target as HTMLInputElement).value),
	);
};

const onMarginChange = (side: PageMarginSide, event: Event) => {
	const page = activePage.value;

	mangaStore.setActivePageMargins({
		marginTop: page.marginTop,
		marginRight: page.marginRight,
		marginBottom: page.marginBottom,
		marginLeft: page.marginLeft,
		[side]: Number((event.target as HTMLInputElement).value),
	});
};

const onStrokeWidthChange = (event: Event) => {
	const value = Number((event.target as HTMLInputElement).value);

	if (!Number.isFinite(value)) {
		return;
	}

	if (selectedStrokeWidth.value !== null) {
		editorStore.setSelectionStrokeWidth(value);

		return;
	}

	mangaStore.setActivePageStrokeWidth(value);
};
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Page configuration">
		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Page size
			</h3>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Width</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					:value="pageSize.width"
					:min="MIN_PAGE_SIZE"
					:max="MAX_PAGE_SIZE"
					@change="onWidthChange"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Height</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					:value="pageSize.height"
					:min="MIN_PAGE_SIZE"
					:max="MAX_PAGE_SIZE"
					@change="onHeightChange"
				/>
			</label>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Grid
			</h3>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Columns</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					:value="gridSize.cols"
					:min="MIN_GRID_POINTS"
					:max="MAX_GRID_POINTS"
					@change="onColsChange"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Rows</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					:value="gridSize.rows"
					:min="MIN_GRID_POINTS"
					:max="MAX_GRID_POINTS"
					@change="onRowsChange"
				/>
			</label>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Margins
			</h3>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Top</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					min="0"
					:value="margins.marginTop"
					@change="onMarginChange('marginTop', $event)"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Right</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					min="0"
					:value="margins.marginRight"
					@change="onMarginChange('marginRight', $event)"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Bottom</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					min="0"
					:value="margins.marginBottom"
					@change="onMarginChange('marginBottom', $event)"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Left</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					min="0"
					:value="margins.marginLeft"
					@change="onMarginChange('marginLeft', $event)"
				/>
			</label>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Stroke
			</h3>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Width</span>
				<input
					type="number"
					class="w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
					:value="panelStrokeWidth"
					:min="MIN_STROKE_WIDTH"
					:max="MAX_STROKE_WIDTH"
					@input="onStrokeWidthChange"
				/>
			</label>
		</section>
	</div>
</template>
