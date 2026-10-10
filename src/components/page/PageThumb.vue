<script setup lang="ts">
import { computed } from 'vue';
import { Icon } from '@iconify/vue';
import PagePreview from '@/components/page/PagePreview.vue';
import { exportPageNumberLabel } from '@/lib/download';
import type { Shape } from '@/models/Shape';
import type { TextBlock } from '@/models/TextBlock';

const props = defineProps<{
	active: boolean;
	index: number;
	pageCount: number;
	canRemove: boolean;
	width: number;
	height: number;
	backgroundColor?: string;
	shapes: Shape[];
	texts?: TextBlock[];
	dragging?: boolean;
	dropTarget?: boolean;
}>();

defineEmits<{
	select: [];
	remove: [];
	dragstart: [event: DragEvent];
	dragover: [event: DragEvent];
	drop: [event: DragEvent];
	dragend: [];
}>();

const pageNumber = computed(() => {
	return exportPageNumberLabel(props.index + 1, props.pageCount);
});

const pageLabel = computed(() => {
	return `Page ${pageNumber.value}`;
});
</script>

<template>
	<div
		class="group relative flex w-18 shrink-0 cursor-grab flex-col items-stretch rounded-md border border-slate-200 bg-slate-50/70 text-slate-900 transition hover:bg-blue-50/60 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-slate-100 dark:hover:bg-blue-950/60"
		:class="{
			'border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-600 ring-inset dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-500':
				active,
			'opacity-45': dragging,
			'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-inset dark:border-blue-500 dark:bg-blue-950 dark:ring-blue-500':
				dropTarget,
			'hover:border-blue-600/50 dark:hover:border-blue-500/50':
				!active && !dropTarget,
		}"
		draggable="true"
		@dragstart="$emit('dragstart', $event)"
		@dragover="$emit('dragover', $event)"
		@drop="$emit('drop', $event)"
		@dragend="$emit('dragend')"
	>
		<button
			type="button"
			class="flex cursor-grab flex-col items-center bg-transparent px-1.5 pt-1.5 pb-1 text-inherit"
			:aria-current="active ? 'page' : undefined"
			:aria-label="`Select ${pageLabel}`"
			@click="$emit('select')"
		>
			<span
				class="flex h-[4.2rem] w-full items-center justify-center"
				aria-hidden="true"
			>
				<span
					class="relative box-content block aspect-(--page-ratio) w-[min(100%,calc((4.2rem-2px)*var(--page-ratio)))] overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-zinc-800"
					:class="
						active ? 'border-blue-600/40 dark:border-blue-500/40' : ''
					"
					:style="{
						'--page-ratio': `${width} / ${height}`,
						backgroundColor,
					}"
				>
					<PagePreview
						:width="width"
						:height="height"
						:background-color="backgroundColor"
						:shapes="shapes"
						:texts="texts"
					/>
					<span
						class="absolute bottom-px left-1/2 -translate-x-1/2 rounded bg-black/55 px-1 text-[0.65rem] leading-4 font-medium text-white"
					>
						{{ pageNumber }}
					</span>
				</span>
			</span>
		</button>

		<button
			v-if="canRemove"
			type="button"
			class="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-md border border-red-600/35 bg-white/95 text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:border-red-600 focus-visible:opacity-100 dark:border-red-500/35 dark:bg-zinc-950/95 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white"
			draggable="false"
			:aria-label="`Delete ${pageLabel}`"
			:title="`Delete ${pageLabel}`"
			@click.stop="$emit('remove')"
			@mousedown.stop
		>
			<Icon icon="fluent:delete-24-regular" class="size-5" />
		</button>
	</div>
</template>
