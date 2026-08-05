import type { Canvas } from 'fabric';
import type {
	Component,
	ComputedRef,
	CSSProperties,
	Ref,
	ShallowRef,
} from 'vue';
import type { CanvasActions } from '@/types/editor';
import type { GridPoint } from '@/types/geometry';

export type FeatureActions = {
	cancelStroke: () => void;
	syncInteractionMode: () => void;
	strokePath: ShallowRef<GridPoint[]>;
	clearShapeMenu: () => void;
	clearTextColorMenu: () => void;
};

export type FeatureActionsBus = FeatureActions & {
	register: (partial: Partial<FeatureActions>) => void;
};

export type FeatureOverlay = {
	id: string;
	component: Component;
	props: ComputedRef<Record<string, unknown>>;
	listeners?: Record<string, (...args: never[]) => unknown>;
};

export type FeatureContext = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	pageSize: Ref<{ width: number; height: number }>;
	zoomFactor: Ref<number>;
	stageStyle: Ref<CSSProperties>;
	scaleStyle: Ref<CSSProperties>;
	actions: FeatureActionsBus;
	registerCanvasAction: (partial: Partial<CanvasActions>) => void;
	onAfterPageApply: (hook: () => void) => void;
	addOverlay: (overlay: FeatureOverlay) => void;
	applyActivePage: () => Promise<void>;
	discardSelection: () => void;
};

export type CanvasFeature = {
	install: (ctx: FeatureContext) => void;
};
