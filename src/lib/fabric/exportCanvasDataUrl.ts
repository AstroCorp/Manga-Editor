import type { StaticCanvas } from 'fabric';
import { isGuide, isPanel } from '@/lib/fabric/isGuide';
import { pageExportCrop } from '@/lib/fabric/pageCanvasLayout';
import type { ExportImageFormat } from '@/types/editor';

/** Rasteriza el canvas de página: sin guías, paneles transparentes y fondo blanco. */
export const exportCanvasDataUrl = (
	canvas: StaticCanvas,
	format: ExportImageFormat,
): string => {
	const guides = canvas.getObjects().filter((object) => {
		return isGuide(object);
	});
	const panels = canvas.getObjects().filter((object) => {
		return isPanel(object);
	});
	const previousFills = panels.map((panel) => {
		return panel.fill;
	});

	guides.forEach((guide) => {
		guide.visible = false;
	});
	/* whiteFill es solo vista en editor; la descarga siempre sin relleno. */
	panels.forEach((panel) => {
		panel.set({ fill: 'transparent' });
	});

	const previousBackground = canvas.backgroundColor;
	canvas.backgroundColor = '#ffffff';

	try {
		return canvas.toDataURL({
			format,
			quality: 1,
			multiplier: 1,
			...pageExportCrop(canvas),
		});
	} finally {
		canvas.backgroundColor = previousBackground;
		panels.forEach((panel, index) => {
			panel.set({ fill: previousFills[index] });
		});
		guides.forEach((guide) => {
			guide.visible = true;
		});
		canvas.requestRenderAll();
	}
};
