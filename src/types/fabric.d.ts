import type { Canvas, FabricImage, FabricObject, Point, Polygon, Polyline, Textbox } from 'fabric';

export type GridGuideImage = FabricImage & {
	isGuide?: boolean;
	isGridGuide?: boolean;
};

export type GuideMarkedObject = FabricObject & {
	isGuide?: boolean;
	isGridGuide?: boolean;
};

export type GuidedPolyline = Polyline & GuideMarkedObject;

export type FabricObjectType = 'panel' | 'panelImage' | 'text';

export type PanelPolygon = Polygon & {
	objectType?: FabricObjectType;
	panelId?: string;
	layerId?: string;
};

export type PanelLikeObject = FabricObject & {
	objectType?: FabricObjectType;
	panelId?: string;
	layerId?: string;
	isGuide?: boolean;
};

export type PageTextObject = Textbox & {
	objectType?: FabricObjectType;
	textId?: string;
	layerId?: string;
};

export type PanelBounds = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PanelCenter = {
	left: number;
	top: number;
};

export type CanvasTargetFind = {
	_checkTarget: (obj: FabricObject, pointer: Point) => boolean;
};

export type PlaceImageInPanelOptions = {
	canvas: Canvas;
	panelId: string;
	file: File;
	/** Si devuelve true, se aborta (hydrate/drop obsoleto). */
	isStale?: () => boolean;
	selectAfterPlace?: boolean;
};
