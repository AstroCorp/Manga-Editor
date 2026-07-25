/**
 * Panel de dominio → Polygon Fabric (bloqueado en posición).
 */
import { Polygon } from 'fabric';
import { PANEL_FILL, PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import type { Shape } from '@/models/Shape';
import type { PanelPolygon } from '@/types/fabric';

export const shapeToPolygon = (shape: Shape): PanelPolygon => {
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
			// Hit-test por forma real, no por bounding box (permite dibujar en huecos cóncavos).
			perPixelTargetFind: true,
		},
	) as PanelPolygon;

	polygon.set({
		objectType: 'panel',
		panelId: shape.id,
	});

	return polygon;
};
