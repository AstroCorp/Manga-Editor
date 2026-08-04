import type { CanvasFeature } from '@/features/types';
import { useFabricZoom } from '@/features/zoom/useFabricZoom';
import { watchEffect } from 'vue';

export const zoomFeature: CanvasFeature = {
	install(ctx) {
		const api = useFabricZoom({
			fabricCanvas: ctx.fabricCanvas,
			rootEl: ctx.rootEl,
			pageSize: ctx.pageSize,
		});

		watchEffect(() => {
			ctx.zoomFactor.value = api.zoomFactor.value;
			ctx.stageStyle.value = api.stageStyle.value;
			ctx.scaleStyle.value = api.scaleStyle.value;
		});

		ctx.registerCanvasAction({
			resetZoomView: api.resetZoomView,
		});
	},
};
