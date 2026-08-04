<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
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
import type { PageMarginSide, PageRotateDirection } from '@/types/page';

const mangaStore = useMangaStore();
const editorStore = useEditorStore();
const { activePage, pageSize, gridSize, margins, strokeWidth } =
	useActivePageLayout();

const pendingRotate = ref<PageRotateDirection | null>(null);

const pageHasDrawing = computed(() => {
	return activePage.value.shapes.length > 0;
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

	mangaStore.setActivePageStrokeWidth(value);
};

const applyRotate = (direction: PageRotateDirection) => {
	editorStore.cancelStroke();
	mangaStore.rotateActivePage(direction);
};

const requestRotate = (direction: PageRotateDirection) => {
	if (pageHasDrawing.value) {
		pendingRotate.value = direction;

		return;
	}

	applyRotate(direction);
};

const cancelRotate = () => {
	pendingRotate.value = null;
};

const confirmRotate = () => {
	const direction = pendingRotate.value;

	pendingRotate.value = null;

	if (!direction) {
		return;
	}

	applyRotate(direction);
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
			<div
				class="flex items-center justify-between gap-3"
				aria-label="Rotate page"
			>
				<span class="text-sm text-slate-500 dark:text-slate-400">Rotate</span>
				<div class="flex items-center gap-1.5">
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600/50 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-950 dark:hover:text-blue-400"
						aria-label="Rotate page counterclockwise"
						title="Rotate page counterclockwise"
						@click="requestRotate('counterclockwise')"
					>
						<Icon
							icon="fluent:arrow-rotate-counterclockwise-24-regular"
							class="size-5"
						/>
					</button>
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-600/50 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-950 dark:hover:text-blue-400"
						aria-label="Rotate page clockwise"
						title="Rotate page clockwise"
						@click="requestRotate('clockwise')"
					>
						<Icon
							icon="fluent:arrow-rotate-clockwise-24-regular"
							class="size-5"
						/>
					</button>
				</div>
			</div>
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
					:value="strokeWidth"
					:min="MIN_STROKE_WIDTH"
					:max="MAX_STROKE_WIDTH"
					@input="onStrokeWidthChange"
				/>
			</label>
		</section>

		<ConfirmModal
			v-if="pendingRotate"
			title="Rotate page"
			:message="`Rotate '${activePage.name}'? Panels will be removed.`"
			confirm-label="Rotate"
			cancel-label="Cancel"
			@confirm="confirmRotate"
			@cancel="cancelRotate"
		/>
	</div>
</template>
