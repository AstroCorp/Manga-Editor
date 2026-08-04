import { computed, markRaw } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { toStageCoords } from '@/features/toStageCoords';
import GridPointLabel from '@/features/grid-hover/components/GridPointLabel.vue';
import { useGridPointHover } from '@/features/grid-hover/useGridPointHover';

export const gridHoverFeature: CanvasFeature = {
	install(ctx) {
		const { lineDelta, labelPosition } = useGridPointHover({
			fabricCanvas: ctx.fabricCanvas,
			strokePath: ctx.actions.strokePath,
		});

		ctx.addOverlay({
			id: 'grid-point-label',
			component: markRaw(GridPointLabel),
			props: computed(() => {
				const stage = toStageCoords(labelPosition.value, ctx.zoomFactor.value);

				return {
					delta: lineDelta.value,
					left: stage.left,
					top: stage.top,
				};
			}),
		});
	},
};
