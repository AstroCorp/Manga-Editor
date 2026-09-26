<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import EdgeStrokeMenu from '@/features/shape-menu/components/EdgeStrokeMenu.vue';
import { useElementInspectorStore } from '@/stores/elementInspector';
import { useSelectionStore } from '@/stores/selection';

const selectionStore = useSelectionStore();
const inspectorStore = useElementInspectorStore();
const { focused } = storeToRefs(selectionStore);
const { shapeApi } = storeToRefs(inspectorStore);

const fileInput = ref<HTMLInputElement | null>(null);

const ready = computed(() => {
	const current = focused.value;
	const api = shapeApi.value;

	return Boolean(
		current?.kind === 'shape' && api && api.elementId.value === current.id,
	);
});

const hasImage = computed(() => {
	return shapeApi.value?.hasImage.value ?? false;
});

const isGrayscale = computed(() => {
	return shapeApi.value?.isGrayscale.value ?? false;
});

const isFlipX = computed(() => {
	return shapeApi.value?.isFlipX.value ?? false;
});

const isFlipY = computed(() => {
	return shapeApi.value?.isFlipY.value ?? false;
});

const whiteFill = computed(() => {
	return shapeApi.value?.whiteFill.value ?? false;
});

const strokes = computed(() => {
	return shapeApi.value?.strokes.value ?? [];
});

onBeforeUnmount(() => {
	shapeApi.value?.highlightEdge(null);
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
	const file = (event.target as HTMLInputElement).files?.[0];

	if (!file) {
		return;
	}

	shapeApi.value?.placeImage(file);
};

const pressedClass = (pressed: boolean) => {
	return pressed
		? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400'
		: 'border-slate-200 bg-white text-slate-700 hover:border-blue-600/50 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-950 dark:hover:text-blue-400';
};
</script>

<template>
	<p
		v-if="!ready"
		class="py-5 text-sm text-slate-500 dark:text-slate-400"
	>
		Updating the selection…
	</p>

	<div v-else class="flex flex-col">
		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Panel image"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Image
			</h3>
			<button
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border px-2.5 text-sm transition"
				:class="pressedClass(false)"
				:aria-label="hasImage ? 'Replace image' : 'Add image'"
				@click="openFilePicker"
			>
				<span>{{ hasImage ? 'Replace image' : 'Add image' }}</span>
				<Icon
					:icon="
						hasImage
							? 'fluent:image-edit-24-regular'
							: 'fluent:image-add-24-regular'
					"
					class="size-5 shrink-0"
				/>
			</button>
			<button
				v-if="hasImage"
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border px-2.5 text-sm transition"
				:class="pressedClass(isGrayscale)"
				:aria-pressed="isGrayscale"
				aria-label="Black and white"
				@click="shapeApi?.toggleGrayscale()"
			>
				<span>Black and white</span>
				<Icon icon="fluent:color-background-24-regular" class="size-5 shrink-0" />
			</button>
			<button
				v-if="hasImage"
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border px-2.5 text-sm transition"
				:class="pressedClass(isFlipX)"
				:aria-pressed="isFlipX"
				aria-label="Flip horizontal"
				@click="shapeApi?.toggleFlipX()"
			>
				<span>Flip horizontal</span>
				<Icon icon="fluent:flip-horizontal-24-regular" class="size-5 shrink-0" />
			</button>
			<button
				v-if="hasImage"
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border px-2.5 text-sm transition"
				:class="pressedClass(isFlipY)"
				:aria-pressed="isFlipY"
				aria-label="Flip vertical"
				@click="shapeApi?.toggleFlipY()"
			>
				<span>Flip vertical</span>
				<Icon icon="fluent:flip-vertical-24-regular" class="size-5 shrink-0" />
			</button>
			<button
				v-if="hasImage"
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-700 transition hover:border-blue-600/50 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-950 dark:hover:text-blue-400"
				aria-label="Remove image"
				@click="shapeApi?.clearImage()"
			>
				<span>Remove image</span>
				<Icon icon="fluent:image-off-24-regular" class="size-5 shrink-0" />
			</button>
			<input
				ref="fileInput"
				type="file"
				accept="image/*"
				class="hidden"
				tabindex="-1"
				@change="onFileChange"
			/>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Panel fill"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Fill
			</h3>
			<button
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border px-2.5 text-sm transition"
				:class="pressedClass(whiteFill)"
				:aria-pressed="whiteFill"
				:aria-label="whiteFill ? 'Remove white fill' : 'White fill'"
				@click="shapeApi?.toggleWhiteFill()"
			>
				<span>White fill</span>
				<Icon icon="fluent:paint-bucket-24-regular" class="size-5 shrink-0" />
			</button>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Panel edges"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Edges
			</h3>
			<EdgeStrokeMenu
				embedded
				:strokes="strokes"
				@set-edge-stroke="
					(index, patch) => shapeApi?.setEdgeStroke(index, patch)
				"
				@preview-edge-stroke="
					(index, patch) => shapeApi?.previewEdgeStroke(index, patch)
				"
				@hover-edge="(index) => shapeApi?.highlightEdge(index)"
			/>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Panel actions"
		>
			<button
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border border-red-200 bg-white px-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950"
				aria-label="Delete shape"
				@click="shapeApi?.deleteShape()"
			>
				<span>Delete panel</span>
				<Icon icon="fluent:delete-24-regular" class="size-5 shrink-0" />
			</button>
		</section>
	</div>
</template>
