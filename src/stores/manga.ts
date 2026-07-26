import { computed, ref, triggerRef } from 'vue';
import { defineStore } from 'pinia';
import { Page } from '@/models/Page';
import type { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';
import type { PageLayoutMetrics } from '@/types/geometry';
import type { LayoutJSON } from '@/types/layouts';
import type { PageMargins } from '@/types/page';

export const useMangaStore = defineStore('manga', () => {
	const title = ref('Untitled');
	const firstPage = Page.createBlank(1);
	const pages = ref<Page[]>([firstPage]);
	const activePageId = ref(firstPage.id);

	/**
	 * Sube cuando hay que vaciar el dibujo del canvas
	 * (cambio de tamaño, rejilla o márgenes).
	 */
	const contentResetEpoch = ref(0);

	/** Pinia no detecta mutaciones internas de Page; forzamos reactividad. */
	const touchPages = () => {
		triggerRef(pages);
	};

	const findPage = (pageId: string) => {
		return pages.value.find((page) => {
			return page.id === pageId;
		});
	};

	/**
	 * Siempre hay ≥1 página y activePageId apunta a una válida
	 * (o caemos a la primera).
	 */
	const getActivePage = (): Page => {
		const page = findPage(activePageId.value) ?? pages.value[0];

		if (!page) {
			throw new Error('Manga document must have at least one page');
		}

		return page;
	};

	const activePage = computed((): Page => {
		return getActivePage();
	});

	const layout = computed((): PageLayoutMetrics => {
		const page = getActivePage();

		return {
			width: page.width,
			height: page.height,
			cols: page.gridCols,
			rows: page.gridRows,
			margins: {
				marginTop: page.marginTop,
				marginRight: page.marginRight,
				marginBottom: page.marginBottom,
				marginLeft: page.marginLeft,
			},
		};
	});

	const strokeWidth = computed(() => {
		return getActivePage().strokeWidth;
	});

	const shapes = computed(() => {
		return getActivePage().shapes;
	});

	/** Vacía paneles de la página activa y avisa al canvas. */
	const clearActivePage = () => {
		getActivePage().clearShapes();
		contentResetEpoch.value += 1;
	};

	const addPage = () => {
		const active = getActivePage();
		const page = Page.createBlank(
			pages.value.length + 1,
			active.width,
			active.height,
		);

		pages.value.push(page);
		activePageId.value = page.id;
		touchPages();
	};

	/** Siempre queda al menos una página; si borras la activa, selecciona vecina. */
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

		touchPages();
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
		touchPages();
	};

	const renamePage = (pageId: string, name: string) => {
		const trimmed = name.trim();
		const page = findPage(pageId);

		if (!page || !trimmed || trimmed === page.name) {
			return;
		}

		page.name = trimmed;
		touchPages();
	};

	const getActivePageLayout = (): LayoutJSON => {
		return getActivePage().toLayoutJSON();
	};

	/** Sustituye geometría de la página activa; conserva name/id. */
	const applyActivePageLayout = (layoutJson: LayoutJSON) => {
		getActivePage().applyLayout({
			...layoutJson,
			shapes: layoutJson.shapes ?? [],
		});

		touchPages();
		contentResetEpoch.value += 1;
	};

	const addShape = (shape: Shape) => {
		// Page reasigna shapes[]; la proxy de Pinia actualiza el strip.
		getActivePage().addShape(shape);
	};

	const removeShape = (shapeId: string) => {
		getActivePage().removeShape(shapeId);
	};

	const setShapeStrokeWidth = (shapeId: string, width: number) => {
		getActivePage().setShapeStrokeWidth(shapeId, width);
	};

	const setShapeImage = (shapeId: string, image: ShapeImage | null) => {
		getActivePage().setShapeImage(shapeId, image);
	};

	// Cambiar geometría invalida el dibujo (la rejilla ya no encaja).
	const setActivePageSize = (width: number, height: number) => {
		getActivePage().setSize(width, height);
		clearActivePage();
	};

	const setActivePageGrid = (cols: number, rows: number) => {
		getActivePage().setGrid(cols, rows);
		clearActivePage();
	};

	const setActivePageMargins = (margins: PageMargins) => {
		getActivePage().setMargins(margins);
		clearActivePage();
	};

	const setActivePageStrokeWidth = (width: number) => {
		getActivePage().setStrokeWidth(width);
	};

	return {
		title,
		pages,
		activePageId,
		contentResetEpoch,
		activePage,
		layout,
		strokeWidth,
		shapes,
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
		setShapeStrokeWidth,
		setShapeImage,
		setActivePageSize,
		setActivePageGrid,
		setActivePageMargins,
		setActivePageStrokeWidth,
	};
});
