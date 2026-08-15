/**
 * Puente ShapeImage ↔ FabricImage (clip del panel, cover scale, sync).
 */
import { FabricImage, type FabricObject, type Point } from 'fabric';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import {
	hasGrayscaleFilter,
	setGrayscaleFilter,
} from '@/lib/fabric/panelImageFilters';
import {
	getPanelScenePoints,
	panelContainsScenePoint,
} from '@/lib/fabric/panelHitTest';
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
		flipX: Boolean(image.flipX),
		flipY: Boolean(image.flipY),
	});
};

/**
 * Traza el polígono del panel en coords de escena.
 * @returns false si no hay forma recortable.
 */
export const clipContextToPanel = (
	ctx: CanvasRenderingContext2D,
	panel: FabricObject,
): boolean => {
	const points = getPanelScenePoints(panel);
	const first = points[0];

	if (points.length < 3 || !first) {
		return false;
	}

	ctx.beginPath();
	ctx.moveTo(first.x, first.y);

	for (const point of points.slice(1)) {
		ctx.lineTo(point.x, point.y);
	}

	ctx.closePath();

	return true;
};

/**
 * Crea FabricImage recortada al polígono del panel (sin clipPath de Fabric).
 * El hit-test usa el polígono: el bbox de la imagen suele sobresalir del recorte.
 */
export const shapeImageToFabric = async (
	shape: Shape,
	image: ShapeImage,
	panel: FabricObject,
	options?: { interactive?: boolean },
): Promise<FabricImage> => {
	const fabricImage = await FabricImage.fromURL(image.src);
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
		flipX: image.flipX,
		flipY: image.flipY,
		selectable: interactive,
		evented: interactive,
		hasControls: interactive,
		lockMovementX: !interactive,
		lockMovementY: !interactive,
		objectCaching: false,
		perPixelTargetFind: true,
		objectType: FABRIC_OBJECT_TYPE.PanelImage,
		panelId: shape.id,
		...(typeof layerId === 'string' ? { layerId } : {}),
	});

	bindPanelImageToPanel(fabricImage, panel);

	if (image.grayscale) {
		setGrayscaleFilter(fabricImage, true);
	}

	return fabricImage;
};

/**
 * Recorte e hit-test al polígono del panel.
 * No usamos clipPath de Fabric: con scale grande el cache supera
 * maxCacheSideLimit (4096) y la imagen desaparece dentro de la forma.
 */
export const bindPanelImageToPanel = (
	image: FabricImage,
	panel: FabricObject,
): void => {
	image.objectCaching = false;
	image.needsItsOwnCache = () => {
		return false;
	};
	image.shouldCache = () => {
		return false;
	};
	image.isOnScreen = () => {
		return panel.isOnScreen();
	};
	image.containsPoint = (point: Point): boolean => {
		return panelContainsScenePoint(panel, point);
	};

	const renderObject = image.render.bind(image);

	image.render = function (ctx: CanvasRenderingContext2D) {
		ctx.save();

		if (clipContextToPanel(ctx, panel)) {
			ctx.clip();
		}

		renderObject(ctx);
		ctx.restore();
	};
};
