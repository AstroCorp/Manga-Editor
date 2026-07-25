/**
 * Guía de rejilla: un FabricImage rasterizado (puntos) con caché por métricas.
 * Más barato que N círculos Fabric al mover el viewport.
 */
import { FabricImage } from 'fabric';
import { GUIDE_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { toCanvasPoint } from '@/lib/panel/panelGeometry';
import type { PageLayoutMetrics } from '@/types/geometry';
import type { GridGuideImage } from '@/types/fabric';

const GUIDE_DOT_RADIUS = 1.5;

type GuideCacheKey = string;

let cachedKey: GuideCacheKey | null = null;
let cachedElement: HTMLCanvasElement | null = null;

const guideCacheKey = (layout: PageLayoutMetrics): GuideCacheKey => {
	const { width, height, cols, rows, margins } = layout;

	return [
		width,
		height,
		cols,
		rows,
		margins.marginTop,
		margins.marginRight,
		margins.marginBottom,
		margins.marginLeft,
	].join(':');
};

const buildGuideElement = (layout: PageLayoutMetrics): HTMLCanvasElement => {
	const { width, height, cols, rows } = layout;
	const element = document.createElement('canvas');

	element.width = Math.max(1, Math.round(width));
	element.height = Math.max(1, Math.round(height));

	const context = element.getContext('2d');

	if (!context) {
		throw new Error('Could not create the grid canvas context');
	}

	context.clearRect(0, 0, width, height);
	context.fillStyle = GUIDE_STROKE_COLOR;

	for (let col = 0; col < cols; col += 1) {
		for (let row = 0; row < rows; row += 1) {
			const { x, y } = toCanvasPoint({ col, row }, layout);

			context.beginPath();
			context.arc(x, y, GUIDE_DOT_RADIUS, 0, Math.PI * 2);
			context.fill();
		}
	}

	return element;
};

/** Crea (o reutiliza de caché) la imagen Fabric de la rejilla de puntos. */
export const createGridGuideImage = (layout: PageLayoutMetrics): GridGuideImage => {
	const key = guideCacheKey(layout);

	if (cachedKey !== key || !cachedElement) {
		cachedElement = buildGuideElement(layout);
		cachedKey = key;
	}

	// Usamos una imagen para representar la rejilla de puntos en el canvas y evitar pintar N círculos Fabric al mover el viewport.
	// Esto es más barato que N círculos Fabric al mover el viewport.
	const image = new FabricImage(cachedElement, {
		left: 0,
		top: 0,
		originX: 'left',
		originY: 'top',
		selectable: false,
		evented: false,
		excludeFromExport: true,
		objectCaching: true,
		hoverCursor: 'crosshair',
	}) as GridGuideImage;

	image.isGuide = true;
	
	return image;
};
