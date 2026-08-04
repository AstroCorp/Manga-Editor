import { onBeforeUnmount, shallowRef, type Ref } from 'vue';
import { Canvas } from 'fabric';
import { setupFabricCustomProperties } from '@/lib/fabric/fabricSetup';
import { isGuide } from '@/lib/fabric/isGuide';
import { hydrateCanvasFromPage } from '@/lib/fabric/shapeFabric';
import type { Page } from '@/models/Page';
import type { ExportImageFormat } from '@/types/editor';

export const useFabricCanvas = (canvasEl: Ref<HTMLCanvasElement | null>) => {
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

		guides.forEach((guide) => {
			guide.visible = false;
		});

		try {
			return canvas.toDataURL({
				format,
				quality: 1,
				multiplier: 1,
			});
		} finally {
			guides.forEach((guide) => {
				guide.visible = true;
			});
			canvas.requestRenderAll();
		}
	};

	onBeforeUnmount(() => {
		dispose();
	});

	return {
		fabricCanvas,
		init,
		hydratePage,
		exportDataUrl,
	};
};
