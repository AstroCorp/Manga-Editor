import { watch } from 'vue';
import { useEventListener } from '@vueuse/core';
import { FabricImage, type Canvas, type FabricObject } from 'fabric';
import {
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import { shapeImageFromFabric } from '@/lib/fabric/panelImageFabric';
import { clampStrokeWidth } from '@/lib/page/pageLimits';
import { useMangaStore } from '@/stores/manga';
import type { SelectionDeps } from '@/types/panel';

export const usePanelSelection = ({
	fabricCanvas,
	syncInteractionMode,
	cancelStroke,
}: SelectionDeps) => {
	const mangaStore = useMangaStore();

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

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		if (isPanelImage(active) && panelId) {
			mangaStore.setShapeImage(panelId, null);

			canvas.remove(active);
			canvas.discardActiveObject();

			syncInteractionMode();

			canvas.requestRenderAll();

			return true;
		}

		return false;
	};

	/** Aplica el stroke de página a todos los paneles del canvas. */
	const applyPageStrokeWidth = (width: number) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		const nextWidth = clampStrokeWidth(width);

		canvas.getObjects().forEach((object) => {
			if (!isPanel(object)) {
				return;
			}

			object.set('strokeWidth', nextWidth);
		});

		canvas.requestRenderAll();
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
		canvas.on('object:modified', onObjectModified);
	};

	const unbindSelectionEvents = (canvas: Canvas) => {
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

	watch(
		() => mangaStore.strokeWidth,
		(width) => {
			applyPageStrokeWidth(width);
		},
	);

	useEventListener(window, 'keydown', onKeyDown);
};
