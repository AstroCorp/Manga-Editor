import { computed, markRaw } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { toStageCoords } from '@/features/toStageCoords';
import RotationAngleLabel from '@/features/rotation-label/components/RotationAngleLabel.vue';
import { useRotationAngleLabel } from '@/features/rotation-label/useRotationAngleLabel';

export const rotationLabelFeature: CanvasFeature = {
	install(ctx) {
		const { angle, position } = useRotationAngleLabel({
			fabricCanvas: ctx.fabricCanvas,
		});

		ctx.addOverlay({
			id: 'rotation-angle-label',
			component: markRaw(RotationAngleLabel),
			props: computed(() => {
				const stage = toStageCoords(position.value, ctx.zoomFactor.value);

				return {
					angle: angle.value,
					left: stage.left,
					top: stage.top,
				};
			}),
		});
	},
};
