import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	unref,
	watch,
	type CSSProperties,
	type Ref,
} from 'vue';
import { storeToRefs } from 'pinia';
import { createFabricCanvasController } from '@/lib/fabric/createFabricCanvasController';
import { createFeatureContext } from '@/features/createFeatureContext';
import { canvasFeatures } from '@/features/index';
import { useActivePageLayout } from '@/composables/page/useActivePageLayout';
import type { FeatureContext, FeatureOverlay } from '@/features/types';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import { useSelectionStore } from '@/stores/selection';
import {
	applyPageCanvasLayout,
	growPasteboard,
	minPagePasteboard,
	pasteboardForSelection,
	pasteboardScrollDelta,
	pasteboardsEqual,
	type PagePasteboard,
} from '@/lib/fabric/pageCanvasLayout';
import type { ApplyActivePageOptions, CanvasActions } from '@/types/editor';

/**
 * Orquestador del canvas: core Fabric (lib) + features + layout activo.
 * Aquí sí se compone otro composable de lectura (`useActivePageLayout`).
 */
export const useEditorCanvas = (
	canvasEl: Ref<HTMLCanvasElement | null>,
	rootEl: Ref<HTMLElement | null>,
) => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { activePageId } = storeToRefs(mangaStore);
	const { activePage, pageSize, pageBackground } = useActivePageLayout();

	/** Descarta hydrates obsoletos al cambiar de página / reset rápido. */
	let hydrateGeneration = 0;

	const { fabricCanvas, init, hydratePage, exportDataUrl, dispose } =
		createFabricCanvasController(canvasEl);

	const zoomFactor = ref(1);
	const stageStyle = ref<CSSProperties>({ width: '0px', height: '0px' });
	const scaleStyle = ref<CSSProperties>({
		width: '0px',
		height: '0px',
		transform: 'scale(1)',
	});

	const canvasActions: CanvasActions = {
		cancelStroke: () => undefined,
		exportDataUrl,
		resetZoomView: () => undefined,
		syncCanvasOffset: () => undefined,
		addSimpleText: () => undefined,
		addBoxedText: () => undefined,
		addRoundedBoxedText: () => undefined,
		focusLayerElement: () => undefined,
		deleteLayerElement: () => undefined,
	};

	const afterPageApplyHooks: Array<() => void> = [];
	const overlays: FeatureOverlay[] = [];

	let ctx!: FeatureContext;

	const discardSelection = () => {
		fabricCanvas.value?.discardActiveObject();
		ctx.actions.clearShapeMenu();
		ctx.actions.clearTextColorMenu();
		useSelectionStore().clearFocused();
		useSelectionStore().clearPendingFocus();
	};

	/**
	 * Rehidrata el canvas con la página activa. Solo el cambio de página
	 * reposiciona la vista: los repintados de contenido (capas, layouts,
	 * historial…) conservan el scroll del stage.
	 */
	const applyActivePage = async ({
		resetView = false,
	}: ApplyActivePageOptions = {}) => {
		const page = activePage.value;
		const generation = ++hydrateGeneration;

		ctx.actions.cancelStroke();
		discardSelection();
		await hydratePage(page);

		if (generation !== hydrateGeneration) {
			return;
		}

		afterPageApplyHooks.forEach((hook) => {
			hook();
		});

		if (resetView) {
			canvasActions.resetZoomView();

			return;
		}

		canvasActions.syncCanvasOffset();
	};

	ctx = createFeatureContext({
		fabricCanvas,
		rootEl,
		pageSize,
		zoomFactor,
		stageStyle,
		scaleStyle,
		canvasActions,
		afterPageApplyHooks,
		overlays,
		applyActivePage,
		discardSelection,
	});

	// 1. Core listo (init en mount) → 2. Instalar features
	canvasFeatures.forEach((feature) => {
		feature.install(ctx);
	});

	const overlayViews = computed(() => {
		return overlays.map((overlay) => {
			return {
				id: overlay.id,
				component: overlay.component,
				props: unref(overlay.props),
				listeners: overlay.listeners ?? {},
			};
		});
	});

	onMounted(() => {
		if (!canvasEl.value) {
			return;
		}

		const page = activePage.value;

		init(page.width, page.height);
		void applyActivePage({ resetView: true });
		editorStore.registerCanvas(canvasActions);
	});

	onBeforeUnmount(() => {
		dispose();
		editorStore.unregisterCanvas();
	});

	watch(activePageId, (nextId, prevId) => {
		if (nextId === prevId) {
			return;
		}

		void applyActivePage({ resetView: true });
	});

	const controlPasteboard = ref<PagePasteboard>(minPagePasteboard());
	let pendingScroll = { x: 0, y: 0 };
	let layoutQueued = false;

	/**
	 * El viewport y el CSS del canvas tienen que cambiar juntos: si el bitmap
	 * gana margen antes de mover el elemento, el puntero salta en mitad del gesto.
	 */
	const queuePasteboardSync = (mode: 'grow' | 'fit') => {
		const canvas = fabricCanvas.value;
		const page = activePage.value;

		if (!canvas || typeof canvas.getActiveObject !== 'function') {
			return;
		}

		const needed = pasteboardForSelection(
			canvas.getActiveObject(),
			page.width,
			page.height,
		);
		const next =
			mode === 'grow'
				? growPasteboard(controlPasteboard.value, needed)
				: needed;

		if (pasteboardsEqual(controlPasteboard.value, next)) {
			return;
		}

		const delta = pasteboardScrollDelta(
			controlPasteboard.value,
			next,
			zoomFactor.value,
		);

		pendingScroll = {
			x: pendingScroll.x + delta.x,
			y: pendingScroll.y + delta.y,
		};
		controlPasteboard.value = next;

		if (layoutQueued) {
			return;
		}

		layoutQueued = true;
		void nextTick(() => {
			layoutQueued = false;
			const root = rootEl.value;
			const liveCanvas = fabricCanvas.value;
			const scroll = pendingScroll;

			pendingScroll = { x: 0, y: 0 };

			if (root) {
				root.scrollLeft += scroll.x;
				root.scrollTop += scroll.y;
			}

			if (!liveCanvas || typeof liveCanvas.getWidth !== 'function') {
				return;
			}

			applyPageCanvasLayout(
				liveCanvas,
				activePage.value.width,
				activePage.value.height,
				controlPasteboard.value,
			);
			liveCanvas.getObjects().forEach((object) => {
				object.setCoords();
			});
			liveCanvas.calcOffset();
			liveCanvas.renderAll();
		});
	};

	watch(
		() => {
			return fabricCanvas.value;
		},
		(canvas, _previous, onCleanup) => {
		if (!canvas || typeof canvas.on !== 'function') {
			return;
		}

		const onGrow = () => {
			queuePasteboardSync('grow');
		};
		const onFit = () => {
			queuePasteboardSync('fit');
		};

		canvas.on('object:moving', onGrow);
		canvas.on('object:scaling', onGrow);
		canvas.on('object:rotating', onGrow);
		canvas.on('object:resizing', onGrow);
		canvas.on('object:skewing', onGrow);
		canvas.on('object:modified', onFit);
		canvas.on('selection:created', onFit);
		canvas.on('selection:updated', onFit);
		canvas.on('selection:cleared', onFit);
		onCleanup(() => {
			canvas.off('object:moving', onGrow);
			canvas.off('object:scaling', onGrow);
			canvas.off('object:rotating', onGrow);
			canvas.off('object:resizing', onGrow);
			canvas.off('object:skewing', onGrow);
			canvas.off('object:modified', onFit);
			canvas.off('selection:created', onFit);
			canvas.off('selection:updated', onFit);
			canvas.off('selection:cleared', onFit);
		});
	});

	// Cambio de fondo (config, undo/redo): repinta sin rehidratar la página.
	watch(pageBackground, (color) => {
		const canvas = fabricCanvas.value;

		if (!canvas || canvas.backgroundColor === color) {
			return;
		}

		canvas.backgroundColor = color;
		canvas.requestRenderAll();
	});

	const rootStyle = computed(() => {
		const zoom = zoomFactor.value;
		const pad = controlPasteboard.value;
		const top = pad.top * zoom;
		const right = pad.right * zoom;
		const bottom = pad.bottom * zoom;
		const left = pad.left * zoom;
		const padding =
			top === right && right === bottom && bottom === left
				? `${top}px`
				: `${top}px ${right}px ${bottom}px ${left}px`;

		return {
			padding,
		};
	});

	// La lámina bajo el canvas evita un flash blanco antes del primer render.
	const pageBackgroundStyle = computed((): CSSProperties => {
		return {
			backgroundColor: pageBackground.value,
		};
	});

	return {
		stageStyle,
		scaleStyle,
		rootStyle,
		controlPasteboard,
		pageBackgroundStyle,
		overlayViews,
		cancelStroke: () => {
			ctx.actions.cancelStroke();
		},
	};
};
