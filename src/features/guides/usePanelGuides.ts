import { storeToRefs } from 'pinia';
import { computed, watch, type ShallowRef } from 'vue';
import type { Canvas } from 'fabric';
import { createGridGuideImage } from '@/lib/fabric/createGridGuide';
import { gridGuideDotColor } from '@/lib/fabric/fabricColors';
import { isGridGuide } from '@/lib/fabric/isGuide';
import { useMangaStore } from '@/stores/manga';
import { useEditorStore } from '@/stores/editor';

export const usePanelGuides = (fabricCanvas: ShallowRef<Canvas | null>) => {
	const editorStore = useEditorStore();
	const mangaStore = useMangaStore();
	const { showGridGuides } = storeToRefs(editorStore);
	const { layout, activePage } = storeToRefs(mangaStore);
	const dotColor = computed(() => {
		return gridGuideDotColor(activePage.value.backgroundColor);
	});

	const clearGuides = () => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		// Solo ocultamos los puntos de la rejilla, las líneas en curso, trazo previo y formas se quedan.
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
			const guide = createGridGuideImage(layout.value, dotColor.value);

			canvas.add(guide);
			canvas.sendObjectToBack(guide);
		}

		canvas.requestRenderAll();
	};

	// Toggle de guías y fondo de página. Cambio de geometría: applyActivePage → refreshGuides.
	watch([showGridGuides, dotColor], () => {
		refreshGuides();
	});

	return {
		refreshGuides,
	};
};
