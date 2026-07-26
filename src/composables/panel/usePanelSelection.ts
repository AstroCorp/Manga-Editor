import { watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import { FabricImage, type Canvas, type FabricObject } from 'fabric';
import {
	findPanelById,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import { shapeImageFromFabric } from '@/lib/fabric/panelImageFabric';
import { clampStrokeWidth } from '@/lib/page/pageLimits';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { PanelLikeObject } from '@/types/fabric';
import type { SelectionDeps } from '@/types/panel';

export const usePanelSelection = ({
	fabricCanvas,
	syncInteractionMode,
	cancelStroke,
}: SelectionDeps) => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();

	/** Borra panel (+ imagen) o solo la imagen activa. */
	const removeActive = (): boolean => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return false;
		}

		const active = canvas.getActiveObject() as FabricObject | null;

		if (!active || isGuide(active)) {
			return false;
		}

		const panelId = getPanelId(active);

		if (isPanel(active) && panelId) {
			mangaStore.removeShape(panelId);
			removeObjectsByPanelId(canvas, panelId);

			canvas.discardActiveObject();

			editorStore.setHasSelection(false);
			editorStore.setSelectedStrokeWidth(null);

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		if (isPanelImage(active) && panelId) {
			mangaStore.setShapeImage(panelId, null);

			canvas.remove(active);
			canvas.discardActiveObject();

			editorStore.setHasSelection(false);
			editorStore.setSelectedStrokeWidth(null);

			syncInteractionMode();
			
			canvas.requestRenderAll();

			return true;
		}

		return false;
	};

	const resolveSelectedPanel = (): PanelLikeObject | null => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as PanelLikeObject | null;

		if (!canvas || !active) {
			return null;
		}

		if (isPanel(active)) {
			return active;
		}

		if (isPanelImage(active)) {
			const panelId = getPanelId(active);

			return panelId ? findPanelById(canvas, panelId) : null;
		}

		return null;
	};

	const syncSelectedStrokeWidth = () => {
		const panel = resolveSelectedPanel();

		if (!panel) {
			editorStore.setSelectedStrokeWidth(null);

			return;
		}

		editorStore.setSelectedStrokeWidth(
			clampStrokeWidth(
				Number(panel.strokeWidth ?? panel.get('strokeWidth')),
			),
		);
	};

	const onSelectionChange = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject();

		editorStore.setHasSelection(Boolean(active && !isGuide(active)));
		syncSelectedStrokeWidth();
	};

	const setSelectionStrokeWidth = (width: number): boolean => {
		const canvas = fabricCanvas.value;
		const panel = resolveSelectedPanel();
		const panelId = panel ? getPanelId(panel) : undefined;

		if (!canvas || !panel || !panelId) {
			return false;
		}

		const nextWidth = clampStrokeWidth(width);

		mangaStore.setShapeStrokeWidth(panelId, nextWidth);
		panel.set('strokeWidth', nextWidth);
		editorStore.setSelectedStrokeWidth(nextWidth);
		canvas.requestRenderAll();

		return true;
	};

	/** Tras mover/escalar imagen en Fabric, persiste transform en el dominio. */
	const onObjectModified = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null;

		if (!active || !isPanelImage(active) || !(active instanceof FabricImage)) {
			return;
		}

		const panelId = getPanelId(active);

		if (!panelId) {
			return;
		}

		mangaStore.setShapeImage(panelId, shapeImageFromFabric(active));
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement
		) {
			return;
		}

		if (event.key === 'Escape') {
			cancelStroke();

			return;
		}

		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (removeActive()) {
				event.preventDefault();
			}
		}
	};

	const bindSelectionEvents = (canvas: Canvas) => {
		canvas.on('selection:created', onSelectionChange);
		canvas.on('selection:updated', onSelectionChange);
		canvas.on('selection:cleared', onSelectionChange);
		canvas.on('object:modified', onObjectModified);
	};

	const unbindSelectionEvents = (canvas: Canvas) => {
		canvas.off('selection:created', onSelectionChange);
		canvas.off('selection:updated', onSelectionChange);
		canvas.off('selection:cleared', onSelectionChange);
		canvas.off('object:modified', onObjectModified);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				return;
			}

			bindSelectionEvents(canvas);

			onCleanup(() => {
				unbindSelectionEvents(canvas);
			});
		},
		{ immediate: true },
	);

	useEventListener(window, 'keydown', onKeyDown);

	return {
		removeActive,
		setSelectionStrokeWidth,
	};
};
