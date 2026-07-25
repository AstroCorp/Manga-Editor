import type { FabricImage, FabricObject } from 'fabric';

export type GridGuideImage = FabricImage & {
	isGuide?: boolean;
};

export type GuideMarkedObject = FabricObject & {
	isGuide?: boolean;
};
