<script setup lang="ts">
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { useLayerConfigActions } from '@/composables/page/useLayerConfigActions';
import { usePageConfigActions } from '@/composables/page/usePageConfigActions';
import {
	MAX_GRID_POINTS,
	MAX_PAGE_SIZE,
	MAX_STROKE_WIDTH,
	MIN_GRID_POINTS,
	MIN_PAGE_SIZE,
	MIN_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import type { PageMarginSide } from '@/types/page';

const { pageSize, gridSize, margins, strokeWidth, activeLayer } =
	useActivePageLayout();

const {
	pendingRotate,
	rotateMessage,
	setWidth,
	setHeight,
	requestRotate,
	cancelRotate,
	confirmRotate,
} = usePageConfigActions();

const { setCols, setRows, setMargin, setStrokeWidth } = useLayerConfigActions();

const numberFromEvent = (event: Event) => {
	return Number((event.target as HTMLInputElement).value);
};

const onWidthChange = (event: Event) => {
	setWidth(numberFromEvent(event));
};

const onHeightChange = (event: Event) => {
	setHeight(numberFromEvent(event));
};

const onColsChange = (event: Event) => {
	setCols(numberFromEvent(event));
};

const onRowsChange = (event: Event) => {
	setRows(numberFromEvent(event));
};

const onMarginChange = (side: PageMarginSide, event: Event) => {
	setMargin(side, numberFromEvent(event));
};

const onStrokeWidthChange = (event: Event) => {
	setStrokeWidth(numberFromEvent(event));
};

const inputClass =
	'w-18 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25';

const labelClass =
	'flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100';

const sectionTitleClass =
	"mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500";

const sectionClass =
	'flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70';
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Configuration">
		<section :class="sectionClass" aria-label="Page settings">
			<h3 :class="sectionTitleClass">Page</h3>
			<label :class="labelClass">
				<span class="pr-2 text-slate-500 dark:text-slate-400">Width</span>
				<input
					type="number"
					:class="inputClass"
					:value="pageSize.width"
					:min="MIN_PAGE_SIZE"
					:max="MAX_PAGE_SIZE"
					@change="onWidthChange"
				/>
			</label>
			<label :class="labelClass">
				<span class="pr-2 text-slate-500 dark:text-slate-400">Height</span>
				<input
					type="number"
					:class="inputClass"
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

		<section :class="sectionClass" aria-label="Active layer settings">
			<h3 :class="[sectionTitleClass, 'min-w-0 overflow-hidden']">
				<span class="shrink-0">Layer</span>
				<span
					class="min-w-0 flex-1 truncate font-normal normal-case tracking-normal text-slate-500 dark:text-slate-400"
					:title="activeLayer.name"
					>— {{ activeLayer.name }}</span
				>
			</h3>

			<p class="text-xs text-slate-500 dark:text-slate-400">
				Grid, margins and stroke apply to the active layer.
			</p>

			<label :class="labelClass">
				<span class="pr-2 text-slate-500 dark:text-slate-400">Columns</span>
				<input
					type="number"
					:class="inputClass"
					:value="gridSize.cols"
					:min="MIN_GRID_POINTS"
					:max="MAX_GRID_POINTS"
					@change="onColsChange"
				/>
			</label>
			<label :class="labelClass">
				<span class="pr-2 text-slate-500 dark:text-slate-400">Rows</span>
				<input
					type="number"
					:class="inputClass"
					:value="gridSize.rows"
					:min="MIN_GRID_POINTS"
					:max="MAX_GRID_POINTS"
					@change="onRowsChange"
				/>
			</label>

			<label
				v-for="side in [
					{ key: 'marginTop' as const, label: 'Margin top' },
					{ key: 'marginRight' as const, label: 'Margin right' },
					{ key: 'marginBottom' as const, label: 'Margin bottom' },
					{ key: 'marginLeft' as const, label: 'Margin left' },
				]"
				:key="side.key"
				:class="labelClass"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">{{
					side.label
				}}</span>
				<input
					type="number"
					:class="inputClass"
					min="0"
					:value="margins[side.key]"
					@change="onMarginChange(side.key, $event)"
				/>
			</label>

			<label :class="labelClass">
				<span class="pr-2 text-slate-500 dark:text-slate-400">Stroke</span>
				<input
					type="number"
					:class="inputClass"
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
			:message="rotateMessage"
			confirm-label="Rotate"
			cancel-label="Cancel"
			@confirm="confirmRotate"
			@cancel="cancelRotate"
		/>
	</div>
</template>
