<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useFabricCanvas } from '@/composables/fabric/useFabricCanvas';
import { useFabricZoom } from '@/composables/fabric/useFabricZoom';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { usePageContentReset } from '@/composables/page/usePageContentReset';
import { usePanelGuides } from '@/composables/panel/usePanelGuides';
import { usePanelSelection } from '@/composables/panel/usePanelSelection';
import { usePanelStroke } from '@/composables/panel/usePanelStroke';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

const mangaStore = useMangaStore();
const editorStore = useEditorStore();
const { activePageId, contentResetEpoch } = storeToRefs(mangaStore);
const { activePage, pageSize } = useActivePageLayout();

const rootEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);

const { fabricCanvas, init, hydratePage, exportDataUrl } = useFabricCanvas(canvasEl);
const { stageStyle, scaleStyle, resetZoomView } = useFabricZoom({
	fabricCanvas,
	rootEl,
	pageSize,
});
const { refreshGuides } = usePanelGuides({ fabricCanvas });
const { cancelStroke, syncInteractionMode } = usePanelStroke({ fabricCanvas });
const { removeActive, setSelectionStrokeWidth } = usePanelSelection({
	fabricCanvas,
	syncInteractionMode,
	cancelStroke,
});

const discardSelection = () => {
	fabricCanvas.value?.discardActiveObject();
	editorStore.setHasSelection(false);
	editorStore.setSelectedStrokeWidth(null);
};

const applyActivePage = () => {
	const page = activePage.value;

	cancelStroke();
	discardSelection();
	hydratePage(page);
	refreshGuides();
	syncInteractionMode();
	resetZoomView();
};

usePageContentReset({
	contentResetEpoch,
	applyReset: applyActivePage,
	discardSelection,
});

onMounted(() => {
	if (!canvasEl.value) {
		return;
	}

	const page = activePage.value;

	init(page.width, page.height);
	applyActivePage();

	editorStore.registerCanvas({
		cancelStroke,
		removeActive,
		setSelectionStrokeWidth,
		exportDataUrl,
		resetZoomView,
	});
});

onBeforeUnmount(() => {
	editorStore.unregisterCanvas();
});

watch(activePageId, (nextId, prevId) => {
	if (nextId === prevId) {
		return;
	}

	applyActivePage();
});
</script>

<template>
	<!-- Click en el damero (fuera de la página) cancela el trazo. -->
	<div
		ref="rootEl"
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
