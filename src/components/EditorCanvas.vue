<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useFabricCanvas } from '@/composables/fabric/useFabricCanvas';
import { usePanelGuides } from '@/composables/panel/usePanelGuides';
import { usePanelStroke } from '@/composables/panel/usePanelStroke';

const ZOOM = 0.75;

const canvasEl = ref<HTMLCanvasElement | null>(null);
const { fabricCanvas, init, pageWidth, pageHeight } = useFabricCanvas(canvasEl);
const { refreshGuides } = usePanelGuides({ fabricCanvas });
const { cancelStroke } = usePanelStroke({ fabricCanvas });

const stageStyle = computed(() => {
	return {
		width: `${pageWidth.value * ZOOM}px`,
		height: `${pageHeight.value * ZOOM}px`,
	};
});

const scaleStyle = computed(() => {
	return {
		width: `${pageWidth.value}px`,
		height: `${pageHeight.value}px`,
		transform: `scale(${ZOOM})`,
	};
});

onMounted(() => {
	init();
	refreshGuides();
});
</script>

<template>
	<!-- Click en el damero (fuera de la página) cancela el trazo. -->
	<div
		class="stage-checker h-full w-full overflow-auto p-8 pt-12"
		@pointerdown.self="cancelStroke"
	>
		<div class="mx-auto" :style="stageStyle">
			<div class="origin-top-left" :style="scaleStyle">
				<canvas ref="canvasEl" class="shadow-lg shadow-slate-900/20" />
			</div>
		</div>
	</div>
</template>
