import { computed, markRaw } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { toStageCoords } from '@/features/toStageCoords';
import ShapeActionMenu from '@/features/shape-menu/components/ShapeActionMenu.vue';
import { useShapeActionMenu } from '@/features/shape-menu/useShapeActionMenu';
import { SIDEBAR_TAB } from '@/lib/editor/editorEnums';
import { useEditorStore } from '@/stores/editor';
import { useElementInspectorStore } from '@/stores/elementInspector';

export const shapeMenuFeature: CanvasFeature = {
	install(ctx) {
		const api = useShapeActionMenu({
			fabricCanvas: ctx.fabricCanvas,
			onChanged: () => ctx.actions.syncInteractionMode(),
		});

		ctx.actions.register({
			clearShapeMenu: api.clearMenu,
		});

		useElementInspectorStore().bindShape({
			elementId: api.elementId,
			hasImage: api.hasImage,
			isGrayscale: api.isGrayscale,
			isFlipX: api.isFlipX,
			isFlipY: api.isFlipY,
			fill: api.fill,
			strokes: api.strokes,
			deleteShape: api.deleteShape,
			clearImage: api.clearImage,
			placeImage: (file) => {
				void api.placeImage(file);
			},
			toggleGrayscale: api.toggleGrayscale,
			toggleFlipX: api.toggleFlipX,
			toggleFlipY: api.toggleFlipY,
			toggleFill: api.toggleFill,
			setFillColor: api.setFillColor,
			previewFillColor: api.previewFillColor,
			setEdgeStroke: api.setEdgeStroke,
			previewEdgeStroke: api.previewEdgeStroke,
			highlightEdge: api.highlightEdge,
		});

		ctx.addOverlay({
			id: 'shape-action-menu',
			component: markRaw(ShapeActionMenu),
			props: computed(() => {
				const stage = toStageCoords(api.position.value, ctx.zoomFactor.value);

				return {
					hasImage: api.hasImage.value,
					isGrayscale: api.isGrayscale.value,
					isFlipX: api.isFlipX.value,
					isFlipY: api.isFlipY.value,
					fill: api.fill.value,
					strokes: api.strokes.value,
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
				toggleFlipX: api.toggleFlipX,
				toggleFlipY: api.toggleFlipY,
				toggleFill: api.toggleFill,
				setFillColor: api.setFillColor as (...args: never[]) => unknown,
				previewFillColor: api.previewFillColor as (
					...args: never[]
				) => unknown,
				setEdgeStroke: api.setEdgeStroke as (...args: never[]) => unknown,
				previewEdgeStroke: api.previewEdgeStroke as (
					...args: never[]
				) => unknown,
				hoverEdge: api.highlightEdge as (...args: never[]) => unknown,
				showOptions: () => {
					useEditorStore().openSidebarTab(SIDEBAR_TAB.Element);
				},
			},
		});
	},
};
