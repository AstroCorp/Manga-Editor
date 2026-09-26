import { Canvas, FabricImage } from 'fabric';
import {
	findPanelById,
	getPanelId,
	isPanelImage,
	stackPageContent,
} from '@/lib/fabric/isGuide';
import {
	bindPanelImageToPanel,
	coverCenterForPanel,
	coverScaleForPanel,
} from '@/lib/fabric/panelImageFabric';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { convertFileToWebpDataUrl } from '@/lib/image/convertFileToWebp';
import { ShapeImage } from '@/models/ShapeImage';
import { useMangaStore } from '@/stores/manga';
import type { PlaceImageInPanelOptions } from '@/types/fabric';

export const isImageFile = (file: File): boolean => {
	return file.type.startsWith('image/');
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
}: PlaceImageInPanelOptions): Promise<boolean> => {
	const stale = () => {
		return Boolean(isStale?.());
	};

	const panel = findPanelById(canvas, panelId);

	if (!panel) {
		return false;
	}

	const mangaStore = useMangaStore();

	const bounds = panel.getBoundingRect();
	const dataUrl = await convertFileToWebpDataUrl(file);

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
		objectType: FABRIC_OBJECT_TYPE.PanelImage,
		panelId,
		layerId: livePanel.get('layerId'),
	});

	canvas.add(image);
	bindPanelImageToPanel(image, livePanel);
	stackPageContent(
		canvas,
		mangaStore.activePage.visibleLayerIds(),
	);

	livePanel.evented = false;
	livePanel.selectable = false;
	livePanel.set({ fill: panelFillColor(null, { hasImage: true }) });

	canvas.setActiveObject(image);
	canvas.requestRenderAll();

	return true;
};
