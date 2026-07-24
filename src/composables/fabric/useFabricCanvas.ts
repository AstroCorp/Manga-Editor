/**
 * Ciclo de vida del Canvas Fabric: init / dispose.
 */
import { onBeforeUnmount, shallowRef, type Ref } from 'vue';
import { Canvas } from 'fabric';

const PAGE_WIDTH = 1753;
const PAGE_HEIGHT = 2480;

export const useFabricCanvas = (canvasEl: Ref<HTMLCanvasElement | null>) => {
	const fabricCanvas = shallowRef<Canvas | null>(null);

	const dispose = () => {
		fabricCanvas.value?.dispose();
		fabricCanvas.value = null;
	};

	const init = () => {
		dispose();

		const el = canvasEl.value;

		if (!el) {
			return;
		}

		fabricCanvas.value = new Canvas(el, {
			width: PAGE_WIDTH,
			height: PAGE_HEIGHT,
			backgroundColor: '#ffffff',
			selection: true,
		});
		
		// Fabric 7 aplica options en el constructor pero no pinta hasta el primer render.
		fabricCanvas.value.requestRenderAll();
	};

	onBeforeUnmount(() => {
		dispose();
	});

	return {
		fabricCanvas,
		init,
		PAGE_WIDTH,
		PAGE_HEIGHT,
	};
};
