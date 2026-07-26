<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import type { ShapeActionMenuEmits, ShapeActionMenuProps } from '@/types/panel';

const props = defineProps<ShapeActionMenuProps>();

const emit = defineEmits<ShapeActionMenuEmits>();

const fileInput = ref<HTMLInputElement | null>(null);

const style = computed(() => {
	if (!props.visible || props.left === null || props.top === null) {
		return null;
	}

	return {
		left: `${props.left}px`,
		top: `${props.top}px`,
	};
});

const openFilePicker = () => {
	const input = fileInput.value;

	if (!input) {
		return;
	}

	input.value = '';
	input.click();
};

const onFileChange = (event: Event) => {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	if (!file) {
		return;
	}

	emit('placeImage', file);
};
</script>

<template>
	<div
		v-if="style"
		class="absolute z-30 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40"
		:style="style"
		role="menu"
		aria-label="Shape actions"
		@pointerdown.stop
	>
		<button
			type="button"
			role="menuitem"
			class="inline-flex size-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			:aria-label="hasImage ? 'Replace image' : 'Add image'"
			:title="hasImage ? 'Replace image' : 'Add image'"
			@click="openFilePicker"
		>
			<Icon
				:icon="
					hasImage
						? 'fluent:image-edit-24-regular'
						: 'fluent:image-add-24-regular'
				"
				class="size-5"
			/>
		</button>
		<button
			v-if="hasImage"
			type="button"
			role="menuitem"
			class="inline-flex size-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			aria-label="Remove image"
			title="Remove image"
			@click="emit('clearImage')"
		>
			<Icon icon="fluent:image-off-24-regular" class="size-5" />
		</button>
		<button
			type="button"
			role="menuitem"
			class="inline-flex size-9 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
			aria-label="Delete shape"
			title="Delete shape"
			@click="emit('deleteShape')"
		>
			<Icon icon="fluent:delete-24-regular" class="size-5" />
		</button>

		<input
			ref="fileInput"
			type="file"
			accept="image/*"
			class="sr-only"
			tabindex="-1"
			@change="onFileChange"
		/>
	</div>
</template>
