import { onBeforeUnmount, shallowRef, type Ref } from 'vue';
import { Canvas } from 'fabric';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@/stores/editor';

export const useFabricCanvas = (canvasEl: Ref<HTMLCanvasElement | null>) => {
	const fabricCanvas = shallowRef<Canvas | null>(null);
	const editorStore = useEditorStore();
	const { pageWidth, pageHeight } = storeToRefs(editorStore);

	const dispose = () => {
		fabricCanvas.value?.dispose();
		fabricCanvas.value = null;
	};

	const init = () => {
		dispose();

		const element = canvasEl.value;
		if (!element) {
			return;
		}

		fabricCanvas.value = new Canvas(element, {
			width: pageWidth.value,
			height: pageHeight.value,
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
		pageWidth,
		pageHeight,
	};
};
