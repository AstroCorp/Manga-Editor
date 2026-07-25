import type { Canvas } from 'fabric';
import type { Ref, ShallowRef } from 'vue';

export type FabricZoomDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	rootEl: Ref<HTMLElement | null>;
	pageSize: Ref<{ width: number; height: number }>;
};

export type ScrollAnchor = {
	contentX: number;
	contentY: number;
	viewX: number;
	viewY: number;
};
