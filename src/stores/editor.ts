import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
	DEFAULT_ZOOM_PERCENT,
	ZOOM_STEP_PERCENT,
	clampZoomPercent,
} from '@/lib/zoom';
import type { CanvasActions } from '@/types/editor';

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
	};
});
