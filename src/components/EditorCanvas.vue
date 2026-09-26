<script setup lang="ts">
import { ref } from 'vue';
import { useEditorCanvas } from '@/composables/fabric/useEditorCanvas';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';

const rootEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

const {
	stageStyle,
	scaleStyle,
	rootStyle,
	pageBackgroundStyle,
	overlayViews,
	cancelStroke,
} = useEditorCanvas(canvasEl, rootEl);
</script>

<template>
	<!-- Click en el damero (fuera de la página) cancela el trazo. -->
	<div
		ref="rootEl"
		class="stage-checker h-full w-full overflow-auto"
		:style="rootStyle"
		@pointerdown.self="cancelStroke"
	>
		<div class="relative mx-auto" :style="stageStyle">
			<div
				class="editor-page-scale relative origin-top-left"
				:style="{
					...scaleStyle,
					'--control-pasteboard': `${CONTROL_PASTEBOARD}px`,
				}"
			>
				<div
					class="pointer-events-none absolute inset-0 shadow-lg shadow-slate-900/20"
					:style="pageBackgroundStyle"
				/>
				<canvas ref="canvasEl" />
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
