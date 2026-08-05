/**
 * Puente ShapeImage ↔ FabricImage (clip del panel, cover scale, sync).
 */
import { FabricImage, type FabricObject, type Point } from 'fabric';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	hasGrayscaleFilter,
	setGrayscaleFilter,
} from '@/lib/fabric/panelImageFilters';
import { panelContainsScenePoint } from '@/lib/fabric/panelHitTest';
import { ShapeImage } from '@/models/ShapeImage';
import type { Shape } from '@/models/Shape';
import type { PanelBounds, PanelCenter } from '@/types/fabric';

/** Escala cover para llenar el bbox del panel. */
export const coverScaleForPanel = (bounds: PanelBounds, imgWidth: number, imgHeight: number): number => {
	const width = Math.max(1, imgWidth);
	const height = Math.max(1, imgHeight);

	return Math.max(bounds.width / width, bounds.height / height);
};

/** Centro del bbox (origen center al drop). */
export const coverCenterForPanel = (bounds: PanelBounds): PanelCenter => {
	return {
		left: bounds.left + bounds.width / 2,
		top: bounds.top + bounds.height / 2,
	};
};

/** Lee transform de una FabricImage hacia el modelo de dominio. */
export const shapeImageFromFabric = (image: FabricImage): ShapeImage => {
	const src =
		typeof image.getSrc === 'function'
			? image.getSrc()
			: String(image.get('src') ?? '');

	return new ShapeImage({
		src,
		left: image.left ?? 0,
		top: image.top ?? 0,
		scaleX: image.scaleX ?? 1,
		scaleY: image.scaleY ?? 1,
		originX: image.originX === 'left' ? 'left' : 'center',
		originY: image.originY === 'top' ? 'top' : 'center',
		width: Math.max(1, image.width ?? 1),
		height: Math.max(1, image.height ?? 1),
		angle: image.angle ?? 0,
		grayscale: hasGrayscaleFilter(image),
	});
};

/**
 * Crea un clipPath a partir del panel (coords absolutas de página).
 */
export const clonePanelClip = async (panel: FabricObject): Promise<FabricObject> => {
	const clip = await panel.clone();

	clip.set({
		absolutePositioned: true,
		fill: '#000000',
		strokeWidth: 0,
		selectable: false,
		evented: false,
	});

	return clip;
};

/**
 * Crea FabricImage con clipPath = clon del panel (recorte a la forma).
 * El hit-test usa el polígono del panel (el bbox de la imagen suele sobresalir del clip).
 */
export const shapeImageToFabric = async (
	shape: Shape,
	image: ShapeImage,
	panel: FabricObject,
	options?: { interactive?: boolean },
): Promise<FabricImage> => {
	const fabricImage = await FabricImage.fromURL(image.src);
	const clip = await clonePanelClip(panel);
	const interactive = options?.interactive ?? true;
	const layerId = panel.get('layerId');

	fabricImage.set({
		left: image.left,
		top: image.top,
		originX: image.originX,
		originY: image.originY,
		scaleX: image.scaleX,
		scaleY: image.scaleY,
		angle: image.angle,
		selectable: interactive,
		evented: interactive,
		hasControls: interactive,
		lockMovementX: !interactive,
		lockMovementY: !interactive,
		clipPath: clip,
		perPixelTargetFind: true,
		objectType: FABRIC_OBJECT_TYPE.PanelImage,
		panelId: shape.id,
		...(typeof layerId === 'string' ? { layerId } : {}),
	});

	bindPanelImageHitTest(fabricImage, panel);

	if (image.grayscale) {
		setGrayscaleFilter(fabricImage, true);
	}

	return fabricImage;
};

/**
 * Hit-test solo dentro del panel: sin esto, clicks fuera de la forma
 * (pero dentro del bbox cover de la imagen) la seleccionan y bloquean el dibujo.
 * Nota: Fabric 7 no usa containsPoint en findTarget; ver installPanelImageTargetFind.
 */
export const bindPanelImageHitTest = (image: FabricImage, panel: FabricObject): void => {
	image.containsPoint = (point: Point): boolean => {
		return panelContainsScenePoint(panel, point);
	};
};
