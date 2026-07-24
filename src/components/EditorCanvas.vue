<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useFabricCanvas } from '@/composables/fabric/useFabricCanvas';

const ZOOM = 0.75;

const canvasEl = ref<HTMLCanvasElement | null>(null);
const { init, PAGE_WIDTH, PAGE_HEIGHT } = useFabricCanvas(canvasEl);

const stageStyle = computed(() => {
	return {
		width: `${PAGE_WIDTH * ZOOM}px`,
		height: `${PAGE_HEIGHT * ZOOM}px`,
	};
});

const scaleStyle = computed(() => {
	return {
		width: `${PAGE_WIDTH}px`,
		height: `${PAGE_HEIGHT}px`,
		transform: `scale(${ZOOM})`,
	};
});

onMounted(() => {
	init();
});
</script>

<template>
	<div class="stage-checker h-full w-full overflow-auto p-8 pt-12">
		<div class="mx-auto" :style="stageStyle">
			<div class="origin-top-left" :style="scaleStyle">
				<canvas ref="canvasEl" class="shadow-lg shadow-slate-900/20" />
			</div>
		</div>
	</div>
</template>
