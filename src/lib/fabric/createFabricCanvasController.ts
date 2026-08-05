import { shallowRef, type Ref, type ShallowRef } from 'vue';
import { Canvas } from 'fabric';
import { setupFabricCustomProperties } from '@/lib/fabric/fabricSetup';
import { isGuide, isPanel } from '@/lib/fabric/isGuide';
import { hydrateCanvasFromPage } from '@/lib/fabric/shapeFabric';
import type { Page } from '@/models/Page';
import type { ExportImageFormat } from '@/types/editor';

export type FabricCanvasController = {
	fabricCanvas: ShallowRef<Canvas | null>;
	init: (width: number, height: number) => void;
	hydratePage: (page: Page) => Promise<void>;
	exportDataUrl: (format: ExportImageFormat) => string | null;
	dispose: () => void;
};

/** Core Fabric sin lifecycle Vue (el caller dispone en unmount). */
export const createFabricCanvasController = (
	canvasEl: Ref<HTMLCanvasElement | null>,
): FabricCanvasController => {
	const fabricCanvas = shallowRef<Canvas | null>(null);

	const dispose = () => {
		fabricCanvas.value?.dispose();
		fabricCanvas.value = null;
	};

	const init = (width: number, height: number) => {
		dispose();

		const element = canvasEl.value;

		if (!element) {
			return;
		}

		setupFabricCustomProperties();

		fabricCanvas.value = new Canvas(element, {
			width,
			height,
			backgroundColor: '#ffffff',
			selection: true,
		});

		// Fabric 7 aplica options en el constructor pero no pinta hasta el primer render.
		fabricCanvas.value.requestRenderAll();
	};

	const hydratePage = async (page: Page): Promise<void> => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		await hydrateCanvasFromPage(canvas, page);
	};

	const exportDataUrl = (format: ExportImageFormat): string | null => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return null;
		}

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

		try {
			return canvas.toDataURL({
				format,
				quality: 1,
				multiplier: 1,
			});
		} finally {
			panels.forEach((panel, index) => {
				panel.set({ fill: previousFills[index] });
			});
			guides.forEach((guide) => {
				guide.visible = true;
			});
			canvas.requestRenderAll();
		}
	};

	return {
		fabricCanvas,
		init,
		hydratePage,
		exportDataUrl,
		dispose,
	};
};
