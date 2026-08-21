import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import {
	describeTransform,
	transformHistoryLabel,
} from '@/lib/history/describeTransform';
import {
	captureDocument,
	pagesFromDocument,
} from '@/lib/history/documentSnapshot';
import { HISTORY_LABEL, historyLabelForPage } from '@/lib/history/historyEnums';
import {
	loadPersistedProject,
	persistProject,
} from '@/lib/history/projectStorage';
import { findUniqueName, isDuplicateName } from '@/lib/ui/uniqueName';
import { Page } from '@/models/Page';
import { useHistoryStore } from '@/stores/history';
import type {
	HistoryDocumentJSON,
	ProjectPersistenceInput,
} from '@/types/history';
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
	const isHydrated = ref(false);
	let isRestoringHistory = false;
	let pendingPersistence: ProjectPersistenceInput | null = null;
	let persistencePromise: Promise<void> | null = null;
	let initializationPromise: Promise<void> | null = null;

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

	const captureSnapshot = (): HistoryDocumentJSON => {
		return captureDocument({
			title: title.value,
			activePageId: activePageId.value,
			pages: pages.value,
			intern: (src) => {
				return useHistoryStore().internImage(src);
			},
		});
	};

	const buildPersistedProject = () => {
		const historyStore = useHistoryStore();

		return {
			version: 3 as const,
			document: captureSnapshot(),
			images: historyStore.exportImages(),
			history: historyStore.getStack(),
		};
	};

	const drainPersistence = async () => {
		while (pendingPersistence) {
			const project = pendingPersistence;

			pendingPersistence = null;

			const stored = await persistProject(project);

			// Solo adopta un recorte si no apareció un estado más reciente
			// durante la escritura asíncrona.
			if (stored && stored !== project.history && !pendingPersistence) {
				useHistoryStore().hydrate(stored);
			}
		}
	};

	const persistCurrentProject = () => {
		if (isRestoringHistory) {
			return;
		}

		pendingPersistence = buildPersistedProject();

		if (!persistencePromise) {
			persistencePromise = drainPersistence().finally(() => {
				persistencePromise = null;

				if (pendingPersistence) {
					persistCurrentProject();
				}
			});
		}
	};

	const waitForPersistence = async (): Promise<void> => {
		while (persistencePromise) {
			await persistencePromise;
		}
	};

	const recordHistory = (action: string, pageName?: string | null) => {
		if (isRestoringHistory) {
			return;
		}

		const label =
			pageName === null
				? action
				: historyLabelForPage(action, pageName ?? getActivePage().name);

		useHistoryStore().push(label, captureSnapshot());
		persistCurrentProject();
	};

	const applyHistorySnapshot = (snapshot: HistoryDocumentJSON) => {
		const prevPageId = activePageId.value;

		isRestoringHistory = true;
		title.value = snapshot.title;
		pages.value = pagesFromDocument(snapshot, (assetId) => {
			return useHistoryStore().resolveImage(assetId);
		});
		activePageId.value = snapshot.activePageId;
		isRestoringHistory = false;

		if (activePageId.value === prevPageId) {
			bumpContent();
		}

		persistCurrentProject();
	};

	const undoHistory = () => {
		const snapshot = useHistoryStore().stepBack();

		if (!snapshot) {
			return;
		}

		applyHistorySnapshot(snapshot);
	};

	const redoHistory = () => {
		const snapshot = useHistoryStore().stepForward();

		if (!snapshot) {
			return;
		}

		applyHistorySnapshot(snapshot);
	};

	const jumpToHistory = (entryId: string) => {
		const snapshot = useHistoryStore().jumpTo(entryId);

		if (!snapshot) {
			return;
		}

		applyHistorySnapshot(snapshot);
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
		recordHistory(HISTORY_LABEL.ClearPage);
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
		recordHistory(HISTORY_LABEL.AddPage);
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

		const removedName = pages.value[index]?.name ?? '';

		pages.value.splice(index, 1);

		if (activePageId.value === pageId) {
			const nextIndex = Math.min(index, pages.value.length - 1);
			const nextPage = pages.value[nextIndex];

			if (!nextPage) {
				throw new Error('Manga document must have at least one page');
			}

			activePageId.value = nextPage.id;
		}

		recordHistory(HISTORY_LABEL.DeletePage, removedName);
	};

	const selectPage = (pageId: string) => {
		if (
			!pages.value.some((page) => {
				return page.id === pageId;
			})
		) {
			return;
		}

		if (activePageId.value === pageId) {
			return;
		}

		activePageId.value = pageId;
		persistCurrentProject();
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
		recordHistory(HISTORY_LABEL.ReorderPages, null);
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
		recordHistory(HISTORY_LABEL.RenamePage);

		return true;
	};

	const getActivePageLayout = (): LayoutJSON => {
		return getActivePage().toLayoutJSON();
	};

	const applyActivePageLayout = (layoutJson: LayoutJSON) => {
		getActivePage().applyLayout(layoutJson);
		bumpContent();
		recordHistory(HISTORY_LABEL.ApplyLayout);
	};

	const addShape = (shape: Shape) => {
		getActivePage().addShape(shape);
		recordHistory(HISTORY_LABEL.AddPanel);
	};

	const removeShape = (shapeId: string) => {
		if (!getActivePage().removeShape(shapeId)) {
			return;
		}

		recordHistory(HISTORY_LABEL.DeletePanel);
	};

	const addText = (text: TextBlock) => {
		getActivePage().addText(text);
		recordHistory(HISTORY_LABEL.AddText);
	};

	const removeText = (textId: string) => {
		if (!getActivePage().removeText(textId)) {
			return;
		}

		recordHistory(HISTORY_LABEL.DeleteText);
	};

	const updateText = (textId: string, patch: TextBlockPatch) => {
		getActivePage().updateText(textId, patch);
	};

	const setShapeImage = (shapeId: string, image: ShapeImage | null) => {
		const previous = getActivePage()
			.getActiveLayer()
			.shapes.find((shape) => {
				return shape.id === shapeId;
			})?.image;
		const previousPose = previous
			? {
					left: previous.left,
					top: previous.top,
					angle: previous.angle,
					scaleX: previous.scaleX,
					scaleY: previous.scaleY,
					flipX: previous.flipX,
					flipY: previous.flipY,
					grayscale: previous.grayscale,
				}
			: null;

		if (!getActivePage().setShapeImage(shapeId, image)) {
			return;
		}

		if (!image) {
			recordHistory(HISTORY_LABEL.RemoveImage);

			return;
		}

		if (!previousPose) {
			recordHistory(HISTORY_LABEL.PlaceImage);

			return;
		}

		if (
			previousPose.flipX !== image.flipX ||
			previousPose.flipY !== image.flipY
		) {
			recordHistory(HISTORY_LABEL.FlipImage);

			return;
		}

		if (Boolean(previousPose.grayscale) !== Boolean(image.grayscale)) {
			recordHistory(HISTORY_LABEL.GrayscaleImage);

			return;
		}

		recordHistory(
			transformHistoryLabel(
				describeTransform(previousPose, image),
				'image',
			),
		);
	};

	const setShapeWhiteFill = (shapeId: string, whiteFill: boolean) => {
		if (!getActivePage().setShapeWhiteFill(shapeId, whiteFill)) {
			return;
		}

		recordHistory(
			whiteFill ? HISTORY_LABEL.FillPanel : HISTORY_LABEL.ClearPanelFill,
		);
	};

	const setActivePageSize = (width: number, height: number) => {
		getActivePage().setSize(width, height);
		bumpContent();
		recordHistory(HISTORY_LABEL.ChangePageSize);
	};

	const setActiveLayerGrid = (cols: number, rows: number) => {
		getActivePage().setActiveLayerGrid(cols, rows);
		bumpContent();
		recordHistory(HISTORY_LABEL.ChangeGrid);
	};

	const setActiveLayerMargins = (margins: PageMargins) => {
		getActivePage().setActiveLayerMargins(margins);
		bumpContent();
		recordHistory(HISTORY_LABEL.ChangeMargins);
	};

	const rotateActivePage = (direction: PageRotateDirection) => {
		getActivePage().rotateOrientation(direction);
		bumpContent();
		recordHistory(HISTORY_LABEL.RotatePage);
	};

	const setActiveLayerStrokeWidth = (width: number) => {
		getActivePage().setActiveLayerStrokeWidth(width);
		recordHistory(HISTORY_LABEL.ChangeStroke);
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
		recordHistory(HISTORY_LABEL.AddLayer);
	};

	const removeLayer = (layerId: string) => {
		if (!getActivePage().removeLayer(layerId)) {
			return;
		}

		bumpContent();
		recordHistory(HISTORY_LABEL.DeleteLayer);
	};

	const reorderLayers = (fromIndex: number, toIndex: number) => {
		getActivePage().reorderLayers(fromIndex, toIndex);
		bumpContent();
		recordHistory(HISTORY_LABEL.ReorderLayers);
	};

	const renameLayer = (layerId: string, name: string): boolean => {
		if (!getActivePage().renameLayer(layerId, name)) {
			return false;
		}

		recordHistory(HISTORY_LABEL.RenameLayer);

		return true;
	};

	const setLayerVisible = (layerId: string, visible: boolean) => {
		if (!getActivePage().setLayerVisible(layerId, visible)) {
			return;
		}

		bumpContent();
		recordHistory(
			visible ? HISTORY_LABEL.ShowLayer : HISTORY_LABEL.HideLayer,
		);
	};

	const hydrateFromStorage = async () => {
		const persisted = await loadPersistedProject();

		if (!persisted) {
			useHistoryStore().resetWith(captureSnapshot());
			persistCurrentProject();
			await waitForPersistence();

			return;
		}

		try {
			useHistoryStore().importImages(persisted.images);

			const restoredPages = pagesFromDocument(
				persisted.document,
				(assetId) => {
					return useHistoryStore().resolveImage(assetId);
				},
			);
			const activeExists = restoredPages.some((page) => {
				return page.id === persisted.document.activePageId;
			});

			isRestoringHistory = true;
			title.value = persisted.document.title;
			pages.value = restoredPages;
			activePageId.value = activeExists
				? persisted.document.activePageId
				: restoredPages[0]!.id;
			isRestoringHistory = false;
			useHistoryStore().hydrate(persisted.history);
		} catch {
			useHistoryStore().resetWith(captureSnapshot());
			persistCurrentProject();
			await waitForPersistence();
		}
	};

	const initialize = (): Promise<void> => {
		if (initializationPromise) {
			return initializationPromise;
		}

		initializationPromise = hydrateFromStorage().finally(() => {
			isHydrated.value = true;
		});

		return initializationPromise;
	};

	// Las acciones quedan disponibles desde el primer tick; la hidratación
	// asíncrona sustituirá este baseline antes de montar el editor.
	useHistoryStore().resetWith(captureSnapshot());

	return {
		title,
		pages,
		activePageId,
		isHydrated,
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
		recordHistory,
		undoHistory,
		redoHistory,
		jumpToHistory,
		initialize,
		waitForPersistence,
	};
});
