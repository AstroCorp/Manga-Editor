<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';
import { onClickOutside } from '@vueuse/core';
import NumberInput from '@/components/ui/NumberInput.vue';
import { MAX_STROKE_WIDTH, MIN_STROKE_WIDTH } from '@/lib/page/pageLimits';
import type { EdgeStrokeMenuEmits, EdgeStrokeMenuProps } from '@/types/panel';

const props = withDefaults(defineProps<EdgeStrokeMenuProps>(), {
	embedded: false,
});

const emit = defineEmits<EdgeStrokeMenuEmits>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const hoveredEdge = ref<number | null>(null);

const hoverEdge = (index: number | null) => {
	hoveredEdge.value = index;
	emit('hoverEdge', index);
};

const close = () => {
	if (!open.value) {
		return;
	}

	open.value = false;
	hoverEdge(null);
};

const toggleOpen = () => {
	if (open.value) {
		close();

		return;
	}

	open.value = true;
};

onClickOutside(root, close);

const onListFocusOut = (event: FocusEvent) => {
	const next = event.relatedTarget;

	if (next instanceof Node && event.currentTarget instanceof Node) {
		if (event.currentTarget.contains(next)) {
			return;
		}
	}

	hoverEdge(null);
};

const edgeLabel = (index: number) => {
	return `Edge ${index + 1}`;
};

const colorFromEvent = (event: Event) => {
	return (event.target as HTMLInputElement).value;
};

const onColorInput = (index: number, event: Event) => {
	emit('previewEdgeStroke', index, { color: colorFromEvent(event) });
};

const onColorChange = (index: number, event: Event) => {
	emit('setEdgeStroke', index, { color: colorFromEvent(event) });
};

const onWidthUpdate = (index: number, width: number) => {
	if (!Number.isFinite(width)) {
		return;
	}

	emit('setEdgeStroke', index, { width });
};
</script>

<template>
	<div ref="root" :class="props.embedded ? undefined : 'relative'">
		<button
			v-if="!props.embedded"
			type="button"
			role="menuitem"
			class="inline-flex size-9 items-center justify-center rounded-md transition focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:focus-visible:bg-blue-950 dark:focus-visible:text-blue-400"
			:class="
				open
					? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
					: 'text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400'
			"
			aria-label="Edge strokes"
			title="Edge strokes"
			aria-haspopup="true"
			:aria-expanded="open"
			@click="toggleOpen"
		>
			<Icon icon="fluent:line-thickness-24-regular" class="size-5" />
		</button>

		<div
			v-if="props.embedded || open"
			:class="
				props.embedded
					? undefined
					: 'absolute top-full left-0 z-40 mt-1 w-max min-w-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40'
			"
			role="group"
			aria-label="Edge strokes"
			@keydown.escape.prevent="close"
		>
			<div
				v-if="!props.embedded"
				class="flex items-center justify-between border-b border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 dark:border-zinc-700 dark:text-slate-400"
			>
				<span class="font-medium text-slate-700 dark:text-slate-200">
					Edges
				</span>
				<span>{{ props.strokes.length }}</span>
			</div>

			<ul
				class="max-h-56 overflow-y-auto p-1"
				aria-label="Edge stroke list"
				data-testid="edge-stroke-list"
				@mouseleave="hoverEdge(null)"
				@focusout="onListFocusOut"
			>
				<li
					v-for="(stroke, index) in props.strokes"
					:key="index"
					class="flex items-center gap-2 rounded-md px-1.5 py-0.5"
					:class="
						hoveredEdge === index
							? 'bg-blue-50 dark:bg-blue-950'
							: undefined
					"
					@mouseenter="hoverEdge(index)"
					@focusin="hoverEdge(index)"
				>
					<span
						class="w-14 shrink-0 text-xs text-slate-600 dark:text-slate-300"
					>
						{{ edgeLabel(index) }}
					</span>
					<NumberInput
						variant="toolbar"
						:model-value="stroke.width"
						:min="MIN_STROKE_WIDTH"
						:max="MAX_STROKE_WIDTH"
						input-width-class="w-8"
						:ariaLabel="`${edgeLabel(index)} width`"
						:increase-label="`Increase ${edgeLabel(index).toLowerCase()} width`"
						:decrease-label="`Decrease ${edgeLabel(index).toLowerCase()} width`"
						:title="`${edgeLabel(index)} width`"
						@update:model-value="onWidthUpdate(index, $event)"
					/>
					<label
						class="relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition hover:bg-blue-50 dark:hover:bg-blue-950"
						:title="`${edgeLabel(index)} color`"
					>
						<span
							class="size-5 rounded-sm border border-slate-300 shadow-sm dark:border-zinc-600"
							:style="{ background: stroke.color }"
							aria-hidden="true"
						/>
						<input
							type="color"
							class="absolute inset-0 size-full cursor-pointer opacity-0"
							:value="stroke.color"
							:aria-label="`${edgeLabel(index)} color`"
							@input="onColorInput(index, $event)"
							@change="onColorChange(index, $event)"
						/>
					</label>
				</li>
			</ul>
		</div>
	</div>
</template>
