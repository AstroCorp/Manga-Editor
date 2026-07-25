<script setup lang="ts">
import { computed } from 'vue';
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
		<image
			v-for="(image, index) in model.images"
			:key="`img-${index}`"
			:href="image.href"
			:x="image.x"
			:y="image.y"
			:width="image.width"
			:height="image.height"
			preserveAspectRatio="xMidYMid slice"
		/>
		<polygon
			v-for="(panel, index) in model.panels"
			:key="`panel-${index}`"
			:points="panel.points"
			fill="rgba(255,255,255,0.35)"
			stroke="#111111"
			:stroke-width="panel.strokeWidth"
			stroke-linejoin="miter"
		/>
	</svg>
</template>
