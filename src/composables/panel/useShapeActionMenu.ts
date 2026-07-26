import { computed, shallowRef, watch } from 'vue';
import type { Canvas, FabricObject } from 'fabric';
import {
	findPanelById,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import {
	isImageFile,
	placeImageFileInPanel,
} from '@/lib/fabric/panelImagePlace';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { PageOverlayPosition, ShapeActionMenuDeps } from '@/types/panel';

const MENU_GAP = 8;

export const useShapeActionMenu = ({
	fabricCanvas,
	onChanged,
}: ShapeActionMenuDeps) => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();

	const panelId = shallowRef<string | null>(null);
	const hasImage = shallowRef(false);
	const position = shallowRef<PageOverlayPosition | null>(null);

	const visible = computed(() => {
		return Boolean(panelId.value && position.value);
	});

	const clearMenu = () => {
		panelId.value = null;
		hasImage.value = false;
		position.value = null;
	};

	const resolvePanelId = (active: FabricObject | null): string | null => {
		if (!active || isGuide(active)) {
			return null;
		}

		if (isPanel(active) || isPanelImage(active)) {
			return getPanelId(active) ?? null;
		}

		return null;
	};

	const refreshMenu = () => {
		const canvas = fabricCanvas.value;
		const active = canvas?.getActiveObject() as FabricObject | null;
		const nextPanelId = resolvePanelId(active ?? null);

		if (!canvas || !active || !nextPanelId) {
			clearMenu();

			return;
		}

		const bounds = active.getBoundingRect();
		const shape = mangaStore.shapes.find((item) => {
			return item.id === nextPanelId;
		});

		panelId.value = nextPanelId;
		hasImage.value = Boolean(shape?.image);
		position.value = {
			left: bounds.left + bounds.width / 2,
			top: Math.max(0, bounds.top - MENU_GAP),
		};
	};

	const deleteShape = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id) {
			return;
		}

		mangaStore.removeShape(id);
		removeObjectsByPanelId(canvas, id);
		canvas.discardActiveObject();
		editorStore.setSelectedStrokeWidth(null);
		clearMenu();
		onChanged?.();
		canvas.requestRenderAll();
	};

	const clearImage = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !hasImage.value) {
			return;
		}

		mangaStore.setShapeImage(id, null);

		canvas
			.getObjects()
			.filter((object) => {
				return isPanelImage(object) && getPanelId(object) === id;
			})
			.forEach((object) => {
				canvas.remove(object);
			});

		const panel = findPanelById(canvas, id);

		if (panel) {
			panel.evented = true;
			panel.selectable = true;
			canvas.setActiveObject(panel);
		} else {
			canvas.discardActiveObject();
			editorStore.setSelectedStrokeWidth(null);
			clearMenu();
		}

		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
	};

	const placeImage = async (file: File): Promise<boolean> => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !isImageFile(file)) {
			return false;
		}

		const placed = await placeImageFileInPanel({
			canvas,
			panelId: id,
			file,
		});

		if (!placed) {
			return false;
		}

		onChanged?.();
		refreshMenu();

		return true;
	};

	const bindCanvasEvents = (canvas: Canvas) => {
		canvas.on('selection:created', refreshMenu);
		canvas.on('selection:updated', refreshMenu);
		canvas.on('selection:cleared', clearMenu);
		canvas.on('object:modified', refreshMenu);
		canvas.on('object:moving', refreshMenu);
		canvas.on('object:scaling', refreshMenu);
	};

	const unbindCanvasEvents = (canvas: Canvas) => {
		canvas.off('selection:created', refreshMenu);
		canvas.off('selection:updated', refreshMenu);
		canvas.off('selection:cleared', clearMenu);
		canvas.off('object:modified', refreshMenu);
		canvas.off('object:moving', refreshMenu);
		canvas.off('object:scaling', refreshMenu);
	};

	watch(
		fabricCanvas,
		(canvas, _previous, onCleanup) => {
			if (!canvas) {
				clearMenu();

				return;
			}

			bindCanvasEvents(canvas);

			onCleanup(() => {
				unbindCanvasEvents(canvas);
				clearMenu();
			});
		},
		{ immediate: true },
	);

	return {
		visible,
		hasImage,
		position,
		deleteShape,
		clearImage,
		placeImage,
		clearMenu,
	};
};
