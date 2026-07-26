import { type Ref, type ShallowRef } from 'vue';
import { useEventListener } from '@vueuse/core';
import { Canvas, Point, type TPointerEvent } from 'fabric';
import {
	findPanelById,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
} from '@/lib/fabric/isGuide';
import { panelContainsScenePoint } from '@/lib/fabric/panelHitTest';
import {
	isImageFile,
	placeImageFileInPanel,
} from '@/lib/fabric/panelImagePlace';
import type { PanelLikeObject } from '@/types/fabric';

/** Resuelve el panel bajo el punto (o el asociado a una imagen ya colocada). */
const resolvePanelAtPoint = (canvas: Canvas, x: number, y: number): PanelLikeObject | null => {
	const point = new Point(x, y);
	const objects = canvas.getObjects().filter((object) => {
		return !isGuide(object);
	});

	for (let i = objects.length - 1; i >= 0; i -= 1) {
		const object = objects[i] as PanelLikeObject;

		if (isPanel(object)) {
			if (!panelContainsScenePoint(object, point)) {
				continue;
			}

			return object;
		}

		const imagePanelId = getPanelId(object);

		if (isPanelImage(object) && imagePanelId) {
			const panel = findPanelById(canvas, imagePanelId);

			if (panel && panelContainsScenePoint(panel, point)) {
				return panel;
			}
		}
	}

	const active = canvas.getActiveObject() as PanelLikeObject | null;

	if (active && isPanel(active)) {
		return active;
	}

	const activePanelId = active ? getPanelId(active) : undefined;

	if (active && isPanelImage(active) && activePanelId) {
		return findPanelById(canvas, activePanelId);
	}

	return null;
};

export const usePanelImageDrop = (dropEl: Ref<HTMLElement | null>, fabricCanvas: ShallowRef<Canvas | null>, onPlaced?: () => void) => {
	let dropGeneration = 0;

	const onDragOver = (event: DragEvent) => {
		if (![...(event.dataTransfer?.types ?? [])].includes('Files')) {
			return;
		}

		event.preventDefault();

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'copy';
		}
	};

	const placeImageInPanel = async (file: File, event: DragEvent) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		const scenePoint = canvas.getScenePoint(
			event as unknown as TPointerEvent,
		);
		const panel = resolvePanelAtPoint(canvas, scenePoint.x, scenePoint.y);
		const panelId = panel ? getPanelId(panel) : undefined;

		if (!panel || !panelId) {
			return;
		}

		const generation = ++dropGeneration;
		const placed = await placeImageFileInPanel({
			canvas,
			panelId,
			file,
			isStale: () => {
				return (
					dropGeneration !== generation || fabricCanvas.value !== canvas
				);
			},
		});

		if (placed) {
			onPlaced?.();
		}
	};

	const onDrop = (event: DragEvent) => {
		event.preventDefault();

		const files = [...(event.dataTransfer?.files ?? [])].filter(isImageFile);
		const file = files[0];

		if (!file) {
			return;
		}

		void placeImageInPanel(file, event);
	};

	useEventListener(dropEl, 'dragover', onDragOver);
	useEventListener(dropEl, 'drop', onDrop);
};
