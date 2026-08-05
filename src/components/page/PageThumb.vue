<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import PagePreview from '@/components/page/PagePreview.vue';
import type { Shape } from '@/models/Shape';

const props = defineProps<{
	name: string;
	active: boolean;
	index: number;
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
	<div
		class="group relative flex w-18 shrink-0 flex-col items-stretch rounded-md border border-slate-200 bg-slate-50/70 text-slate-900 transition hover:bg-blue-50/60 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-slate-100 dark:hover:bg-blue-950/60"
		:class="{
			'border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-600 ring-inset dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-500':
				active,
			'opacity-45': dragging,
			'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-inset dark:border-blue-500 dark:bg-blue-950 dark:ring-blue-500':
				dropTarget,
			'cursor-grab': !editing,
			'cursor-default': editing,
			'hover:border-blue-600/50 dark:hover:border-blue-500/50':
				!active && !dropTarget,
		}"
		:draggable="!editing"
		@dragstart="onDragStart"
		@dragover="$emit('dragover', $event)"
		@drop="$emit('drop', $event)"
		@dragend="$emit('dragend')"
	>
		<button
			type="button"
			class="flex flex-col items-center bg-transparent px-1.5 pt-1.5 pb-1 text-inherit"
			:class="editing ? 'cursor-default' : 'cursor-grab'"
			:aria-current="active ? 'page' : undefined"
			:aria-label="`Select ${name}`"
			@click="$emit('select')"
		>
			<span
				class="relative h-[4.2rem] w-12 overflow-hidden border border-slate-200 bg-white shadow-sm dark:border-zinc-800"
				:class="
					active ? 'border-blue-600/40 dark:border-blue-500/40' : ''
				"
				aria-hidden="true"
			>
				<PagePreview
					:width="width"
					:height="height"
					:shapes="shapes"
				/>
				<span
					class="absolute right-0.5 bottom-0.5 rounded bg-black/55 px-1 text-[0.65rem] leading-4 font-medium text-white"
				>
					{{ index + 1 }}
				</span>
			</span>
		</button>

		<input
			v-if="editing"
			ref="inputEl"
			v-model="draftName"
			class="mx-1 mb-2 h-auto w-[calc(100%-0.5rem)] max-w-18 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-sm text-slate-900 outline-none transition hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/25 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500/50 dark:focus:border-blue-500 dark:focus:ring-blue-500/25"
			type="text"
			maxlength="48"
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
			class="mx-1 mb-2 block w-[calc(100%-0.5rem)] overflow-hidden bg-transparent px-1.5 py-1 text-center text-sm leading-snug text-inherit transition hover:text-blue-600 dark:hover:text-blue-400"
			:class="editing ? 'cursor-default' : 'cursor-grab'"
			:title="name"
			@click="$emit('select')"
			@dblclick.stop.prevent="startEdit"
		>
			<span class="block truncate">{{ name }}</span>
		</button>

		<button
			v-if="canRemove"
			type="button"
			class="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-md border border-red-600/35 bg-white/95 text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-red-600 hover:bg-red-600 hover:text-white focus-visible:border-red-600 focus-visible:opacity-100 dark:border-red-500/35 dark:bg-zinc-950/95 dark:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-500 dark:hover:text-white"
			draggable="false"
			:aria-label="`Delete ${name}`"
			:title="`Delete ${name}`"
			@click.stop="$emit('remove')"
			@mousedown.stop
		>
			<Icon icon="fluent:delete-24-regular" class="size-5" />
		</button>
	</div>
</template>
