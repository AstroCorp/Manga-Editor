import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
	downloadDataUrl,
	downloadText,
	exportFileBaseName,
} from '@/lib/download';
import { isLayoutJSON } from '@/lib/page/presetLayouts';
import {
	DEFAULT_ZOOM_PERCENT,
	ZOOM_STEP_PERCENT,
	clampZoomPercent,
} from '@/lib/zoom';
import { useLayoutsStore } from '@/stores/layouts';
import { useMangaStore } from '@/stores/manga';
import type { CanvasActions, ExportImageFormat } from '@/types/editor';
import type { LayoutJSON } from '@/types/page';

export const useEditorStore = defineStore('editor', () => {
	const hasSelection = ref(false);
	const selectedStrokeWidth = ref<number | null>(null);
	const showGridGuides = ref(true);
	const zoomPercent = ref(DEFAULT_ZOOM_PERCENT);

	/** Stubs seguros hasta que EditorCanvas registre las acciones reales. */
	const createCanvasActionStubs = (): CanvasActions => {
		return {
			cancelStroke: () => undefined,
			removeActive: () => false,
			setSelectionStrokeWidth: () => false,
			exportDataUrl: () => null,
			resetZoomView: () => undefined,
		};
	};

	const canvasActions: CanvasActions = createCanvasActionStubs();

	const registerCanvas = (actions: CanvasActions) => {
		Object.assign(canvasActions, actions);
	};

	/** Suelta closures del canvas desmontado (tests, HMR, remount). */
	const unregisterCanvas = () => {
		Object.assign(canvasActions, createCanvasActionStubs());
		hasSelection.value = false;
		selectedStrokeWidth.value = null;
	};

	const setHasSelection = (value: boolean) => {
		hasSelection.value = value;
	};

	const setSelectedStrokeWidth = (value: number | null) => {
		selectedStrokeWidth.value = value;
	};

	const toggleGridGuides = () => {
		showGridGuides.value = !showGridGuides.value;
	};

	const setZoomPercent = (value: number) => {
		zoomPercent.value = clampZoomPercent(value);
	};

	const zoomIn = () => {
		setZoomPercent(zoomPercent.value + ZOOM_STEP_PERCENT);
	};

	const zoomOut = () => {
		setZoomPercent(zoomPercent.value - ZOOM_STEP_PERCENT);
	};

	const resetZoom = () => {
		setZoomPercent(DEFAULT_ZOOM_PERCENT);
		canvasActions.resetZoomView();
	};

	const exportPage = (format: ExportImageFormat) => {
		const dataUrl = canvasActions.exportDataUrl(format);

		if (!dataUrl) {
			return;
		}

		const mangaStore = useMangaStore();
		const baseName = exportFileBaseName(
			mangaStore.title,
			mangaStore.activePage.name,
		);
		const extension = format === 'jpeg' ? 'jpg' : 'png';

		downloadDataUrl(dataUrl, `${baseName}.${extension}`);
	};

	const exportPageJson = () => {
		const mangaStore = useMangaStore();
		const layout = mangaStore.getActivePageLayout();
		const baseName = exportFileBaseName(
			mangaStore.title,
			mangaStore.activePage.name,
		);

		downloadText(JSON.stringify(layout, null, 2), `${baseName}.json`);
	};

	const importPageJson = async (file: File) => {
		try {
			const text = await file.text();
			const parsed: unknown = JSON.parse(text);

			if (!isLayoutJSON(parsed)) {
				window.alert('The JSON file is not a valid page layout.');

				return;
			}

			const layout: LayoutJSON = {
				...parsed,
				shapes: parsed.shapes ?? [],
			};

			useLayoutsStore().addCustomLayout(layout);
			useMangaStore().applyActivePageLayout(layout);
		} catch {
			window.alert('Could not read the JSON file.');
		}
	};

	/** Aplica un layout de catálogo (conserva el nombre de la página). */
	const applyPageLayout = (layout: LayoutJSON) => {
		useMangaStore().applyActivePageLayout(layout);
	};

	return {
		hasSelection,
		selectedStrokeWidth,
		showGridGuides,
		zoomPercent,
		setHasSelection,
		setSelectedStrokeWidth,
		toggleGridGuides,
		setZoomPercent,
		zoomIn,
		zoomOut,
		resetZoom,
		registerCanvas,
		unregisterCanvas,
		cancelStroke: () => {
			return canvasActions.cancelStroke();
		},
		removeActive: () => {
			return canvasActions.removeActive();
		},
		setSelectionStrokeWidth: (width: number) => {
			return canvasActions.setSelectionStrokeWidth(width);
		},
		exportPage,
		exportPageJson,
		importPageJson,
		applyPageLayout,
	};
});
