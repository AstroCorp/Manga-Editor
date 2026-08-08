import {
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_WIDTH,
	TextBlock,
} from '@/models/TextBlock';
import { getVisiblePageCenter } from '@/lib/fabric/visiblePagePoint';
import { textBlockToFabric } from '@/lib/fabric/textFabric';
import { useMangaStore } from '@/stores/manga';
import type { FeatureContext } from '@/features/types';

export const usePageText = (ctx: FeatureContext) => {
	const mangaStore = useMangaStore();

	const addTextAtVisibleCenter = (text: TextBlock) => {
		const canvas = ctx.fabricCanvas.value;
		const root = ctx.rootEl.value;

		if (!canvas || !root) {
			return;
		}

		ctx.actions.cancelStroke();
		ctx.discardSelection();

		mangaStore.addText(text);

		const fabricText = textBlockToFabric(text, {
			layerId: mangaStore.activeLayer.id,
			interactive: true,
		});

		canvas.add(fabricText);
		canvas.setActiveObject(fabricText);
		ctx.actions.syncInteractionMode();
		canvas.requestRenderAll();
	};

	const createCenteredText = (
		factory: (left: number, top: number) => TextBlock,
	) => {
		const root = ctx.rootEl.value;

		if (!root) {
			return;
		}

		const page = mangaStore.activePage;
		const center = getVisiblePageCenter(
			root,
			page.width,
			page.height,
			ctx.zoomFactor.value,
		);

		const left = Math.min(
			Math.max(0, center.x - DEFAULT_TEXT_WIDTH / 2),
			Math.max(0, page.width - DEFAULT_TEXT_WIDTH),
		);
		const top = Math.min(
			Math.max(0, center.y - DEFAULT_TEXT_FONT_SIZE / 2),
			Math.max(0, page.height - DEFAULT_TEXT_FONT_SIZE),
		);

		const text = factory(left, top);
		text.textAlign = 'center';

		if (text.box) {
			text.box.verticalAlign = 'middle';
		}

		addTextAtVisibleCenter(text);
	};

	const addSimpleText = () => {
		createCenteredText(TextBlock.create);
	};

	const addBoxedText = () => {
		createCenteredText(TextBlock.createBoxed);
	};

	const addRoundedBoxedText = () => {
		createCenteredText(TextBlock.createRoundedBoxed);
	};

	return {
		addSimpleText,
		addBoxedText,
		addRoundedBoxedText,
	};
};
