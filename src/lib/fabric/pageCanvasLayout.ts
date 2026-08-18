import { Rect, type StaticCanvas } from 'fabric';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';

const pageClipRect = (pageWidth: number, pageHeight: number): Rect => {
	return new Rect({
		left: 0,
		top: 0,
		width: pageWidth,
		height: pageHeight,
		originX: 'left',
		originY: 'top',
		absolutePositioned: true,
	});
};

/** Canvas = página + margen para asas; las coords de página siguen en (0, 0). */
export const applyPageCanvasLayout = (
	canvas: StaticCanvas,
	pageWidth: number,
	pageHeight: number,
): void => {
	canvas.setDimensions({
		width: pageWidth + CONTROL_PASTEBOARD * 2,
		height: pageHeight + CONTROL_PASTEBOARD * 2,
	});
	canvas.setViewportTransform([
		1,
		0,
		0,
		1,
		CONTROL_PASTEBOARD,
		CONTROL_PASTEBOARD,
	]);
	// Recorta el contenido a la página; las asas se pintan después (controlsAboveOverlay).
	canvas.controlsAboveOverlay = true;
	canvas.clipPath = pageClipRect(pageWidth, pageHeight);
};


/** Recorte de exportación a la página (sin el margen de asas). */
export const pageExportCrop = (canvas: StaticCanvas) => {
	return {
		left: CONTROL_PASTEBOARD,
		top: CONTROL_PASTEBOARD,
		width: canvas.getWidth() - CONTROL_PASTEBOARD * 2,
		height: canvas.getHeight() - CONTROL_PASTEBOARD * 2,
	};
};
