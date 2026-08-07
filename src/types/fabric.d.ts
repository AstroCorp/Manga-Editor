import type { Canvas, FabricImage, FabricObject, Point, Polygon, Polyline, Textbox } from 'fabric';
import type { ShallowRef } from 'vue';
import type { Page } from '@/models/Page';
import type { ExportImageFormat } from '@/types/editor';

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
	isStale?: () => boolean;
	selectAfterPlace?: boolean;
};

export type NudgeDelta = {
	dx: number;
	dy: number;
};

export type FabricCanvasController = {
	fabricCanvas: ShallowRef<Canvas | null>;
	init: (width: number, height: number) => void;
	hydratePage: (page: Page) => Promise<void>;
	exportDataUrl: (format: ExportImageFormat) => string | null;
	dispose: () => void;
};
