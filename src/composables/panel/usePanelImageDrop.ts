/**
 * Drop de imagen sobre un panel: cover scale, clip al polígono,
 * escribe ShapeImage en el store y actualiza Fabric.
 */
import { type Ref, type ShallowRef } from 'vue';
import { useEventListener } from '@vueuse/core';
import { Canvas, FabricImage, Point, type TPointerEvent } from 'fabric';
import {
	findPanelById,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
	stackPageContent,
} from '@/lib/fabric/isGuide';
import {
	bindPanelImageHitTest,
	clonePanelClip,
	coverCenterForPanel,
	coverScaleForPanel,
} from '@/lib/fabric/panelImageFabric';
import { panelContainsScenePoint } from '@/lib/fabric/panelHitTest';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { ShapeImage } from '@/models/ShapeImage';
import { useMangaStore } from '@/stores/manga';
import type { PanelLikeObject } from '@/types/fabric';

const isImageFile = (file: File): boolean => {
	return file.type.startsWith('image/');
};

const readFileAsDataUrl = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);

				return;
			}

			reject(new Error('Could not read the image'));
		};
		reader.onerror = () => {
			reject(reader.error ?? new Error('Read error'));
		};
		reader.readAsDataURL(file);
	});
};

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

const removeExistingPanelImage = (canvas: Canvas, panelId: string) => {
	canvas
		.getObjects()
		.filter((object) => {
			return isPanelImage(object) && getPanelId(object) === panelId;
		})
		.forEach((object) => {
			canvas.remove(object);
		});
};

export const usePanelImageDrop = (dropEl: Ref<HTMLElement | null>, fabricCanvas: ShallowRef<Canvas | null>, onPlaced?: () => void) => {
	const mangaStore = useMangaStore();
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

		const bounds = panel.getBoundingRect();
		const generation = ++dropGeneration;
		const stillValid = () => {
			return dropGeneration === generation && fabricCanvas.value === canvas;
		};

		const dataUrl = await readFileAsDataUrl(file);

		if (!stillValid()) {
			return;
		}

		const image = await FabricImage.fromURL(dataUrl);

		if (!stillValid()) {
			return;
		}

		const livePanel = findPanelById(canvas, panelId);

		if (!livePanel) {
			return;
		}

		const clip = await clonePanelClip(livePanel);

		if (!stillValid() || !findPanelById(canvas, panelId)) {
			return;
		}

		const imgWidth = image.width || 1;
		const imgHeight = image.height || 1;
		const scale = coverScaleForPanel(bounds, imgWidth, imgHeight);
		const { left, top } = coverCenterForPanel(bounds);

		mangaStore.setShapeImage(
			panelId,
			new ShapeImage({
				src: dataUrl,
				left,
				top,
				scaleX: scale,
				scaleY: scale,
				originX: 'center',
				originY: 'center',
				width: imgWidth,
				height: imgHeight,
			}),
		);

		removeExistingPanelImage(canvas, panelId);

		image.set({
			left,
			top,
			originX: 'center',
			originY: 'center',
			scaleX: scale,
			scaleY: scale,
			selectable: true,
			evented: true,
			hasControls: true,
			lockMovementX: false,
			lockMovementY: false,
			clipPath: clip,
			perPixelTargetFind: true,
			objectType: FABRIC_OBJECT_TYPE.PanelImage,
			panelId,
		});

		canvas.add(image);

		bindPanelImageHitTest(image, livePanel);
		stackPageContent(canvas);

		livePanel.evented = false;
		livePanel.selectable = false;

		canvas.setActiveObject(image);
		canvas.requestRenderAll();
		
		onPlaced?.();
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
