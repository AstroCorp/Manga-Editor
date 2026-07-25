import { onBeforeUnmount, shallowRef, type Ref } from 'vue';
import { Canvas } from 'fabric';
import { setupFabricCustomProperties } from '@/lib/fabric/fabricSetup';
import { hydrateCanvasFromPage } from '@/lib/fabric/shapeFabric';
import type { Page } from '@/models/Page';

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

	const hydratePage = (page: Page) => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		hydrateCanvasFromPage(canvas, page);
	};

	onBeforeUnmount(() => {
		dispose();
	});

	return {
		fabricCanvas,
		init,
		hydratePage,
	};
};
