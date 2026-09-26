<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import EdgeStrokeMenu from '@/features/shape-menu/components/EdgeStrokeMenu.vue';
import { DEFAULT_PANEL_FILL } from '@/lib/page/pageLimits';
import type { ShapeActionMenuEmits, ShapeActionMenuProps } from '@/types/panel';

const props = defineProps<ShapeActionMenuProps>();

const emit = defineEmits<ShapeActionMenuEmits>();

const fileInput = ref<HTMLInputElement | null>(null);

const togglePressedClass = (pressed: boolean) => {
	return pressed
		? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
		: 'text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400';
};

const style = computed(() => {
	if (props.left === null || props.top === null) {
		return null;
	}

	return {
		left: `${props.left}px`,
		top: `${props.top}px`,
	};
});

const hasFill = computed(() => {
	return props.fill !== null;
});

const fillColorValue = computed(() => {
	return props.fill ?? DEFAULT_PANEL_FILL;
});

const colorFromEvent = (event: Event) => {
	return (event.target as HTMLInputElement).value;
};

const onFillColorInput = (event: Event) => {
	emit('previewFillColor', colorFromEvent(event));
};

const onFillColorChange = (event: Event) => {
	emit('setFillColor', colorFromEvent(event));
};

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
		class="absolute z-30 flex w-max -translate-x-1/2 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40"
		:class="placement === 'above' ? '-translate-y-full' : undefined"
		:style="style"
		role="menu"
		aria-label="Shape actions"
		@pointerdown.stop
	>
		<div class="flex items-center gap-0.5" role="group" aria-label="Fill">
			<button
				type="button"
				role="menuitem"
				class="inline-flex size-9 items-center justify-center rounded-md transition focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:focus-visible:bg-blue-950 dark:focus-visible:text-blue-400"
				:class="togglePressedClass(hasFill)"
				:aria-label="hasFill ? 'Remove fill' : 'Fill panel'"
				:aria-pressed="hasFill"
				:title="hasFill ? 'Remove fill' : 'Fill panel'"
				@click="emit('toggleFill')"
			>
				<Icon icon="fluent:paint-bucket-24-regular" class="size-5" />
			</button>
			<label
				class="relative inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md transition hover:bg-blue-50 dark:hover:bg-blue-950"
				title="Fill color"
			>
				<span
					class="size-5 rounded-sm border border-slate-300 shadow-sm dark:border-zinc-600"
					:class="hasFill ? undefined : 'opacity-40'"
					:style="{ background: fillColorValue }"
					aria-hidden="true"
				/>
				<input
					type="color"
					class="absolute inset-0 size-full cursor-pointer opacity-0"
					:value="fillColorValue"
					aria-label="Fill color"
					@input="onFillColorInput"
					@change="onFillColorChange"
				/>
			</label>
		</div>
		<span
			class="mx-1 h-5 w-px shrink-0 bg-slate-200/80 dark:bg-zinc-700"
			aria-hidden="true"
		/>
		<EdgeStrokeMenu
			:strokes="strokes"
			@set-edge-stroke="(index, patch) => emit('setEdgeStroke', index, patch)"
			@preview-edge-stroke="
				(index, patch) => emit('previewEdgeStroke', index, patch)
			"
			@hover-edge="(index) => emit('hoverEdge', index)"
		/>
		<span
			class="mx-1 h-5 w-px shrink-0 bg-slate-200/80 dark:bg-zinc-700"
			aria-hidden="true"
		/>
		<div class="flex items-center gap-0.5" role="group" aria-label="Image">
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
				class="inline-flex size-9 items-center justify-center rounded-md transition focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:focus-visible:bg-blue-950 dark:focus-visible:text-blue-400"
				:class="togglePressedClass(isGrayscale)"
				:aria-label="isGrayscale ? 'Remove black and white' : 'Black and white'"
				:aria-pressed="isGrayscale"
				:title="isGrayscale ? 'Remove black and white' : 'Black and white'"
				@click="emit('toggleGrayscale')"
			>
				<Icon icon="fluent:color-background-24-regular" class="size-5" />
			</button>
			<button
				v-if="hasImage"
				type="button"
				role="menuitem"
				class="inline-flex size-9 items-center justify-center rounded-md transition focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:focus-visible:bg-blue-950 dark:focus-visible:text-blue-400"
				:class="togglePressedClass(isFlipX)"
				:aria-label="isFlipX ? 'Remove horizontal flip' : 'Flip horizontal'"
				:aria-pressed="isFlipX"
				:title="isFlipX ? 'Remove horizontal flip' : 'Flip horizontal'"
				@click="emit('toggleFlipX')"
			>
				<Icon icon="fluent:flip-horizontal-24-regular" class="size-5" />
			</button>
			<button
				v-if="hasImage"
				type="button"
				role="menuitem"
				class="inline-flex size-9 items-center justify-center rounded-md transition focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:focus-visible:bg-blue-950 dark:focus-visible:text-blue-400"
				:class="togglePressedClass(isFlipY)"
				:aria-label="isFlipY ? 'Remove vertical flip' : 'Flip vertical'"
				:aria-pressed="isFlipY"
				:title="isFlipY ? 'Remove vertical flip' : 'Flip vertical'"
				@click="emit('toggleFlipY')"
			>
				<Icon icon="fluent:flip-vertical-24-regular" class="size-5" />
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
		</div>
		<span
			class="mx-1 h-5 w-px shrink-0 bg-slate-200/80 dark:bg-zinc-700"
			aria-hidden="true"
		/>
		<button
			type="button"
			role="menuitem"
			class="inline-flex size-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:bg-blue-50 focus-visible:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400"
			aria-label="Show element options"
			title="Show element options"
			@click="emit('showOptions')"
		>
			<Icon icon="fluent:options-24-regular" class="size-5" />
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
