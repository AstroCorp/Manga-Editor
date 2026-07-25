import { computed, ref, triggerRef } from 'vue';
import { defineStore } from 'pinia';
import { Page } from '@/models/Page';
import type { Shape } from '@/models/Shape';
import type { PageLayoutMetrics } from '@/types/geometry';
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

	const getActivePage = () => {
		return findPage(activePageId.value);
	};

	const activePage = computed(() => {
		return getActivePage() ?? null;
	});

	const layout = computed((): PageLayoutMetrics => {
		const page = getActivePage() ?? firstPage;

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

	const pageWidth = computed(() => {
		return (getActivePage() ?? firstPage).width;
	});

	const pageHeight = computed(() => {
		return (getActivePage() ?? firstPage).height;
	});

	const strokeWidth = computed(() => {
		return (getActivePage() ?? firstPage).strokeWidth;
	});

	const shapes = computed(() => {
		return getActivePage()?.shapes ?? [];
	});

	/** Vacía paneles de la página activa y avisa al canvas. */
	const clearActivePage = () => {
		const page = getActivePage();

		if (!page) {
			return;
		}

		page.clearShapes();

		contentResetEpoch.value += 1;

		touchPages();
	};

	const addShape = (shape: Shape) => {
		const page = getActivePage();

		if (!page) {
			return;
		}

		page.addShape(shape);
		touchPages();
	};

	const removeShape = (shapeId: string) => {
		const page = getActivePage();

		if (!page?.removeShape(shapeId)) {
			return;
		}

		touchPages();
	};

	const setShapeStrokeWidth = (shapeId: string, width: number) => {
		const page = getActivePage();
		const shape = page?.findShape(shapeId);

		if (!shape) {
			return;
		}

		shape.strokeWidth = width;
		
		touchPages();
	};

	// Cambiar geometría invalida el dibujo (la rejilla ya no encaja).
	const setActivePageSize = (width: number, height: number) => {
		const page = getActivePage();

		if (!page) {
			return;
		}

		page.setSize(width, height);

		clearActivePage();
	};

	const setActivePageGrid = (cols: number, rows: number) => {
		const page = getActivePage();

		if (!page) {
			return;
		}

		page.setGrid(cols, rows);
		
		clearActivePage();
	};

	const setActivePageMargins = (margins: PageMargins) => {
		const page = getActivePage();

		if (!page) {
			return;
		}

		page.setMargins(margins);
		clearActivePage();
	};

	const setActivePageStrokeWidth = (width: number) => {
		const page = getActivePage();

		if (!page) {
			return;
		}

		page.setStrokeWidth(width);
		touchPages();
	};

	return {
		title,
		pages,
		activePageId,
		contentResetEpoch,
		activePage,
		layout,
		pageWidth,
		pageHeight,
		strokeWidth,
		shapes,
		clearActivePage,
		addShape,
		removeShape,
		setShapeStrokeWidth,
		setActivePageSize,
		setActivePageGrid,
		setActivePageMargins,
		setActivePageStrokeWidth,
		touchPages,
	};
});
