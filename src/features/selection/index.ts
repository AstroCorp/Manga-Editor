import type { CanvasFeature } from '@/features/types';
import { usePanelSelection } from '@/features/selection/usePanelSelection';

export const selectionFeature: CanvasFeature = {
	install(ctx) {
		usePanelSelection({
			fabricCanvas: ctx.fabricCanvas,
			syncInteractionMode: () => ctx.actions.syncInteractionMode(),
			cancelStroke: () => ctx.actions.cancelStroke(),
		});
	},
};
