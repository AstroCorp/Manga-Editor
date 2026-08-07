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
import type { CanvasActions } from '@/types/editor';

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
	const { activePage, pageSize } = useActivePageLayout();

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
		addSimpleText: () => undefined,
		addBoxedText: () => undefined,
	};

	const afterPageApplyHooks: Array<() => void> = [];
	const overlays: FeatureOverlay[] = [];

	let ctx!: FeatureContext;

	const discardSelection = () => {
		fabricCanvas.value?.discardActiveObject();
		ctx.actions.clearShapeMenu();
		ctx.actions.clearTextColorMenu();
	};

	const applyActivePage = async () => {
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

		canvasActions.resetZoomView();
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
		void applyActivePage();
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

		void applyActivePage();
	});

	return {
		stageStyle,
		scaleStyle,
		overlayViews,
		cancelStroke: () => {
			ctx.actions.cancelStroke();
		},
	};
};
