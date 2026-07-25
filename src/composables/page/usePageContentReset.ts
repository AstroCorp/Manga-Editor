import { watch, type Ref, type ShallowRef } from 'vue';
import type { Canvas } from 'fabric';
import { storeToRefs } from 'pinia';
import { isPanel } from '@/lib/fabric/isGuide';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

type ContentResetDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	contentResetEpoch: Ref<number>;
	cancelStroke: () => void;
	refreshGuides: () => void;
};

export const usePageContentReset = ({
	fabricCanvas,
	contentResetEpoch,
	cancelStroke,
	refreshGuides,
}: ContentResetDeps) => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { pageWidth, pageHeight } = storeToRefs(mangaStore);

	watch(contentResetEpoch, () => {
		cancelStroke();

		const canvas = fabricCanvas.value;

		if (!canvas) {
			return;
		}

		canvas.discardActiveObject();
		editorStore.setHasSelection(false);
		editorStore.setSelectedStrokeWidth(null);

		canvas
			.getObjects()
			.filter((object) => isPanel(object))
			.forEach((object) => {
				canvas.remove(object);
			});

		canvas.setDimensions({
			width: pageWidth.value,
			height: pageHeight.value,
		});

		refreshGuides();

		canvas.requestRenderAll();
	});
};
