import { StaticCanvas } from 'fabric';
import { exportCanvasDataUrl } from '@/lib/fabric/exportCanvasDataUrl';
import { hydrateCanvasFromPage } from '@/lib/fabric/shapeFabric';
import type { Page } from '@/models/Page';
import type { ExportImageFormat } from '@/types/editor';

/** Exporta una página en un canvas offscreen (no toca el editor). */
export const exportPageToDataUrl = async (
	page: Page,
	format: ExportImageFormat,
): Promise<string> => {
	const canvas = new StaticCanvas(undefined, {
		enableRetinaScaling: false,
		renderOnAddRemove: false,
	});

	try {
		await hydrateCanvasFromPage(canvas, page);

		return exportCanvasDataUrl(canvas, format);
	} finally {
		await canvas.dispose();
	}
};
