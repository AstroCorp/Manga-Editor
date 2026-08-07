<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import NumberInput from '@/components/ui/NumberInput.vue';
import { useOverlayScrollClamp } from '@/composables/ui/useOverlayScrollClamp';
import {
	colorSwatchBackground,
	MAX_TEXT_FONT_SIZE,
	MAX_TEXT_LINE_HEIGHT,
	MIN_TEXT_FONT_SIZE,
	MIN_TEXT_LINE_HEIGHT,
	MIN_TEXT_STROKE_WIDTH,
	TEXT_LINE_HEIGHT_STEP,
} from '@/lib/fabric/textStyles';
import {
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_STROKE,
} from '@/models/TextBlock';
import TextAlignSelect from '@/features/text-color/components/TextAlignSelect.vue';
import FontFamilySelect from '@/features/text-color/components/FontFamilySelect.vue';
import PageAlignSelect from '@/features/text-color/components/PageAlignSelect.vue';
import type {
	TextColorToolbarEmits,
	TextColorToolbarProps,
} from '@/types/panel';
import type { PageTextAnchor, TextBoxVerticalAlign, TextTextAlign } from '@/types/page';

const props = defineProps<TextColorToolbarProps>();
const emit = defineEmits<TextColorToolbarEmits>();

const rootRef = ref<HTMLElement | null>(null);
const { shiftX, shiftY } = useOverlayScrollClamp(rootRef, () => {
	return {
		left: props.left,
		top: props.top,
		placement: props.placement,
	};
});

const style = computed(() => {
	if (props.left === null || props.top === null) {
		return null;
	}

	const translateY =
		props.placement === 'above'
			? `calc(-100% + ${shiftY.value}px)`
			: `${shiftY.value}px`;

	return {
		left: `${props.left}px`,
		top: `${props.top}px`,
		transform: `translate(calc(-50% + ${shiftX.value}px), ${translateY})`,
	};
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
	return props.fontSize === null ? 'Font size (mixed)' : 'Font size';
});

const strokeWidthAriaLabel = computed(() => {
	return props.strokeWidth === null ? 'Stroke width (mixed)' : 'Stroke width';
});

const lineHeightAriaLabel = computed(() => {
	return props.lineHeight === null ? 'Line height (mixed)' : 'Line height';
});

const colorValue = computed(() => {
	return props.colors[0] ?? DEFAULT_TEXT_FILL;
});

const strokeColorValue = computed(() => {
	return props.strokeColors[0] ?? DEFAULT_TEXT_STROKE;
});

const boxFillValue = computed(() => {
	return props.boxFill;
});

const boxStrokeValue = computed(() => {
	return props.boxStroke;
});

const onColorInput = (event: Event) => {
	emit('setColor', (event.target as HTMLInputElement).value);
};

const onStrokeColorInput = (event: Event) => {
	emit('setStrokeColor', (event.target as HTMLInputElement).value);
};

const onBoxFillInput = (event: Event) => {
	emit('setBoxFill', (event.target as HTMLInputElement).value);
};

const onBoxStrokeInput = (event: Event) => {
	emit('setBoxStroke', (event.target as HTMLInputElement).value);
};

const onBoxVerticalAlign = (align: TextBoxVerticalAlign) => {
	emit('setBoxVerticalAlign', align);
};

const onTextAlignUpdate = (next: TextTextAlign) => {
	emit('setTextAlign', next);
};

const onFontFamilyUpdate = (next: string) => {
	emit('setFontFamily', next);
};

const onPageAlign = (anchor: PageTextAnchor) => {
	emit('alignToPage', anchor);
};

const toolbarShellClass =
	'flex max-w-[min(100vw-2rem,52rem)] flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-900/15 dark:border-zinc-700 dark:bg-zinc-950 dark:shadow-black/40';

const boxFillSwatchStyle = computed(() => {
	return {
		background: boxFillValue.value,
	};
});

const boxStrokeRingStyle = computed(() => {
	return {
		background: boxStrokeValue.value,
	};
});

const leadingIconClass = 'inline-flex items-center pl-1';
</script>

<template>
	<div
		v-if="style"
		ref="rootRef"
		class="absolute z-30 flex flex-col items-center gap-1"
		:style="style"
	>
		<div
			v-if="hasBox"
			:class="toolbarShellClass"
			role="toolbar"
			aria-label="Box format"
			@pointerdown.stop
		>
			<label
				class="inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition hover:bg-blue-50 dark:hover:bg-blue-950"
				title="Box fill"
			>
				<span
					class="size-5 rounded-sm border border-slate-300 shadow-sm dark:border-zinc-600"
					:style="boxFillSwatchStyle"
					aria-hidden="true"
				/>
				<input
					type="color"
					class="sr-only"
					:value="boxFillValue"
					aria-label="Box fill"
					@input="onBoxFillInput"
				/>
			</label>

			<label
				class="inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition hover:bg-blue-50 dark:hover:bg-blue-950"
				title="Box stroke"
			>
				<span
					class="relative size-5 rounded-sm border border-slate-300 shadow-sm dark:border-zinc-600"
					aria-hidden="true"
				>
					<span
						class="absolute inset-0 rounded-sm"
						:style="boxStrokeRingStyle"
					/>
					<span
						class="absolute inset-[4px] rounded-sm border border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-950"
					/>
				</span>
				<input
					type="color"
					class="sr-only"
					:value="boxStrokeValue"
					aria-label="Box stroke"
					@input="onBoxStrokeInput"
				/>
			</label>

			<NumberInput
				variant="toolbar"
				:model-value="boxStrokeWidth"
				:min="0"
				input-width-class="w-8"
				aria-label="Box stroke width"
				increase-label="Increase box stroke width"
				decrease-label="Decrease box stroke width"
				title="Box stroke width"
				@update:model-value="emit('setBoxStrokeWidth', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:line-thickness-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

			<NumberInput
				variant="toolbar"
				:model-value="boxCornerRadius"
				:min="0"
				input-width-class="w-8"
				aria-label="Corner radius"
				increase-label="Increase corner radius"
				decrease-label="Decrease corner radius"
				title="Corner radius"
				@update:model-value="emit('setBoxCornerRadius', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:square-hint-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

			<NumberInput
				variant="toolbar"
				:model-value="boxPadding"
				:min="0"
				input-width-class="w-8"
				aria-label="Box padding"
				increase-label="Increase box padding"
				decrease-label="Decrease box padding"
				title="Box padding"
				@update:model-value="emit('setBoxPadding', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:padding-right-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

			<NumberInput
				variant="toolbar"
				:model-value="boxWidth"
				:min="1"
				input-width-class="w-9"
				aria-label="Box width"
				increase-label="Increase box width"
				decrease-label="Decrease box width"
				title="Box width"
				@update:model-value="emit('setBoxWidth', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:arrow-autofit-width-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

			<NumberInput
				variant="toolbar"
				:model-value="boxHeight"
				:min="1"
				input-width-class="w-9"
				aria-label="Box height"
				increase-label="Increase box height"
				decrease-label="Decrease box height"
				title="Box height"
				@update:model-value="emit('setBoxHeight', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:arrow-autofit-height-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

			<div
				class="flex items-center gap-0.5"
				role="group"
				aria-label="Box vertical align"
			>
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md transition"
					:class="formatToggleClass(boxVerticalAlign === 'top')"
					:aria-pressed="boxVerticalAlign === 'top'"
					title="Align text top"
					aria-label="Align text top"
					@click="onBoxVerticalAlign('top')"
				>
					<Icon icon="fluent:align-top-24-regular" class="size-5" />
				</button>
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md transition"
					:class="formatToggleClass(boxVerticalAlign === 'middle')"
					:aria-pressed="boxVerticalAlign === 'middle'"
					title="Align text middle"
					aria-label="Align text middle"
					@click="onBoxVerticalAlign('middle')"
				>
					<Icon icon="fluent:align-center-vertical-24-regular" class="size-5" />
				</button>
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md transition"
					:class="formatToggleClass(boxVerticalAlign === 'bottom')"
					:aria-pressed="boxVerticalAlign === 'bottom'"
					title="Align text bottom"
					aria-label="Align text bottom"
					@click="onBoxVerticalAlign('bottom')"
				>
					<Icon icon="fluent:align-bottom-24-regular" class="size-5" />
				</button>
			</div>
		</div>

		<div
			:class="toolbarShellClass"
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

			<FontFamilySelect
				:model-value="fontFamily"
				:dominant-font-family="dominantFontFamily"
				@update:model-value="onFontFamilyUpdate"
			/>

			<NumberInput
				variant="toolbar"
				:model-value="fontSize"
				:fallback-value="dominantFontSize"
				:min="MIN_TEXT_FONT_SIZE"
				:max="MAX_TEXT_FONT_SIZE"
				input-width-class="w-8"
				commit-on-input
				:aria-label="fontSizeAriaLabel"
				increase-label="Increase font size"
				decrease-label="Decrease font size"
				title="Font size"
				@update:model-value="emit('setFontSize', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:text-font-size-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

			<NumberInput
				variant="toolbar"
				:model-value="lineHeight"
				:fallback-value="dominantLineHeight"
				:min="MIN_TEXT_LINE_HEIGHT"
				:max="MAX_TEXT_LINE_HEIGHT"
				:step="TEXT_LINE_HEIGHT_STEP"
				:decimals="2"
				inputmode="decimal"
				input-width-class="w-9"
				commit-on-input
				:aria-label="lineHeightAriaLabel"
				increase-label="Increase line height"
				decrease-label="Decrease line height"
				title="Line height"
				@update:model-value="emit('setLineHeight', $event)"
			>
				<template #leading>
					<span :class="leadingIconClass" aria-hidden="true">
						<Icon icon="fluent:text-line-spacing-24-regular" class="size-5 shrink-0" />
					</span>
				</template>
			</NumberInput>

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
						class="absolute inset-[4px] rounded-full border border-slate-300 bg-white dark:border-zinc-600 dark:bg-zinc-950"
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

			<NumberInput
				variant="toolbar"
				:model-value="strokeWidth"
				:fallback-value="dominantStrokeWidth"
				:min="MIN_TEXT_STROKE_WIDTH"
				input-width-class="w-8"
				commit-on-input
				:aria-label="strokeWidthAriaLabel"
				increase-label="Increase stroke width"
				decrease-label="Decrease stroke width"
				title="Stroke width"
				@update:model-value="emit('setStrokeWidth', $event)"
			/>

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

			<PageAlignSelect @align="onPageAlign" />

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
	</div>
</template>
