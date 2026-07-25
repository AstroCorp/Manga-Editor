import type { Canvas, Polyline } from 'fabric';
import type { ShallowRef } from 'vue';
import type { GuideMarkedObject } from '@/types/fabric';

export type GuidedPolyline = Polyline & GuideMarkedObject;

export type StrokeDeps = {
	fabricCanvas: ShallowRef<Canvas | null>;
};
