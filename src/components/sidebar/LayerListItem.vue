<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import PagePreview from '@/components/page/PagePreview.vue';
import type { Shape } from '@/models/Shape';

const props = defineProps<{
	name: string;
	active: boolean;
	visible: boolean;
	canRemove: boolean;
	width: number;
	height: number;
	shapes: Shape[];
	dragging?: boolean;
	dropTarget?: boolean;
}>();

const emit = defineEmits<{
	select: [];
	remove: [];
	rename: [name: string];
	toggleVisible: [];
	dragstart: [event: DragEvent];
	dragover: [event: DragEvent];
	drop: [event: DragEvent];
	dragend: [];
}>();

const editing = ref(false);
const draftName = ref(props.name);
const inputEl = ref<HTMLInputElement | null>(null);

watch(
	() => {
		return props.name;
	},
	(value) => {
		if (!editing.value) {
			draftName.value = value;
		}
	},
);

const startEdit = async () => {
	draftName.value = props.name;
	editing.value = true;

	await nextTick();

	inputEl.value?.focus();
	inputEl.value?.select();
};

const commitEdit = () => {
	if (!editing.value) {
		return;
	}

	editing.value = false;
	emit('rename', draftName.value);
	draftName.value = props.name;
};

const cancelEdit = () => {
	editing.value = false;
	draftName.value = props.name;
};

const onNameKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Enter') {
		event.preventDefault();
		(event.target as HTMLInputElement).blur();

		return;
	}

	if (event.key === 'Escape') {
		event.preventDefault();
		cancelEdit();
	}
};

const onDragStart = (event: DragEvent) => {
	if (editing.value) {
		event.preventDefault();

		return;
	}

	emit('dragstart', event);
};
</script>

<template>
	<li
		class="flex items-center gap-1 rounded-md border px-1.5 py-1 transition"
		:class="{
			'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-950':
				active && !dropTarget,
			'border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950':
				!active && !dropTarget,
			'border-blue-600 bg-blue-50 ring-2 ring-blue-600/30 dark:border-blue-500 dark:bg-blue-950 dark:ring-blue-500/30':
				dropTarget,
			'opacity-45': dragging,
			'cursor-grab': !editing,
			'cursor-default': editing,
		}"
		:draggable="!editing"
		@dragstart="onDragStart"
		@dragover="$emit('dragover', $event)"
		@drop="$emit('drop', $event)"
		@dragend="$emit('dragend')"
	>
		<span
			class="inline-flex size-7 shrink-0 items-center justify-center text-slate-400 dark:text-slate-500"
			aria-hidden="true"
		>
			<Icon icon="fluent:re-order-dots-vertical-24-regular" class="size-4" />
		</span>

		<button
			type="button"
			class="shrink-0 rounded-sm border border-slate-200 bg-white p-0 transition hover:border-blue-600/50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-500/50"
			:class="{
				'border-blue-600/40 dark:border-blue-500/40': active,
				'opacity-50': !visible,
			}"
			:aria-label="`Select ${name}`"
			:title="name"
			@click="$emit('select')"
		>
			<span class="block h-10 w-8 overflow-hidden" aria-hidden="true">
				<PagePreview :width="width" :height="height" :shapes="shapes" />
			</span>
		</button>

		<button
			type="button"
			class="inline-flex size-7 shrink-0 items-center justify-center rounded text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
			:aria-label="visible ? 'Hide layer' : 'Show layer'"
			:title="visible ? 'Hide layer' : 'Show layer'"
			@click="$emit('toggleVisible')"
			@mousedown.stop
		>
			<Icon
				:icon="visible ? 'fluent:eye-24-regular' : 'fluent:eye-off-24-regular'"
				class="size-4"
			/>
		</button>

		<input
			v-if="editing"
			ref="inputEl"
			v-model="draftName"
			type="text"
			maxlength="48"
			class="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
			:aria-label="`Name of ${name}`"
			draggable="false"
			@click.stop
			@mousedown.stop
			@keydown="onNameKeydown"
			@blur="commitEdit"
		/>
		<button
			v-else
			type="button"
			class="min-w-0 flex-1 overflow-hidden px-1 text-left text-sm text-slate-900 transition hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
			:class="{ 'opacity-50': !visible }"
			:title="name"
			@click="$emit('select')"
			@dblclick.stop.prevent="startEdit"
		>
			<span class="block truncate">{{ name }}</span>
		</button>

		<button
			v-if="canRemove"
			type="button"
			class="inline-flex size-7 shrink-0 items-center justify-center rounded text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
			:aria-label="`Delete ${name}`"
			title="Delete layer"
			@click.stop="$emit('remove')"
			@mousedown.stop
		>
			<Icon icon="fluent:delete-24-regular" class="size-4" />
		</button>
	</li>
</template>
