import { shallowRef, type CSSProperties, type Ref, type ShallowRef } from 'vue';
import type { Canvas } from 'fabric';
import type { CanvasActions } from '@/types/editor';
import type { GridPoint } from '@/types/geometry';
import type {
	FeatureActions,
	FeatureActionsBus,
	FeatureContext,
	FeatureOverlay,
} from '@/features/types';

type CreateFeatureContextOptions = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	pageSize: Ref<{ width: number; height: number }>;
	zoomFactor: Ref<number>;
	stageStyle: Ref<CSSProperties>;
	scaleStyle: Ref<CSSProperties>;
	canvasActions: CanvasActions;
	afterPageApplyHooks: Array<() => void>;
	overlays: FeatureOverlay[];
	applyActivePage: () => Promise<void>;
	discardSelection: () => void;
};

export const createFeatureContext = (
	options: CreateFeatureContextOptions,
): FeatureContext => {
	const actions: FeatureActionsBus = {
		cancelStroke: () => undefined,
		syncInteractionMode: () => undefined,
		strokePath: shallowRef<GridPoint[]>([]),
		clearShapeMenu: () => undefined,
		clearTextColorMenu: () => undefined,
		register(partial: Partial<FeatureActions>) {
			Object.assign(actions, partial);
		},
	};

	return {
		fabricCanvas: options.fabricCanvas,
		rootEl: options.rootEl,
		pageSize: options.pageSize,
		zoomFactor: options.zoomFactor,
		stageStyle: options.stageStyle,
		scaleStyle: options.scaleStyle,
		actions,
		registerCanvasAction: (partial) => {
			Object.assign(options.canvasActions, partial);
		},
		onAfterPageApply: (hook) => {
			options.afterPageApplyHooks.push(hook);
		},
		addOverlay: (overlay) => {
			options.overlays.push(overlay);
		},
		applyActivePage: options.applyActivePage,
		discardSelection: options.discardSelection,
	};
};
