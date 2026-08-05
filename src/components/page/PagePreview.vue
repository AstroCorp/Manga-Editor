<script setup lang="ts">
import { computed } from 'vue';
import { PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { buildPagePreview } from '@/lib/page/pagePreview';
import type { Shape } from '@/models/Shape';
import type { ShapeJSON } from '@/types/page';

const props = withDefaults(
	defineProps<{
		width: number;
		height: number;
		shapes?: Array<Shape | ShapeJSON> | null;
	}>(),
	{
		shapes: null,
	},
);

const model = computed(() => {
	return buildPagePreview(props.width, props.height, props.shapes);
});

const filledPanels = computed(() => {
	return model.value.panels.filter((panel) => {
		return panel.whiteFill;
	});
});
</script>

<template>
	<svg
		class="block h-full w-full bg-white dark:bg-zinc-100"
		:viewBox="`0 0 ${model.width} ${model.height}`"
		preserveAspectRatio="xMidYMid meet"
		role="img"
		aria-hidden="true"
	>
		<rect :width="model.width" :height="model.height" fill="#ffffff" />
		<!-- fill → image → stroke (imagen sobre fondo blanco) -->
		<polygon
			v-for="(panel, index) in filledPanels"
			:key="`fill-${index}`"
			:points="panel.points"
			fill="#ffffff"
			stroke="none"
		/>
		<image
			v-for="(image, index) in model.images"
			:key="`img-${index}`"
			:href="image.href"
			:x="image.x"
			:y="image.y"
			:width="image.width"
			:height="image.height"
			:style="image.grayscale ? { filter: 'grayscale(1)' } : undefined"
			preserveAspectRatio="xMidYMid slice"
		/>
		<polygon
			v-for="(panel, index) in model.panels"
			:key="`stroke-${index}`"
			:points="panel.points"
			fill="none"
			:stroke="PANEL_STROKE_COLOR"
			:stroke-width="panel.strokeWidth"
			stroke-linejoin="miter"
		/>
	</svg>
</template>
