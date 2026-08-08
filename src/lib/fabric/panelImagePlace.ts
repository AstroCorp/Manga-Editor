import { Canvas, FabricImage } from 'fabric';
import {
	findPanelById,
	getPanelId,
	isPanelImage,
	stackPageContent,
} from '@/lib/fabric/isGuide';
import {
	bindPanelImageHitTest,
	clonePanelClip,
	coverCenterForPanel,
	coverScaleForPanel,
} from '@/lib/fabric/panelImageFabric';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { ShapeImage } from '@/models/ShapeImage';
import { useMangaStore } from '@/stores/manga';
import type { PlaceImageInPanelOptions } from '@/types/fabric';

export const isImageFile = (file: File): boolean => {
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

/** @returns true si la imagen quedó colocada. */
export const placeImageFileInPanel = async ({
	canvas,
	panelId,
	file,
	isStale,
	selectAfterPlace = true,
}: PlaceImageInPanelOptions): Promise<boolean> => {
	const mangaStore = useMangaStore();
	const stale = () => {
		return Boolean(isStale?.());
	};

	const panel = findPanelById(canvas, panelId);

	if (!panel) {
		return false;
	}

	const bounds = panel.getBoundingRect();
	const dataUrl = await readFileAsDataUrl(file);

	if (stale()) {
		return false;
	}

	const image = await FabricImage.fromURL(dataUrl);

	if (stale()) {
		return false;
	}

	const livePanel = findPanelById(canvas, panelId);

	if (!livePanel) {
		return false;
	}

	const clip = await clonePanelClip(livePanel);

	if (stale() || !findPanelById(canvas, panelId)) {
		return false;
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
		layerId: livePanel.get('layerId'),
	});

	canvas.add(image);
	bindPanelImageHitTest(image, livePanel);
	stackPageContent(
		canvas,
		mangaStore.activePage.visibleLayerIds(),
	);

	livePanel.evented = false;
	livePanel.selectable = false;
	livePanel.set({ fill: panelFillColor(false, { hasImage: true }) });

	if (selectAfterPlace) {
		canvas.setActiveObject(image);
	}

	canvas.requestRenderAll();

	return true;
};
