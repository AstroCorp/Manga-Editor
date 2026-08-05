import { shallowRef, watch } from 'vue';
import { FabricImage, type Canvas, type FabricObject } from 'fabric';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import {
	findPanelById,
	getPanelId,
	isGuide,
	isPanel,
	isPanelImage,
	removeObjectsByPanelId,
} from '@/lib/fabric/isGuide';
import {
	hasGrayscaleFilter,
	setGrayscaleFilter,
} from '@/lib/fabric/panelImageFilters';
import { shapeImageFromFabric } from '@/lib/fabric/panelImageFabric';
import {
	isImageFile,
	placeImageFileInPanel,
} from '@/lib/fabric/panelImagePlace';
import { useMangaStore } from '@/stores/manga';
import type { PageOverlayPosition, ShapeActionMenuDeps } from '@/types/panel';

const MENU_GAP = 8;

export const useShapeActionMenu = ({
	fabricCanvas,
	onChanged,
}: ShapeActionMenuDeps) => {
	const mangaStore = useMangaStore();

	const panelId = shallowRef<string | null>(null);
	const hasImage = shallowRef(false);
	const isGrayscale = shallowRef(false);
	const whiteFill = shallowRef(false);
	const position = shallowRef<PageOverlayPosition | null>(null);

	const clearMenu = () => {
		panelId.value = null;
		hasImage.value = false;
		isGrayscale.value = false;
		whiteFill.value = false;
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

	const findPanelImage = (canvas: Canvas, id: string): FabricImage | null => {
		const match = canvas.getObjects().find((object) => {
			return isPanelImage(object) && getPanelId(object) === id;
		});

		return match instanceof FabricImage ? match : null;
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
		isGrayscale.value = Boolean(shape?.image?.grayscale);
		whiteFill.value = Boolean(shape?.whiteFill);
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

	const toggleGrayscale = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id || !hasImage.value) {
			return;
		}

		const fabricImage = findPanelImage(canvas, id);

		if (!fabricImage) {
			return;
		}

		const next = !hasGrayscaleFilter(fabricImage);

		setGrayscaleFilter(fabricImage, next);
		mangaStore.setShapeImage(id, shapeImageFromFabric(fabricImage));
		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
	};

	const toggleWhiteFill = () => {
		const canvas = fabricCanvas.value;
		const id = panelId.value;

		if (!canvas || !id) {
			return;
		}

		const next = !whiteFill.value;

		mangaStore.setShapeWhiteFill(id, next);

		const panel = findPanelById(canvas, id);

		if (panel) {
			panel.set({ fill: panelFillColor(next) });
		}

		onChanged?.();
		canvas.requestRenderAll();
		refreshMenu();
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
		hasImage,
		isGrayscale,
		whiteFill,
		position,
		deleteShape,
		clearImage,
		placeImage,
		toggleGrayscale,
		toggleWhiteFill,
		clearMenu,
	};
};
