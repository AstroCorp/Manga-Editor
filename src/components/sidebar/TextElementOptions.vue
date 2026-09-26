<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { Icon } from '@iconify/vue';
import NumberInput from '@/components/ui/NumberInput.vue';
import FontFamilySelect from '@/features/text-color/components/FontFamilySelect.vue';
import PageAlignSelect from '@/features/text-color/components/PageAlignSelect.vue';
import TextAlignSelect from '@/features/text-color/components/TextAlignSelect.vue';
import {
	MAX_TEXT_FONT_SIZE,
	MAX_TEXT_LINE_HEIGHT,
	MIN_TEXT_FONT_SIZE,
	MIN_TEXT_LINE_HEIGHT,
	MIN_TEXT_STROKE_WIDTH,
	TEXT_LINE_HEIGHT_STEP,
	colorSwatchBackground,
} from '@/lib/fabric/textStyles';
import {
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_STROKE,
} from '@/models/TextBlock';
import { collectDocumentFontFamilies } from '@/lib/fonts/documentFonts';
import { useElementInspectorStore } from '@/stores/elementInspector';
import { useMangaStore } from '@/stores/manga';
import { useSelectionStore } from '@/stores/selection';
import type { TextBoxVerticalAlign } from '@/types/page';

const mangaStore = useMangaStore();
const selectionStore = useSelectionStore();
const inspectorStore = useElementInspectorStore();
const { focused } = storeToRefs(selectionStore);
const { textApi } = storeToRefs(inspectorStore);

const usedFontFamilies = computed(() => {
	return collectDocumentFontFamilies(mangaStore.pages);
});

const ready = computed(() => {
	const current = focused.value;
	const api = textApi.value;

	return Boolean(
		current?.kind === 'text' && api && api.elementId.value === current.id,
	);
});

const colors = computed(() => {
	return textApi.value?.colors.value ?? [DEFAULT_TEXT_FILL];
});

const strokeColors = computed(() => {
	return textApi.value?.strokeColors.value ?? [DEFAULT_TEXT_STROKE];
});

const colorValue = computed(() => {
	return colors.value[0] ?? DEFAULT_TEXT_FILL;
});

const strokeColorValue = computed(() => {
	return strokeColors.value[0] ?? DEFAULT_TEXT_STROKE;
});

const bold = computed(() => {
	return textApi.value?.bold.value ?? false;
});

const italic = computed(() => {
	return textApi.value?.italic.value ?? false;
});

const underline = computed(() => {
	return textApi.value?.underline.value ?? false;
});

const linethrough = computed(() => {
	return textApi.value?.linethrough.value ?? false;
});

const fontSize = computed(() => {
	return textApi.value?.fontSize.value ?? null;
});

const dominantFontSize = computed(() => {
	return textApi.value?.dominantFontSize.value ?? MIN_TEXT_FONT_SIZE;
});

const fontFamily = computed(() => {
	return textApi.value?.fontFamily.value ?? null;
});

const dominantFontFamily = computed(() => {
	return textApi.value?.dominantFontFamily.value ?? 'Arial';
});

const strokeWidth = computed(() => {
	return textApi.value?.strokeWidth.value ?? null;
});

const dominantStrokeWidth = computed(() => {
	return textApi.value?.dominantStrokeWidth.value ?? 0;
});

const lineHeight = computed(() => {
	return textApi.value?.lineHeight.value ?? null;
});

const dominantLineHeight = computed(() => {
	return textApi.value?.dominantLineHeight.value ?? 1;
});

const textAlign = computed(() => {
	return textApi.value?.textAlign.value ?? 'left';
});

const hasBox = computed(() => {
	return textApi.value?.hasBox.value ?? false;
});

const boxFill = computed(() => {
	return textApi.value?.boxFill.value ?? '#ffffff';
});

const boxStroke = computed(() => {
	return textApi.value?.boxStroke.value ?? '#000000';
});

const boxStrokeWidth = computed(() => {
	return textApi.value?.boxStrokeWidth.value ?? 0;
});

const boxCornerRadius = computed(() => {
	return textApi.value?.boxCornerRadius.value ?? 0;
});

const boxPadding = computed(() => {
	return textApi.value?.boxPadding.value ?? 0;
});

const boxWidth = computed(() => {
	return textApi.value?.boxWidth.value ?? 1;
});

const boxHeight = computed(() => {
	return textApi.value?.boxHeight.value ?? 1;
});

const boxVerticalAlign = computed(() => {
	return textApi.value?.boxVerticalAlign.value ?? 'middle';
});

const swatchStyle = computed(() => {
	return { background: colorSwatchBackground(colors.value) };
});

const strokeSwatchStyle = computed(() => {
	return { background: colorSwatchBackground(strokeColors.value) };
});

const onColorInput = (event: Event) => {
	textApi.value?.setColor((event.target as HTMLInputElement).value);
};

const onStrokeColorInput = (event: Event) => {
	textApi.value?.setStrokeColor((event.target as HTMLInputElement).value);
};

const onBoxFillInput = (event: Event) => {
	textApi.value?.setBoxFill((event.target as HTMLInputElement).value);
};

const onBoxStrokeInput = (event: Event) => {
	textApi.value?.setBoxStroke((event.target as HTMLInputElement).value);
};

const stylePressed = (pressed: boolean) => {
	return pressed
		? 'border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-400'
		: 'border-slate-200 bg-white text-slate-700 hover:border-blue-600/50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:text-blue-400';
};

const setVerticalAlign = (align: TextBoxVerticalAlign) => {
	textApi.value?.setBoxVerticalAlign(align);
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
			aria-label="Text format"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Text
			</h3>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Font</span>
				<FontFamilySelect
					:model-value="fontFamily"
					:dominant-font-family="dominantFontFamily"
					:used-font-families="usedFontFamilies"
					@update:model-value="textApi?.setFontFamily($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Size</span>
				<NumberInput
					:model-value="fontSize"
					:fallback-value="dominantFontSize"
					:min="MIN_TEXT_FONT_SIZE"
					:max="MAX_TEXT_FONT_SIZE"
					input-width-class="w-14"
					commit-on-input
					ariaLabel="Font size"
					increase-label="Increase font size"
					decrease-label="Decrease font size"
					@update:model-value="textApi?.setFontSize($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Line height</span>
				<NumberInput
					:model-value="lineHeight"
					:fallback-value="dominantLineHeight"
					:min="MIN_TEXT_LINE_HEIGHT"
					:max="MAX_TEXT_LINE_HEIGHT"
					:step="TEXT_LINE_HEIGHT_STEP"
					:decimals="2"
					inputmode="decimal"
					input-width-class="w-14"
					commit-on-input
					ariaLabel="Line height"
					increase-label="Increase line height"
					decrease-label="Decrease line height"
					@update:model-value="textApi?.setLineHeight($event)"
				/>
			</label>

			<div class="flex flex-wrap gap-1" role="group" aria-label="Text style">
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md border transition"
					:class="stylePressed(bold)"
					:aria-pressed="bold"
					aria-label="Bold"
					@click="textApi?.toggleBold()"
				>
					<Icon icon="fluent:text-bold-24-regular" class="size-5" />
				</button>
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md border transition"
					:class="stylePressed(italic)"
					:aria-pressed="italic"
					aria-label="Italic"
					@click="textApi?.toggleItalic()"
				>
					<Icon icon="fluent:text-italic-24-regular" class="size-5" />
				</button>
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md border transition"
					:class="stylePressed(underline)"
					:aria-pressed="underline"
					aria-label="Underline"
					@click="textApi?.toggleUnderline()"
				>
					<Icon icon="fluent:text-underline-24-regular" class="size-5" />
				</button>
				<button
					type="button"
					class="inline-flex size-9 items-center justify-center rounded-md border transition"
					:class="stylePressed(linethrough)"
					:aria-pressed="linethrough"
					aria-label="Strikethrough"
					@click="textApi?.toggleLinethrough()"
				>
					<Icon icon="fluent:text-strikethrough-24-regular" class="size-5" />
				</button>
			</div>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Align</span>
				<TextAlignSelect
					:model-value="textAlign"
					@update:model-value="textApi?.setTextAlign($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Color</span>
				<span
					class="relative inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
				>
					<span
						class="size-5 rounded-full border border-slate-300 shadow-sm dark:border-zinc-600"
						:style="swatchStyle"
						aria-hidden="true"
					/>
					<span>{{ colorValue }}</span>
					<input
						type="color"
						class="absolute inset-0 size-full cursor-pointer opacity-0"
						:value="colorValue"
						aria-label="Text color"
						@input="onColorInput"
					/>
				</span>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Stroke</span>
				<span
					class="relative inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
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
					<span>{{ strokeColorValue }}</span>
					<input
						type="color"
						class="absolute inset-0 size-full cursor-pointer opacity-0"
						:value="strokeColorValue"
						aria-label="Stroke color"
						@input="onStrokeColorInput"
					/>
				</span>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Stroke width</span>
				<NumberInput
					:model-value="strokeWidth"
					:fallback-value="dominantStrokeWidth"
					:min="MIN_TEXT_STROKE_WIDTH"
					input-width-class="w-14"
					commit-on-input
					ariaLabel="Stroke width"
					increase-label="Increase stroke width"
					decrease-label="Decrease stroke width"
					@update:model-value="textApi?.setStrokeWidth($event)"
				/>
			</label>

			<div class="flex min-h-9 items-center justify-between gap-3 text-sm">
				<span class="pr-2 text-slate-500 dark:text-slate-400">Page</span>
				<PageAlignSelect @align="textApi?.alignToPage($event)" />
			</div>
		</section>

		<section
			v-if="hasBox"
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Box format"
		>
			<h3
				class="mb-1 flex items-center gap-2.5 text-xs font-semibold tracking-[0.08em] text-blue-600 uppercase before:block before:h-3.5 before:w-0.5 before:shrink-0 before:rounded-full before:bg-blue-600 before:content-[''] dark:text-blue-400 dark:before:bg-blue-500"
			>
				Box
			</h3>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Fill</span>
				<span
					class="relative inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
				>
					<span
						class="size-5 rounded-sm border border-slate-300 shadow-sm dark:border-zinc-600"
						:style="{ background: boxFill }"
						aria-hidden="true"
					/>
					<span>{{ boxFill }}</span>
					<input
						type="color"
						class="absolute inset-0 size-full cursor-pointer opacity-0"
						:value="boxFill"
						aria-label="Box fill"
						@input="onBoxFillInput"
					/>
				</span>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Stroke</span>
				<span
					class="relative inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 font-mono text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200"
				>
					<span
						class="size-5 rounded-sm border border-slate-300 shadow-sm dark:border-zinc-600"
						:style="{ background: boxStroke }"
						aria-hidden="true"
					/>
					<span>{{ boxStroke }}</span>
					<input
						type="color"
						class="absolute inset-0 size-full cursor-pointer opacity-0"
						:value="boxStroke"
						aria-label="Box stroke"
						@input="onBoxStrokeInput"
					/>
				</span>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Stroke width</span>
				<NumberInput
					:model-value="boxStrokeWidth"
					:min="0"
					input-width-class="w-14"
					ariaLabel="Box stroke width"
					increase-label="Increase box stroke width"
					decrease-label="Decrease box stroke width"
					@update:model-value="textApi?.setBoxStrokeWidth($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Radius</span>
				<NumberInput
					:model-value="boxCornerRadius"
					:min="0"
					input-width-class="w-14"
					ariaLabel="Corner radius"
					increase-label="Increase corner radius"
					decrease-label="Decrease corner radius"
					@update:model-value="textApi?.setBoxCornerRadius($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Padding</span>
				<NumberInput
					:model-value="boxPadding"
					:min="0"
					input-width-class="w-14"
					ariaLabel="Box padding"
					increase-label="Increase box padding"
					decrease-label="Decrease box padding"
					@update:model-value="textApi?.setBoxPadding($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Width</span>
				<NumberInput
					:model-value="boxWidth"
					:min="1"
					input-width-class="w-14"
					ariaLabel="Box width"
					increase-label="Increase box width"
					decrease-label="Decrease box width"
					@update:model-value="textApi?.setBoxWidth($event)"
				/>
			</label>

			<label
				class="flex min-h-9 items-center justify-between gap-3 text-sm text-slate-900 dark:text-slate-100"
			>
				<span class="pr-2 text-slate-500 dark:text-slate-400">Height</span>
				<NumberInput
					:model-value="boxHeight"
					:min="1"
					input-width-class="w-14"
					ariaLabel="Box height"
					increase-label="Increase box height"
					decrease-label="Decrease box height"
					@update:model-value="textApi?.setBoxHeight($event)"
				/>
			</label>

			<div
				class="flex items-center justify-between gap-3"
				role="group"
				aria-label="Box vertical align"
			>
				<span class="text-sm text-slate-500 dark:text-slate-400">Vertical</span>
				<div class="flex gap-1">
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center rounded-md border transition"
						:class="stylePressed(boxVerticalAlign === 'top')"
						:aria-pressed="boxVerticalAlign === 'top'"
						aria-label="Align text top"
						@click="setVerticalAlign('top')"
					>
						<Icon icon="fluent:align-top-24-regular" class="size-5" />
					</button>
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center rounded-md border transition"
						:class="stylePressed(boxVerticalAlign === 'middle')"
						:aria-pressed="boxVerticalAlign === 'middle'"
						aria-label="Align text middle"
						@click="setVerticalAlign('middle')"
					>
						<Icon icon="fluent:align-center-vertical-24-regular" class="size-5" />
					</button>
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center rounded-md border transition"
						:class="stylePressed(boxVerticalAlign === 'bottom')"
						:aria-pressed="boxVerticalAlign === 'bottom'"
						aria-label="Align text bottom"
						@click="setVerticalAlign('bottom')"
					>
						<Icon icon="fluent:align-bottom-24-regular" class="size-5" />
					</button>
				</div>
			</div>
		</section>

		<section
			class="flex flex-col gap-3 border-b border-slate-200/70 py-5 first:pt-3 last:border-b-0 last:pb-1 dark:border-zinc-800/70"
			aria-label="Text actions"
		>
			<button
				type="button"
				class="flex min-h-9 w-full items-center justify-between gap-3 rounded-md border border-red-200 bg-white px-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400 dark:hover:bg-red-950"
				aria-label="Delete text"
				@click="textApi?.deleteText()"
			>
				<span>Delete text</span>
				<Icon icon="fluent:delete-24-regular" class="size-5 shrink-0" />
			</button>
		</section>
	</div>
</template>
