import { Rect, type StaticCanvas } from 'fabric';
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';

/** El margen crece a saltos para no redimensionar el bitmap en cada píxel del arrastre. */
export const PASTEBOARD_STEP = 64;

/** Tope para que un objeto enorme no cree un canvas de cientos de megapíxeles. */
export const MAX_CONTROL_PASTEBOARD = 4096;

export type PagePasteboard = {
	left: number;
	top: number;
	right: number;
	bottom: number;
};

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

export const minPagePasteboard = (): PagePasteboard => {
	return {
		left: CONTROL_PASTEBOARD,
		top: CONTROL_PASTEBOARD,
		right: CONTROL_PASTEBOARD,
		bottom: CONTROL_PASTEBOARD,
	};
};

const snapPasteboardSide = (overflow: number): number => {
	const min = CONTROL_PASTEBOARD;
	const needed = Math.max(min, overflow);

	if (needed <= min) {
		return min;
	}

	const steps = Math.ceil((needed - min) / PASTEBOARD_STEP);

	return Math.min(MAX_CONTROL_PASTEBOARD, min + steps * PASTEBOARD_STEP);
};

/**
 * Margen para que las asas quepan fuera de la página.
 * `overflow` incluye el propio CONTROL_PASTEBOARD más allá del bbox (asa de rotación).
 */
export const pasteboardForSceneBounds = (
	bounds: { left: number; top: number; width: number; height: number } | null,
	pageWidth: number,
	pageHeight: number,
): PagePasteboard => {
	if (!bounds) {
		return minPagePasteboard();
	}

	const overhang = CONTROL_PASTEBOARD;

	return {
		left: snapPasteboardSide(-bounds.left + overhang),
		top: snapPasteboardSide(-bounds.top + overhang),
		right: snapPasteboardSide(bounds.left + bounds.width - pageWidth + overhang),
		bottom: snapPasteboardSide(bounds.top + bounds.height - pageHeight + overhang),
	};
};

type PasteboardObject = {
	setCoords: () => void;
	getBoundingRect: () => {
		left: number;
		top: number;
		width: number;
		height: number;
	};
};

export const pasteboardForSelection = (
	object: PasteboardObject | null | undefined,
	pageWidth: number,
	pageHeight: number,
): PagePasteboard => {
	if (!object) {
		return minPagePasteboard();
	}

	object.setCoords();

	return pasteboardForSceneBounds(object.getBoundingRect(), pageWidth, pageHeight);
};

export const growPasteboard = (
	current: PagePasteboard,
	needed: PagePasteboard,
): PagePasteboard => {
	return {
		left: Math.max(current.left, needed.left),
		top: Math.max(current.top, needed.top),
		right: Math.max(current.right, needed.right),
		bottom: Math.max(current.bottom, needed.bottom),
	};
};

export const pasteboardsEqual = (
	previous: PagePasteboard,
	next: PagePasteboard,
): boolean => {
	return (
		previous.left === next.left &&
		previous.top === next.top &&
		previous.right === next.right &&
		previous.bottom === next.bottom
	);
};

export const pasteboardScrollDelta = (
	previous: PagePasteboard,
	next: PagePasteboard,
	zoom: number,
): { x: number; y: number } => {
	return {
		x: (next.left - previous.left) * zoom,
		y: (next.top - previous.top) * zoom,
	};
};

/** Canvas = página + margen para asas; las coords de página siguen en (0, 0). */
export const applyPageCanvasLayout = (
	canvas: StaticCanvas,
	pageWidth: number,
	pageHeight: number,
	pasteboard: PagePasteboard = minPagePasteboard(),
): void => {
	const width = pageWidth + pasteboard.left + pasteboard.right;
	const height = pageHeight + pasteboard.top + pasteboard.bottom;

	// setDimensions reescribe el bitmap y lo deja en blanco hasta el próximo
	// frame; saltarlo cuando el tamaño no cambia evita el parpadeo.
	if (canvas.getWidth() !== width || canvas.getHeight() !== height) {
		canvas.setDimensions({ width, height });
	}
	canvas.setViewportTransform([
		1,
		0,
		0,
		1,
		pasteboard.left,
		pasteboard.top,
	]);
	// Recorta el contenido a la página; las asas se pintan después (controlsAboveOverlay).
	canvas.controlsAboveOverlay = true;
	canvas.clipPath = pageClipRect(pageWidth, pageHeight);
};

/** Recorte de exportación a la página (sin el margen de asas). */
export const pageExportCrop = (canvas: StaticCanvas) => {
	const viewport = canvas.viewportTransform;
	const left = viewport?.[4] ?? CONTROL_PASTEBOARD;
	const top = viewport?.[5] ?? CONTROL_PASTEBOARD;
	const clip = canvas.clipPath;
	const pageWidth = clip?.width;
	const pageHeight = clip?.height;

	return {
		left,
		top,
		width:
			typeof pageWidth === 'number' ? pageWidth : canvas.getWidth() - left * 2,
		height:
			typeof pageHeight === 'number'
				? pageHeight
				: canvas.getHeight() - top * 2,
	};
};
