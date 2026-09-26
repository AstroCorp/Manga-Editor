import {
	computed,
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
import { CONTROL_PASTEBOARD } from '@/lib/fabric/fabricSetup';
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
		const padding = CONTROL_PASTEBOARD * zoomFactor.value;

		return {
			padding: `${padding}px`,
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
		pageBackgroundStyle,
		overlayViews,
		cancelStroke: () => {
			ctx.actions.cancelStroke();
		},
	};
};
