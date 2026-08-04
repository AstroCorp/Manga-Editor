import { watch } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { installPanelImageTargetFind } from '@/lib/fabric/panelHitTest';
import { usePanelImageDrop } from '@/features/image-drop/usePanelImageDrop';

export const imageDropFeature: CanvasFeature = {
	install(ctx) {
		watch(
			ctx.fabricCanvas,
			(canvas) => {
				if (canvas) {
					installPanelImageTargetFind(canvas);
				}
			},
			{ immediate: true },
		);

		usePanelImageDrop(ctx.rootEl, ctx.fabricCanvas, () => {
			ctx.actions.syncInteractionMode();
		});
	},
};
