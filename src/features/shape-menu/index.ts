import { computed, markRaw } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { toStageCoords } from '@/features/toStageCoords';
import ShapeActionMenu from '@/features/shape-menu/components/ShapeActionMenu.vue';
import { useShapeActionMenu } from '@/features/shape-menu/useShapeActionMenu';

export const shapeMenuFeature: CanvasFeature = {
	install(ctx) {
		const api = useShapeActionMenu({
			fabricCanvas: ctx.fabricCanvas,
			onChanged: () => ctx.actions.syncInteractionMode(),
		});

		ctx.actions.register({
			clearShapeMenu: api.clearMenu,
		});

		ctx.addOverlay({
			id: 'shape-action-menu',
			component: markRaw(ShapeActionMenu),
			props: computed(() => {
				const stage = toStageCoords(api.position.value, ctx.zoomFactor.value);

				return {
					hasImage: api.hasImage.value,
					isGrayscale: api.isGrayscale.value,
					whiteFill: api.whiteFill.value,
					left: stage.left,
					top: stage.top,
					placement: api.placement.value,
				};
			}),
			listeners: {
				deleteShape: api.deleteShape,
				clearImage: api.clearImage,
				placeImage: ((file: File) => {
					void api.placeImage(file);
				}) as (...args: never[]) => unknown,
				toggleGrayscale: api.toggleGrayscale,
				toggleWhiteFill: api.toggleWhiteFill,
			},
		});
	},
};
