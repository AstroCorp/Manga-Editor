import { storeToRefs } from 'pinia';
import type { CanvasFeature } from '@/features/types';
import { usePageContentReset } from '@/features/content-reset/usePageContentReset';
import { useMangaStore } from '@/stores/manga';

export const contentResetFeature: CanvasFeature = {
	install(ctx) {
		const { contentResetEpoch } = storeToRefs(useMangaStore());

		usePageContentReset({
			contentResetEpoch,
			applyReset: ctx.applyActivePage,
			discardSelection: ctx.discardSelection,
		});
	},
};
