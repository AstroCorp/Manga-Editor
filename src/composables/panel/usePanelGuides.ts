import { storeToRefs } from 'pinia';
import { watch } from 'vue';
import { createGridGuideImage } from '@/lib/fabric/createGridGuide';
import { isGridGuide } from '@/lib/fabric/isGuide';
import { useMangaStore } from '@/stores/manga';
import { useEditorStore } from '@/stores/editor';
import type { GuidesDeps } from '@/types/panel';

export const usePanelGuides = ({ fabricCanvas }: GuidesDeps) => {
	const editorStore = useEditorStore();
	const mangaStore = useMangaStore();
	const { showGridGuides } = storeToRefs(editorStore);
	const { layout } = storeToRefs(mangaStore);

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
			const guide = createGridGuideImage(layout.value);

			canvas.add(guide);
			canvas.sendObjectToBack(guide);
		}

		canvas.requestRenderAll();
	};

	// Toggle de guías. Cambio de geometría: applyActivePage → refreshGuides.
	watch(showGridGuides, () => {
		refreshGuides();
	});

	return {
		refreshGuides,
	};
};
