import { computed, markRaw } from 'vue';
import type { CanvasFeature } from '@/features/types';
import { toStageCoords } from '@/features/toStageCoords';
import TextColorToolbar from '@/features/text-color/components/TextColorToolbar.vue';
import { useTextColorToolbar } from '@/features/text-color/useTextColorToolbar';
import { SIDEBAR_TAB } from '@/lib/editor/editorEnums';
import { collectDocumentFontFamilies } from '@/lib/fonts/documentFonts';
import { useEditorStore } from '@/stores/editor';
import { useElementInspectorStore } from '@/stores/elementInspector';
import { useMangaStore } from '@/stores/manga';

export const textColorFeature: CanvasFeature = {
	install(ctx) {
		const mangaStore = useMangaStore();
		const usedFontFamilies = computed(() => {
			return collectDocumentFontFamilies(mangaStore.pages);
		});
		const api = useTextColorToolbar({
			fabricCanvas: ctx.fabricCanvas,
			rootEl: ctx.rootEl,
			zoomFactor: ctx.zoomFactor,
			onChanged: () => ctx.actions.syncInteractionMode(),
		});

		ctx.actions.register({
			clearTextColorMenu: api.clearMenu,
		});

		useElementInspectorStore().bindText({
			elementId: api.elementId,
			colors: api.colors,
			strokeColors: api.strokeColors,
			bold: api.bold,
			italic: api.italic,
			underline: api.underline,
			linethrough: api.linethrough,
			fontSize: api.fontSize,
			dominantFontSize: api.dominantFontSize,
			fontFamily: api.fontFamily,
			dominantFontFamily: api.dominantFontFamily,
			strokeWidth: api.strokeWidth,
			dominantStrokeWidth: api.dominantStrokeWidth,
			lineHeight: api.lineHeight,
			dominantLineHeight: api.dominantLineHeight,
			textAlign: api.textAlign,
			hasBox: api.hasBox,
			boxFill: api.boxFill,
			boxStroke: api.boxStroke,
			boxStrokeWidth: api.boxStrokeWidth,
			boxCornerRadius: api.boxCornerRadius,
			boxPadding: api.boxPadding,
			boxWidth: api.boxWidth,
			boxHeight: api.boxHeight,
			boxVerticalAlign: api.boxVerticalAlign,
			setColor: api.setColor,
			setStrokeColor: api.setStrokeColor,
			toggleBold: api.toggleBold,
			toggleItalic: api.toggleItalic,
			toggleUnderline: api.toggleUnderline,
			toggleLinethrough: api.toggleLinethrough,
			setFontSize: api.setFontSize,
			setFontFamily: api.setFontFamily,
			setStrokeWidth: api.setStrokeWidth,
			setLineHeight: api.setLineHeight,
			setTextAlign: api.setTextAlign,
			setBoxFill: api.setBoxFill,
			setBoxStroke: api.setBoxStroke,
			setBoxStrokeWidth: api.setBoxStrokeWidth,
			setBoxCornerRadius: api.setBoxCornerRadius,
			setBoxPadding: api.setBoxPadding,
			setBoxWidth: api.setBoxWidth,
			setBoxHeight: api.setBoxHeight,
			setBoxVerticalAlign: api.setBoxVerticalAlign,
			alignToPage: api.alignToPage,
			deleteText: api.deleteText,
		});

		ctx.addOverlay({
			id: 'text-color-toolbar',
			component: markRaw(TextColorToolbar),
			props: computed(() => {
				const stage = toStageCoords(api.position.value, ctx.zoomFactor.value);

				return {
					colors: api.colors.value,
					strokeColors: api.strokeColors.value,
					bold: api.bold.value,
					italic: api.italic.value,
					underline: api.underline.value,
					linethrough: api.linethrough.value,
					fontSize: api.fontSize.value,
					dominantFontSize: api.dominantFontSize.value,
					fontFamily: api.fontFamily.value,
					dominantFontFamily: api.dominantFontFamily.value,
					usedFontFamilies: usedFontFamilies.value,
					strokeWidth: api.strokeWidth.value,
					dominantStrokeWidth: api.dominantStrokeWidth.value,
					lineHeight: api.lineHeight.value,
					dominantLineHeight: api.dominantLineHeight.value,
					textAlign: api.textAlign.value,
					hasBox: api.hasBox.value,
					boxFill: api.boxFill.value,
					boxStroke: api.boxStroke.value,
					boxStrokeWidth: api.boxStrokeWidth.value,
					boxCornerRadius: api.boxCornerRadius.value,
					boxPadding: api.boxPadding.value,
					boxWidth: api.boxWidth.value,
					boxHeight: api.boxHeight.value,
					boxVerticalAlign: api.boxVerticalAlign.value,
					left: stage.left,
					top: stage.top,
					placement: api.placement.value,
				};
			}),
			listeners: {
				setColor: api.setColor as (...args: never[]) => unknown,
				setStrokeColor: api.setStrokeColor as (...args: never[]) => unknown,
				toggleBold: api.toggleBold,
				toggleItalic: api.toggleItalic,
				toggleUnderline: api.toggleUnderline,
				toggleLinethrough: api.toggleLinethrough,
				setFontSize: api.setFontSize as (...args: never[]) => unknown,
				setFontFamily: api.setFontFamily as (...args: never[]) => unknown,
				setStrokeWidth: api.setStrokeWidth as (...args: never[]) => unknown,
				setLineHeight: api.setLineHeight as (...args: never[]) => unknown,
				setTextAlign: api.setTextAlign as (...args: never[]) => unknown,
				setBoxFill: api.setBoxFill as (...args: never[]) => unknown,
				setBoxStroke: api.setBoxStroke as (...args: never[]) => unknown,
				setBoxStrokeWidth: api.setBoxStrokeWidth as (
					...args: never[]
				) => unknown,
				setBoxCornerRadius: api.setBoxCornerRadius as (
					...args: never[]
				) => unknown,
				setBoxPadding: api.setBoxPadding as (...args: never[]) => unknown,
				setBoxWidth: api.setBoxWidth as (...args: never[]) => unknown,
				setBoxHeight: api.setBoxHeight as (...args: never[]) => unknown,
				setBoxVerticalAlign: api.setBoxVerticalAlign as (
					...args: never[]
				) => unknown,
				alignToPage: api.alignToPage as (...args: never[]) => unknown,
				deleteText: api.deleteText,
				showOptions: () => {
					useEditorStore().openSidebarTab(SIDEBAR_TAB.Element);
				},
			},
		});
	},
};
