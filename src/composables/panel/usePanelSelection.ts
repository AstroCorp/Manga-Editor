import { onBeforeUnmount, watch, type ShallowRef } from 'vue';
import type { Canvas, FabricObject } from 'fabric';
import {
	getPanelId,
	isGuide,
	isPanel,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import { clampStrokeWidth } from '@/lib/page/pageLimits';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

type SelectionDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	syncInteractionMode: () => void;
	cancelStroke: () => void;
};

export const usePanelSelection = ({
	fabricCanvas,
	syncInteractionMode,
	cancelStroke,
}: SelectionDeps) => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();

	/** Borra el panel activo del store y del canvas. */
	const removeActive = (): boolean => {
		const canvas = fabricCanvas.value;

		if (!canvas) {
			return false;
		}

		const active = canvas.getActiveObject() as FabricObject | null;

		if (!active || isGuide(active) || !isPanel(active)) {
			return false;
		}

		const panelId = getPanelId(active);

		if (!panelId) {
			return false;
		}

		mangaStore.removeShape(panelId);

		removeObjectsByPanelId(canvas, panelId);

		canvas.discardActiveObject();

		editorStore.setHasSelection(false);
		editorStore.setSelectedStrokeWidth(null);

		syncInteractionMode();

		canvas.requestRenderAll();

		return true;
	};

	const syncSelectedStrokeWidth = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null;

		if (!active || !isPanel(active)) {
			editorStore.setSelectedStrokeWidth(null);

			return;
		}

		editorStore.setSelectedStrokeWidth(
			clampStrokeWidth(
				Number(active.strokeWidth ?? active.get('strokeWidth')),
			),
		);
	};

	const onSelectionChange = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject();

		editorStore.setHasSelection(Boolean(active && !isGuide(active)));
		syncSelectedStrokeWidth();
	};

	const setSelectionStrokeWidth = (width: number): boolean => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null;

		if (!canvas || !active || !isPanel(active)) {
			return false;
		}

		const panelId = getPanelId(active);

		if (!panelId) {
			return false;
		}

		const nextWidth = clampStrokeWidth(width);

		mangaStore.setShapeStrokeWidth(panelId, nextWidth);
		
		active.set('strokeWidth', nextWidth);

		editorStore.setSelectedStrokeWidth(nextWidth);

		canvas.requestRenderAll();

		return true;
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement
		) {
			return;
		}

		if (event.key === 'Escape') {
			cancelStroke();

			return;
		}

		if (event.key === 'Delete' || event.key === 'Backspace') {
			if (removeActive()) {
				event.preventDefault();
			}
		}
	};

	const bindSelectionEvents = (canvas: Canvas) => {
		canvas.on('selection:created', onSelectionChange);
		canvas.on('selection:updated', onSelectionChange);
		canvas.on('selection:cleared', onSelectionChange);
	};

	const unbindSelectionEvents = (canvas: Canvas) => {
		canvas.off('selection:created', onSelectionChange);
		canvas.off('selection:updated', onSelectionChange);
		canvas.off('selection:cleared', onSelectionChange);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				return;
			}

			bindSelectionEvents(canvas);

			onCleanup(() => {
				unbindSelectionEvents(canvas);
			});
		},
		{ immediate: true },
	);

	if (typeof window !== 'undefined') {
		window.addEventListener('keydown', onKeyDown);
	}

	onBeforeUnmount(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', onKeyDown);
		}

		const canvas = fabricCanvas.value;

		if (canvas) {
			unbindSelectionEvents(canvas);
		}
	});

	return {
		removeActive,
		setSelectionStrokeWidth,
	};
};
