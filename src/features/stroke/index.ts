import type { CanvasFeature } from '@/features/types';
import { usePanelStroke } from '@/features/stroke/usePanelStroke';

export const strokeFeature: CanvasFeature = {
	install(ctx) {
		const api = usePanelStroke(ctx.fabricCanvas);

		ctx.actions.register({
			cancelStroke: api.cancelStroke,
			syncInteractionMode: api.syncInteractionMode,
			strokePath: api.path,
		});

		ctx.registerCanvasAction({
			cancelStroke: api.cancelStroke,
		});

		ctx.onAfterPageApply(api.syncInteractionMode);
	},
};
