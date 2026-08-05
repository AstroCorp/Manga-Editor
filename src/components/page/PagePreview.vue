<script setup lang="ts">
import { computed, useId } from 'vue';
import { PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { buildPagePreview } from '@/lib/page/pagePreview';
import type { Shape } from '@/models/Shape';
import type { TextBlock } from '@/models/TextBlock';
import type { ShapeJSON } from '@/types/page';

const props = withDefaults(
	defineProps<{
		width: number;
		height: number;
		shapes?: Array<Shape | ShapeJSON> | null;
		texts?: TextBlock[] | null;
	}>(),
	{
		shapes: null,
		texts: null,
	},
);

const previewId = useId();

const model = computed(() => {
	return buildPagePreview(props.width, props.height, props.shapes, props.texts);
});

const filledPanels = computed(() => {
	return model.value.panels.filter((panel) => {
		return panel.whiteFill;
	});
});

const rotateTransform = (angle: number, originX: number, originY: number) => {
	if (!angle) {
		return undefined;
	}

	return `rotate(${angle} ${originX} ${originY})`;
};

const clipPathId = (index: number) => {
	return `${previewId}-img-clip-${index}`;
};
</script>

<template>
	<svg
		class="block h-full w-full bg-white dark:bg-zinc-100"
		:viewBox="`0 0 ${model.width} ${model.height}`"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-hidden="true"
	>
		<defs>
			<clipPath
				v-for="(image, index) in model.images"
				:id="clipPathId(index)"
				:key="`clip-${index}`"
			>
				<polygon :points="image.clipPoints" />
			</clipPath>
		</defs>
		<rect :width="model.width" :height="model.height" fill="#ffffff" />
		<!-- fill → image (clip forma) → stroke -->
		<polygon
			v-for="(panel, index) in filledPanels"
			:key="`fill-${index}`"
			:points="panel.points"
			fill="#ffffff"
			stroke="none"
		/>
		<g
			v-for="(image, index) in model.images"
			:key="`img-${index}`"
			:clip-path="`url(#${clipPathId(index)})`"
		>
			<image
				:href="image.href"
				:x="image.x"
				:y="image.y"
				:width="image.width"
				:height="image.height"
				:transform="rotateTransform(image.angle, image.originX, image.originY)"
				:style="image.grayscale ? { filter: 'grayscale(1)' } : undefined"
				preserveAspectRatio="xMidYMid slice"
			/>
		</g>
		<polygon
			v-for="(panel, index) in model.panels"
			:key="`stroke-${index}`"
			:points="panel.points"
			fill="none"
			:stroke="PANEL_STROKE_COLOR"
			:stroke-width="panel.strokeWidth"
			stroke-linejoin="miter"
		/>
		<text
			v-for="(text, index) in model.texts"
			:key="`text-${index}`"
			:x="text.x"
			:y="text.y"
			:font-size="text.fontSize"
			:fill="text.fill"
			:font-weight="text.fontWeight"
			:font-style="text.fontStyle"
			:text-decoration="
				[text.underline ? 'underline' : '', text.linethrough ? 'line-through' : '']
					.filter(Boolean)
					.join(' ') || undefined
			"
			:transform="rotateTransform(text.angle, text.originX, text.originY)"
			font-family="Arial, sans-serif"
			xml:space="preserve"
		>
			{{ text.content }}
		</text>
	</svg>
</template>
