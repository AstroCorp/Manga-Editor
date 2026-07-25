import { storeToRefs } from 'pinia';
import { watch, type ShallowRef } from 'vue';
import type { Canvas } from 'fabric';
import { createGridGuideImage } from '@/lib/fabric/createGridGuide';
import { isGridGuide } from '@/lib/fabric/isGuide';
import { useEditorStore } from '@/stores/editor';

type GuidesDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
};

export const usePanelGuides = ({ fabricCanvas }: GuidesDeps) => {
	const editorStore = useEditorStore();
	const { showGridGuides, layout } = storeToRefs(editorStore);

	const clearGuides = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		// Solo ocultamos la rejilla, no el trazo en curso o el que está en curso.
		canvas
			.getObjects()
			.filter((object) => isGridGuide(object))
			.forEach((object) => {
				canvas.remove(object);
			});
	};

	const refreshGuides = () => {
		const canvas = fabricCanvas.value;
		
		if (!canvas) {
			return;
		}

		clearGuides();

		if (showGridGuides.value) {
			const guide = createGridGuideImage(layout.value);
			
			canvas.add(guide);
			canvas.sendObjectToBack(guide);
		}

		canvas.requestRenderAll();
	};

	// Toggle o cambio de layout → refrescar puntos.
	watch([showGridGuides, layout], () => {
		refreshGuides();
	});

	return {
		clearGuides,
		refreshGuides,
	};
};
