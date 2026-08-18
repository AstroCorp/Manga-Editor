import { shallowRef, type Ref } from 'vue';
import { Canvas } from 'fabric';
import { exportCanvasDataUrl } from '@/lib/fabric/exportCanvasDataUrl';
import { setupFabricCustomProperties } from '@/lib/fabric/fabricSetup';
import { applyPageCanvasLayout } from '@/lib/fabric/pageCanvasLayout';
import { hydrateCanvasFromPage } from '@/lib/fabric/shapeFabric';
import type { Page } from '@/models/Page';
import type { ExportImageFormat } from '@/types/editor';
import type { FabricCanvasController } from '@/types/fabric';

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
		});
		applyPageCanvasLayout(fabricCanvas.value, width, height);
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

		return exportCanvasDataUrl(canvas, format);
	};

	return {
		fabricCanvas,
		init,
		hydratePage,
		exportDataUrl,
		dispose,
	};
};
