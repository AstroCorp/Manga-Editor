<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import GridPointLabel from '@/components/canvas/GridPointLabel.vue';
import ShapeActionMenu from '@/components/canvas/ShapeActionMenu.vue';
import { useFabricCanvas } from '@/composables/fabric/useFabricCanvas';
import { useFabricZoom } from '@/composables/fabric/useFabricZoom';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import { usePageContentReset } from '@/composables/page/usePageContentReset';
import { useGridPointHover } from '@/composables/panel/useGridPointHover';
import { usePanelGuides } from '@/composables/panel/usePanelGuides';
import { usePanelImageDrop } from '@/composables/panel/usePanelImageDrop';
import { usePanelSelection } from '@/composables/panel/usePanelSelection';
import { usePanelStroke } from '@/composables/panel/usePanelStroke';
import { useShapeActionMenu } from '@/composables/panel/useShapeActionMenu';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

const mangaStore = useMangaStore();
const editorStore = useEditorStore();
const { activePageId, contentResetEpoch } = storeToRefs(mangaStore);
const { activePage, pageSize } = useActivePageLayout();

const rootEl = ref<HTMLElement | null>(null);
const canvasEl = ref<HTMLCanvasElement | null>(null);
/** Descarta hydrates obsoletos al cambiar de página / reset rápido. */
let hydrateGeneration = 0;

const { fabricCanvas, init, hydratePage, exportDataUrl } = useFabricCanvas(canvasEl);
const { stageStyle, scaleStyle, zoomFactor, resetZoomView } = useFabricZoom({
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

usePanelImageDrop(rootEl, fabricCanvas, syncInteractionMode);

const { hoverPoint, labelPosition } = useGridPointHover({ fabricCanvas });

/** Page coords → stage (page × zoom), sin escalar el UI. */
const toStageCoords = (position: { left: number; top: number } | null) => {
	if (!position) {
		return { left: null as number | null, top: null as number | null };
	}

	const factor = zoomFactor.value;

	return {
		left: position.left * factor,
		top: position.top * factor,
	};
};

const gridLabelStage = computed(() => {
	return toStageCoords(labelPosition.value);
});

const {
	visible: shapeMenuVisible,
	hasImage: shapeMenuHasImage,
	position: shapeMenuPosition,
	deleteShape,
	clearImage,
	placeImage,
	clearMenu: clearShapeMenu,
} = useShapeActionMenu({
	fabricCanvas,
	onChanged: syncInteractionMode,
});

const shapeMenuStage = computed(() => {
	return toStageCoords(shapeMenuPosition.value);
});

const discardSelection = () => {
	fabricCanvas.value?.discardActiveObject();
	editorStore.setHasSelection(false);
	editorStore.setSelectedStrokeWidth(null);
	clearShapeMenu();
};

const applyActivePage = async () => {
	const page = activePage.value;
	const generation = ++hydrateGeneration;

	cancelStroke();
	discardSelection();
	await hydratePage(page);

	if (generation !== hydrateGeneration) {
		return;
	}

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
	void applyActivePage();

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

	void applyActivePage();
});
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
			<GridPointLabel
				:point="hoverPoint"
				:left="gridLabelStage.left"
				:top="gridLabelStage.top"
			/>
			<ShapeActionMenu
				:visible="shapeMenuVisible"
				:has-image="shapeMenuHasImage"
				:left="shapeMenuStage.left"
				:top="shapeMenuStage.top"
				@delete-shape="deleteShape"
				@clear-image="clearImage"
				@place-image="placeImage"
			/>
		</div>
	</div>
</template>
