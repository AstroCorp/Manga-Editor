<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import {
	colorSwatchBackground,
	MAX_TEXT_FONT_SIZE,
	MIN_TEXT_FONT_SIZE,
	MIN_TEXT_STROKE_WIDTH,
	parseFontSizeInput,
	parseStrokeWidthInput,
} from '@/lib/fabric/textStyles';
import {
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_STROKE,
} from '@/models/TextBlock';
import TextAlignSelect from '@/features/text-color/components/TextAlignSelect.vue';
import type {
	TextColorToolbarEmits,
	TextColorToolbarProps,
} from '@/types/panel';
import type { TextTextAlign } from '@/types/page';

const MIXED_VALUE_LABEL = 'mix';

const props = defineProps<TextColorToolbarProps>();
const emit = defineEmits<TextColorToolbarEmits>();

const fontSizeDraft = ref('');
const strokeWidthDraft = ref('');

const isFontSizeMixed = computed(() => {
	return props.fontSize === null;
});

const isStrokeWidthMixed = computed(() => {
	return props.strokeWidth === null;
});

const fontSizeFallback = computed(() => {
	return isFontSizeMixed.value
		? MIXED_VALUE_LABEL
		: String(props.fontSize);
});

const strokeWidthFallback = computed(() => {
	return isStrokeWidthMixed.value
		? MIXED_VALUE_LABEL
		: String(props.strokeWidth);
});

const resolvedFontSize = computed(() => {
	return props.fontSize ?? props.dominantFontSize;
});

const resolvedStrokeWidth = computed(() => {
	return props.strokeWidth ?? props.dominantStrokeWidth;
});

watch(
	() => [props.fontSize, props.dominantFontSize] as const,
	() => {
		fontSizeDraft.value = fontSizeFallback.value;
	},
	{ immediate: true },
);

watch(
	() => [props.strokeWidth, props.dominantStrokeWidth] as const,
	() => {
		strokeWidthDraft.value = strokeWidthFallback.value;
	},
	{ immediate: true },
);

const style = computed(() => {
	if (props.left === null || props.top === null) {
		return null;
	}

	return {
		left: `${props.left}px`,
		top: `${props.top}px`,
	};
});

const placementClass = computed(() => {
	return props.placement === 'above' ? '-translate-y-full' : undefined;
});

const swatchStyle = computed(() => {
	return {
		background: colorSwatchBackground(props.colors),
	};
});

const strokeSwatchStyle = computed(() => {
	return {
		background: colorSwatchBackground(props.strokeColors),
	};
});

const formatToggleClass = (active: boolean) => {
	if (active) {
		return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400';
	}

	return 'text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400';
};

const fontSizeAriaLabel = computed(() => {
	return isFontSizeMixed.value ? 'Font size (mixed)' : 'Font size';
});

const strokeWidthAriaLabel = computed(() => {
	return isStrokeWidthMixed.value ? 'Stroke width (mixed)' : 'Stroke width';
});

const colorValue = computed(() => {
	return props.colors[0] ?? DEFAULT_TEXT_FILL;
});

const strokeColorValue = computed(() => {
	return props.strokeColors[0] ?? DEFAULT_TEXT_STROKE;
});

const onColorInput = (event: Event) => {
	emit('setColor', (event.target as HTMLInputElement).value);
};

const onStrokeColorInput = (event: Event) => {
	emit('setStrokeColor', (event.target as HTMLInputElement).value);
};

const onTextAlignUpdate = (next: TextTextAlign) => {
	emit('setTextAlign', next);
};

const emitFontSize = (raw: string) => {
	const next = parseFontSizeInput(raw);

	if (next === null) {
		return false;
	}

	if (next === props.fontSize) {
		return true;
	}

	emit('setFontSize', next);

	return true;
};

const emitStrokeWidth = (raw: string) => {
	const next = parseStrokeWidthInput(raw);

	if (next === null) {
		return false;
	}

	if (next === props.strokeWidth) {
		return true;
	}

	emit('setStrokeWidth', next);

	return true;
};

const revealDominantFontSize = () => {
	if (!isFontSizeMixed.value) {
		return;
	}

	fontSizeDraft.value = String(props.dominantFontSize);
};

const revealDominantStrokeWidth = () => {
	if (!isStrokeWidthMixed.value) {
		return;
	}

	strokeWidthDraft.value = String(props.dominantStrokeWidth);
};

const onFontSizeInput = (event: Event) => {
	const value = (event.target as HTMLInputElement).value;

	fontSizeDraft.value = value;
	emitFontSize(value);
};

const onStrokeWidthInput = (event: Event) => {
	const value = (event.target as HTMLInputElement).value;

	strokeWidthDraft.value = value;
	emitStrokeWidth(value);
};

const commitFontSize = (event?: Event) => {
	const raw =
		event?.target instanceof HTMLInputElement
			? event.target.value
			: fontSizeDraft.value;

	if (raw.trim().toLowerCase() === MIXED_VALUE_LABEL) {
		fontSizeDraft.value = fontSizeFallback.value;

		return;
	}

	if (!emitFontSize(raw)) {
		fontSizeDraft.value = fontSizeFallback.value;
	}
};

const commitStrokeWidth = (event?: Event) => {
	const raw =
		event?.target instanceof HTMLInputElement
			? event.target.value
			: strokeWidthDraft.value;

	if (raw.trim().toLowerCase() === MIXED_VALUE_LABEL) {
		strokeWidthDraft.value = strokeWidthFallback.value;

		return;
	}

	if (!emitStrokeWidth(raw)) {
		strokeWidthDraft.value = strokeWidthFallback.value;
	}
};

const nudgeFontSize = (delta: number) => {
	const current = resolvedFontSize.value;
	const next = Math.min(
		MAX_TEXT_FONT_SIZE,
		Math.max(MIN_TEXT_FONT_SIZE, current + delta),
	);

	fontSizeDraft.value = String(next);
	emitFontSize(String(next));
};

const nudgeStrokeWidth = (delta: number) => {
	const current = resolvedStrokeWidth.value;
	const next = Math.max(MIN_TEXT_STROKE_WIDTH, current + delta);

	strokeWidthDraft.value = String(next);
	emitStrokeWidth(String(next));
};

const onFontSizeKeydown = (event: KeyboardEvent) => {
	if (event.key !== 'Enter') {
		return;
	}

	commitFontSize(event);
	(event.target as HTMLInputElement).blur();
};

const onStrokeWidthKeydown = (event: KeyboardEvent) => {
	if (event.key !== 'Enter') {
		return;
	}

	commitStrokeWidth(event);
	(event.target as HTMLInputElement).blur();
};
</script>

<template>
	<div
		v-if="style"
		class="absolute z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40"
		:class="placementClass"
		:style="style"
		role="toolbar"
		aria-label="Text format"
		@pointerdown.stop
	>
		<label
			class="inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition hover:bg-blue-50 dark:hover:bg-blue-950"
			title="Text color"
		>
			<span
				class="size-5 rounded-full border border-slate-300 shadow-sm dark:border-zinc-600"
				:style="swatchStyle"
				aria-hidden="true"
			/>
			<input
				type="color"
				class="sr-only"
				:value="colorValue"
				aria-label="Text color"
				@input="onColorInput"
			/>
		</label>

		<div
			class="flex h-9 items-stretch overflow-hidden rounded-md text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 focus-within:bg-blue-50 focus-within:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:focus-within:bg-blue-950 dark:focus-within:text-blue-400"
			title="Font size"
		>
			<input
				:value="fontSizeDraft"
				type="text"
				inputmode="numeric"
				class="h-full w-10 appearance-none border-0 bg-transparent px-1.5 text-center text-sm text-inherit outline-none ring-0 hover:bg-transparent focus:bg-transparent"
				:aria-label="fontSizeAriaLabel"
				@focus="revealDominantFontSize"
				@keydown="onFontSizeKeydown"
				@input="onFontSizeInput"
				@change="commitFontSize"
				@blur="commitFontSize"
			/>
			<div class="flex w-5 shrink-0 flex-col">
				<button
					type="button"
					class="flex flex-1 items-center justify-center bg-transparent text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
					aria-label="Increase font size"
					@click="nudgeFontSize(1)"
				>
					<Icon icon="fluent:chevron-up-16-regular" class="size-3" />
				</button>
				<button
					type="button"
					class="flex flex-1 items-center justify-center bg-transparent text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
					aria-label="Decrease font size"
					@click="nudgeFontSize(-1)"
				>
					<Icon icon="fluent:chevron-down-16-regular" class="size-3" />
				</button>
			</div>
		</div>

		<label
			class="inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition hover:bg-blue-50 dark:hover:bg-blue-950"
			title="Stroke color"
		>
			<span
				class="relative size-5 rounded-full border border-slate-300 shadow-sm dark:border-zinc-600"
				aria-hidden="true"
			>
				<span
					class="absolute inset-0 rounded-full"
					:style="strokeSwatchStyle"
				/>
				<span
					class="absolute inset-[5px] rounded-full bg-white dark:bg-zinc-950"
				/>
			</span>
			<input
				type="color"
				class="sr-only"
				:value="strokeColorValue"
				aria-label="Stroke color"
				@input="onStrokeColorInput"
			/>
		</label>

		<div
			class="flex h-9 items-stretch overflow-hidden rounded-md text-slate-700 transition hover:bg-blue-50 hover:text-blue-600 focus-within:bg-blue-50 focus-within:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:focus-within:bg-blue-950 dark:focus-within:text-blue-400"
			title="Stroke width"
		>
			<input
				:value="strokeWidthDraft"
				type="text"
				inputmode="numeric"
				class="h-full w-8 appearance-none border-0 bg-transparent px-1 text-center text-sm text-inherit outline-none ring-0 hover:bg-transparent focus:bg-transparent"
				:aria-label="strokeWidthAriaLabel"
				@focus="revealDominantStrokeWidth"
				@keydown="onStrokeWidthKeydown"
				@input="onStrokeWidthInput"
				@change="commitStrokeWidth"
				@blur="commitStrokeWidth"
			/>
			<div class="flex w-5 shrink-0 flex-col">
				<button
					type="button"
					class="flex flex-1 items-center justify-center bg-transparent text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
					aria-label="Increase stroke width"
					@click="nudgeStrokeWidth(1)"
				>
					<Icon icon="fluent:chevron-up-16-regular" class="size-3" />
				</button>
				<button
					type="button"
					class="flex flex-1 items-center justify-center bg-transparent text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent"
					aria-label="Decrease stroke width"
					@click="nudgeStrokeWidth(-1)"
				>
					<Icon icon="fluent:chevron-down-16-regular" class="size-3" />
				</button>
			</div>
		</div>

		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md transition"
			:class="formatToggleClass(bold)"
			:aria-pressed="bold"
			title="Bold"
			aria-label="Bold"
			@click="emit('toggleBold')"
		>
			<Icon icon="fluent:text-bold-24-regular" class="size-5" />
		</button>
		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md transition"
			:class="formatToggleClass(italic)"
			:aria-pressed="italic"
			title="Italic"
			aria-label="Italic"
			@click="emit('toggleItalic')"
		>
			<Icon icon="fluent:text-italic-24-regular" class="size-5" />
		</button>
		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md transition"
			:class="formatToggleClass(underline)"
			:aria-pressed="underline"
			title="Underline"
			aria-label="Underline"
			@click="emit('toggleUnderline')"
		>
			<Icon icon="fluent:text-underline-24-regular" class="size-5" />
		</button>
		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md transition"
			:class="formatToggleClass(linethrough)"
			:aria-pressed="linethrough"
			title="Strikethrough"
			aria-label="Strikethrough"
			@click="emit('toggleLinethrough')"
		>
			<Icon icon="fluent:text-strikethrough-24-regular" class="size-5" />
		</button>

		<TextAlignSelect
			:model-value="textAlign"
			@update:model-value="onTextAlignUpdate"
		/>

		<button
			type="button"
			class="inline-flex size-9 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
			title="Delete text"
			aria-label="Delete text"
			@click="emit('deleteText')"
		>
			<Icon icon="fluent:delete-24-regular" class="size-5" />
		</button>
	</div>
</template>
