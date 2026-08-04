import type { CanvasFeature } from '@/features/types';
import { usePanelGuides } from '@/features/guides/usePanelGuides';

export const guidesFeature: CanvasFeature = {
	install(ctx) {
		const { refreshGuides } = usePanelGuides(ctx.fabricCanvas);

		ctx.onAfterPageApply(refreshGuides);
	},
};
