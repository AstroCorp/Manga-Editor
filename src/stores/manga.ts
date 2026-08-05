import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { findUniqueName, isDuplicateName } from '@/lib/ui/uniqueName';
import { Page } from '@/models/Page';
import type { Layer } from '@/models/Layer';
import type { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';
import type { TextBlock } from '@/models/TextBlock';
import type { PageLayoutMetrics } from '@/types/geometry';
import type { LayoutJSON } from '@/types/layouts';
import type { PageMargins, PageRotateDirection, TextBlockPatch } from '@/types/page';

export const useMangaStore = defineStore('manga', () => {
	const title = ref('Untitled');
	const firstPage = Page.createBlank(1);
	const pages = ref<Page[]>([firstPage]);
	const activePageId = ref(firstPage.id);

	/**
	 * Sube cuando hay que rehidratar el canvas
	 * (tamaño, capa activa, rejilla/márgenes, layouts…).
	 */
	const contentResetEpoch = ref(0);

	const findPage = (pageId: string) => {
		return pages.value.find((page) => {
			return page.id === pageId;
		});
	};

	const getActivePage = (): Page => {
		const page = findPage(activePageId.value) ?? pages.value[0];

		if (!page) {
			throw new Error('Manga document must have at least one page');
		}

		return page;
	};

	const bumpContent = () => {
		contentResetEpoch.value += 1;
	};

	const activePage = computed((): Page => {
		return getActivePage();
	});

	const activeLayer = computed((): Layer => {
		return getActivePage().getActiveLayer();
	});

	const layers = computed((): Layer[] => {
		return getActivePage().layers;
	});

	/** Métricas de dibujo = capa activa + tamaño de página. */
	const layout = computed((): PageLayoutMetrics => {
		const page = getActivePage();
		const layer = page.getActiveLayer();

		return {
			width: page.width,
			height: page.height,
			cols: layer.gridCols,
			rows: layer.gridRows,
			margins: {
				marginTop: layer.marginTop,
				marginRight: layer.marginRight,
				marginBottom: layer.marginBottom,
				marginLeft: layer.marginLeft,
			},
		};
	});

	const strokeWidth = computed(() => {
		return getActivePage().getActiveLayer().strokeWidth;
	});

	const shapes = computed(() => {
		return getActivePage().getActiveLayer().shapes;
	});

	const texts = computed(() => {
		return getActivePage().getActiveLayer().texts;
	});

	/** Vacía la página a la capa default y avisa al canvas. */
	const clearActivePage = () => {
		getActivePage().resetToDefaultLayer();
		bumpContent();
	};

	const addPage = () => {
		const active = getActivePage();
		const page = Page.createBlank(
			pages.value.length + 1,
			active.width,
			active.height,
		);
		const taken = pages.value.map((item) => {
			return item.name;
		});

		page.name = findUniqueName(page.name, taken);
		pages.value.push(page);
		activePageId.value = page.id;
	};

	const removePage = (pageId: string) => {
		if (pages.value.length <= 1) {
			return;
		}

		const index = pages.value.findIndex((page) => {
			return page.id === pageId;
		});

		if (index === -1) {
			return;
		}

		pages.value.splice(index, 1);

		if (activePageId.value === pageId) {
			const nextIndex = Math.min(index, pages.value.length - 1);
			const nextPage = pages.value[nextIndex];

			if (!nextPage) {
				throw new Error('Manga document must have at least one page');
			}

			activePageId.value = nextPage.id;
		}
	};

	const selectPage = (pageId: string) => {
		if (
			!pages.value.some((page) => {
				return page.id === pageId;
			})
		) {
			return;
		}

		activePageId.value = pageId;
	};

	const reorderPages = (fromIndex: number, toIndex: number) => {
		if (
			fromIndex === toIndex ||
			fromIndex < 0 ||
			toIndex < 0 ||
			fromIndex >= pages.value.length ||
			toIndex >= pages.value.length
		) {
			return;
		}

		const [page] = pages.value.splice(fromIndex, 1);

		if (!page) {
			return;
		}

		pages.value.splice(toIndex, 0, page);
	};

	const renamePage = (pageId: string, name: string): boolean => {
		const trimmed = name.trim();
		const page = findPage(pageId);

		if (!page || !trimmed || trimmed === page.name) {
			return false;
		}

		const taken = pages.value.map((item) => {
			return item.name;
		});

		if (isDuplicateName(trimmed, taken, page.name)) {
			return false;
		}

		page.name = trimmed;

		return true;
	};

	const getActivePageLayout = (): LayoutJSON => {
		return getActivePage().toLayoutJSON();
	};

	const applyActivePageLayout = (layoutJson: LayoutJSON) => {
		getActivePage().applyLayout({
			...layoutJson,
			shapes: layoutJson.shapes ?? [],
		});
		bumpContent();
	};

	const addShape = (shape: Shape) => {
		getActivePage().addShape(shape);
	};

	const removeShape = (shapeId: string) => {
		getActivePage().removeShape(shapeId);
	};

	const addText = (text: TextBlock) => {
		getActivePage().addText(text);
	};

	const removeText = (textId: string) => {
		getActivePage().removeText(textId);
	};

	const updateText = (textId: string, patch: TextBlockPatch) => {
		getActivePage().updateText(textId, patch);
	};

	const setShapeImage = (shapeId: string, image: ShapeImage | null) => {
		getActivePage().setShapeImage(shapeId, image);
	};

	const setShapeWhiteFill = (shapeId: string, whiteFill: boolean) => {
		getActivePage().setShapeWhiteFill(shapeId, whiteFill);
	};

	const setActivePageSize = (width: number, height: number) => {
		getActivePage().setSize(width, height);
		bumpContent();
	};

	const setActiveLayerGrid = (cols: number, rows: number) => {
		getActivePage().setActiveLayerGrid(cols, rows);
		bumpContent();
	};

	const setActiveLayerMargins = (margins: PageMargins) => {
		getActivePage().setActiveLayerMargins(margins);
		bumpContent();
	};

	const rotateActivePage = (direction: PageRotateDirection) => {
		getActivePage().rotateOrientation(direction);
		bumpContent();
	};

	const setActiveLayerStrokeWidth = (width: number) => {
		getActivePage().setActiveLayerStrokeWidth(width);
	};

	const selectLayer = (layerId: string) => {
		if (!getActivePage().selectLayer(layerId)) {
			return;
		}

		bumpContent();
	};

	const addLayer = () => {
		getActivePage().addLayer();
		bumpContent();
	};

	const removeLayer = (layerId: string) => {
		if (!getActivePage().removeLayer(layerId)) {
			return;
		}

		bumpContent();
	};

	const reorderLayers = (fromIndex: number, toIndex: number) => {
		getActivePage().reorderLayers(fromIndex, toIndex);
		bumpContent();
	};

	const renameLayer = (layerId: string, name: string): boolean => {
		return getActivePage().renameLayer(layerId, name);
	};

	const setLayerVisible = (layerId: string, visible: boolean) => {
		if (!getActivePage().setLayerVisible(layerId, visible)) {
			return;
		}

		bumpContent();
	};

	return {
		title,
		pages,
		activePageId,
		contentResetEpoch,
		activePage,
		activeLayer,
		layers,
		layout,
		strokeWidth,
		shapes,
		texts,
		addPage,
		removePage,
		selectPage,
		reorderPages,
		renamePage,
		getActivePageLayout,
		applyActivePageLayout,
		clearActivePage,
		addShape,
		removeShape,
		addText,
		removeText,
		updateText,
		setShapeImage,
		setShapeWhiteFill,
		setActivePageSize,
		setActiveLayerGrid,
		setActiveLayerMargins,
		rotateActivePage,
		setActiveLayerStrokeWidth,
		selectLayer,
		addLayer,
		removeLayer,
		reorderLayers,
		renameLayer,
		setLayerVisible,
	};
});
