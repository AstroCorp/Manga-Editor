import { computed, markRaw } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { toStageCoords } from '@/features/toStageCoords';
import TextColorToolbar from '@/features/text-color/components/TextColorToolbar.vue';
import { useTextColorToolbar } from '@/features/text-color/useTextColorToolbar';

export const textColorFeature: CanvasFeature = {
	install(ctx) {
		const api = useTextColorToolbar({
			fabricCanvas: ctx.fabricCanvas,
		});

		ctx.actions.register({
			clearTextColorMenu: api.clearMenu,
		});

		ctx.addOverlay({
			id: 'text-color-toolbar',
			component: markRaw(TextColorToolbar),
			props: computed(() => {
				const stage = toStageCoords(api.position.value, ctx.zoomFactor.value);

				return {
					colors: api.colors.value,
					bold: api.bold.value,
					italic: api.italic.value,
					underline: api.underline.value,
					linethrough: api.linethrough.value,
					fontSize: api.fontSize.value,
					dominantFontSize: api.dominantFontSize.value,
					left: stage.left,
					top: stage.top,
					placement: api.placement.value,
				};
			}),
			listeners: {
				setColor: api.setColor as (...args: never[]) => unknown,
				toggleBold: api.toggleBold,
				toggleItalic: api.toggleItalic,
				toggleUnderline: api.toggleUnderline,
				toggleLinethrough: api.toggleLinethrough,
				setFontSize: api.setFontSize as (...args: never[]) => unknown,
			},
		});
	},
};
