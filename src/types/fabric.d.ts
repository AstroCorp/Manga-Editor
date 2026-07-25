import type { FabricImage, FabricObject, Polygon } from 'fabric';
import type { CanvasPoint } from '@/types/geometry';

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

export type PanelShape = {
	id: string;
	points: CanvasPoint[];
	strokeWidth: number;
};
