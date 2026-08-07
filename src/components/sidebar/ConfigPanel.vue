<script setup lang="ts">
import { Icon } from '@iconify/vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import NumberInput from '@/components/ui/NumberInput.vue';
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

const onMarginUpdate = (side: PageMarginSide, value: number) => {
	setMargin(side, value);
};
</script>

<template>
	<div class="flex flex-col px-4 pb-6" aria-label="Configuration">
		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Page settings"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Page
			</h3>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Width</span>
				<NumberInput
					:model-value="pageSize.width"
					:min="MIN_PAGE_SIZE"
					:max="MAX_PAGE_SIZE"
					input-width-class="w-16"
					ariaLabel="Page width"
					increase-label="Increase page width"
					decrease-label="Decrease page width"
					@update:model-value="setWidth"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Height</span>
				<NumberInput
					:model-value="pageSize.height"
					:min="MIN_PAGE_SIZE"
					:max="MAX_PAGE_SIZE"
					input-width-class="w-16"
					ariaLabel="Page height"
					increase-label="Increase page height"
					decrease-label="Decrease page height"
					@update:model-value="setHeight"
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
			aria-label="Active layer settings"
		>
			<h3
				class="mb-1 flex min-w-0 items-center gap-2.5 overflow-hidden text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
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

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Columns</span>
				<NumberInput
					:model-value="gridSize.cols"
					:min="MIN_GRID_POINTS"
					:max="MAX_GRID_POINTS"
					input-width-class="w-14"
					ariaLabel="Grid columns"
					increase-label="Increase columns"
					decrease-label="Decrease columns"
					@update:model-value="setCols"
				/>
			</label>
			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Rows</span>
				<NumberInput
					:model-value="gridSize.rows"
					:min="MIN_GRID_POINTS"
					:max="MAX_GRID_POINTS"
					input-width-class="w-14"
					ariaLabel="Grid rows"
					increase-label="Increase rows"
					decrease-label="Decrease rows"
					@update:model-value="setRows"
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
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">{{
					side.label
				}}</span>
				<NumberInput
					:model-value="margins[side.key]"
					:min="0"
					input-width-class="w-14"
					:ariaLabel="side.label"
					:increase-label="`Increase ${side.label.toLowerCase()}`"
					:decrease-label="`Decrease ${side.label.toLowerCase()}`"
					@update:model-value="onMarginUpdate(side.key, $event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm leading-snug text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Stroke</span>
				<NumberInput
					:model-value="strokeWidth"
					:min="MIN_STROKE_WIDTH"
					:max="MAX_STROKE_WIDTH"
					input-width-class="w-14"
					commit-on-input
					ariaLabel="Stroke width"
					increase-label="Increase stroke width"
					decrease-label="Decrease stroke width"
					@update:model-value="setStrokeWidth"
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
