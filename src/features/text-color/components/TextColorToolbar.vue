<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Icon } from '@iconify/vue';
import {
	colorSwatchBackground,
	MAX_TEXT_FONT_SIZE,
	MIN_TEXT_FONT_SIZE,
	parseFontSizeInput,
} from '@/lib/fabric/textStyles';
import { DEFAULT_TEXT_FILL } from '@/models/TextBlock';
import type {
	TextColorToolbarEmits,
	TextColorToolbarProps,
} from '@/types/panel';

const MIXED_FONT_SIZE_LABEL = 'mix';

const props = defineProps<TextColorToolbarProps>();
const emit = defineEmits<TextColorToolbarEmits>();

const fontSizeDraft = ref('');

const isFontSizeMixed = computed(() => {
	return props.fontSize === null;
});

const fontSizeFallback = computed(() => {
	return isFontSizeMixed.value
		? MIXED_FONT_SIZE_LABEL
		: String(props.fontSize);
});

const resolvedFontSize = computed(() => {
	return props.fontSize ?? props.dominantFontSize;
});

watch(
	() => [props.fontSize, props.dominantFontSize] as const,
	() => {
		fontSizeDraft.value = fontSizeFallback.value;
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

const formatToggleClass = (active: boolean) => {
	if (active) {
		return 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400';
	}

	return 'text-slate-700 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-200 dark:hover:bg-blue-950 dark:hover:text-blue-400';
};

const fontSizeAriaLabel = computed(() => {
	return isFontSizeMixed.value ? 'Font size (mixed)' : 'Font size';
});

const colorValue = computed(() => {
	return props.colors[0] ?? DEFAULT_TEXT_FILL;
});

const onColorInput = (event: Event) => {
	emit('setColor', (event.target as HTMLInputElement).value);
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

const revealDominantFontSize = () => {
	if (!isFontSizeMixed.value) {
		return;
	}

	fontSizeDraft.value = String(props.dominantFontSize);
};

const onFontSizeInput = (event: Event) => {
	const value = (event.target as HTMLInputElement).value;

	fontSizeDraft.value = value;
	emitFontSize(value);
};

const commitFontSize = (event?: Event) => {
	const raw =
		event?.target instanceof HTMLInputElement
			? event.target.value
			: fontSizeDraft.value;

	if (raw.trim().toLowerCase() === MIXED_FONT_SIZE_LABEL) {
		fontSizeDraft.value = fontSizeFallback.value;

		return;
	}

	if (!emitFontSize(raw)) {
		fontSizeDraft.value = fontSizeFallback.value;
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

const onFontSizeKeydown = (event: KeyboardEvent) => {
	if (event.key !== 'Enter') {
		return;
	}

	commitFontSize(event);
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
	</div>
</template>
