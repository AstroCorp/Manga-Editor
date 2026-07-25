import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { CanvasActions } from '@/types/editor';

export const useEditorStore = defineStore('editor', () => {
	const hasSelection = ref(false);
	const selectedStrokeWidth = ref<number | null>(null);
	const showGridGuides = ref(true);

	/** Stubs seguros hasta que EditorCanvas registre las acciones reales. */
	const createCanvasActionStubs = (): CanvasActions => {
		return {
			cancelStroke: () => undefined,
			removeActive: () => false,
			setSelectionStrokeWidth: () => false,
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

	return {
		hasSelection,
		selectedStrokeWidth,
		showGridGuides,
		setHasSelection,
		setSelectedStrokeWidth,
		toggleGridGuides,
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
