import type { FabricImage, FabricObject, Polygon } from 'fabric';

export type GridGuideImage = FabricImage & {
	isGuide?: boolean;
	isGridGuide?: boolean;
};

export type GuideMarkedObject = FabricObject & {
	isGuide?: boolean;
	isGridGuide?: boolean;
};

export type PanelPolygon = Polygon & {
	objectType?: 'panel';
	panelId?: string;
};
