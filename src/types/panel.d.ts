import type { Canvas } from 'fabric';
import type { ShallowRef } from 'vue';

export type GuidesDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
};

export type SelectionDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
	syncInteractionMode: () => void;
	cancelStroke: () => void;
};

export type StrokeDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
};
