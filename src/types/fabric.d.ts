import type { FabricImage, FabricObject, Polygon, Polyline } from 'fabric';

export type GridGuideImage = FabricImage & {
	isGuide?: boolean;
	isGridGuide?: boolean;
};

export type GuideMarkedObject = FabricObject & {
	isGuide?: boolean;
	isGridGuide?: boolean;
};

export type GuidedPolyline = Polyline & GuideMarkedObject;

export type FabricObjectType = 'panel';

export type PanelPolygon = Polygon & {
	objectType?: FabricObjectType;
	panelId?: string;
};
