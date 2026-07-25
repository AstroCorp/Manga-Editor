import { Polygon } from 'fabric';
import { PANEL_FILL, PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import type { PanelPolygon, PanelShape } from '@/types/fabric';

export const shapeToPolygon = (shape: PanelShape): PanelPolygon => {
	const polygon = new Polygon(
		shape.points.map((point) => {
			return { x: point.x, y: point.y };
		}),
		{
			fill: PANEL_FILL,
			stroke: PANEL_STROKE_COLOR,
			strokeWidth: shape.strokeWidth,
			selectable: true,
			evented: true,
			lockMovementX: true,
			lockMovementY: true,
			lockRotation: true,
			lockScalingX: true,
			lockScalingY: true,
			hasControls: false,
			hoverCursor: 'pointer',
			objectCaching: true,
			perPixelTargetFind: false,
		},
	) as PanelPolygon;

	polygon.set({
		objectType: 'panel',
		panelId: shape.id,
	});

	return polygon;
};
