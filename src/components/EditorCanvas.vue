<script setup lang="ts">
import { ref } from 'vue';
import { useEditorCanvas } from '@/composables/fabric/useEditorCanvas';

const rootEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

const { stageStyle, scaleStyle, overlayViews, cancelStroke } = useEditorCanvas(
	canvasEl,
	rootEl,
);
</script>

<template>
	<!-- Click en el damero (fuera de la página) cancela el trazo. -->
	<div
		ref="rootEl"
		class="stage-checker h-full w-full overflow-auto p-8 pt-12"
		@pointerdown.self="cancelStroke"
	>
		<div class="relative mx-auto" :style="stageStyle">
			<div class="origin-top-left" :style="scaleStyle">
				<canvas ref="canvasEl" class="shadow-lg shadow-slate-900/20" />
			</div>
			<component
				:is="overlay.component"
				v-for="overlay in overlayViews"
				:key="overlay.id"
				v-bind="overlay.props"
				v-on="overlay.listeners"
			/>
		</div>
	</div>
</template>
