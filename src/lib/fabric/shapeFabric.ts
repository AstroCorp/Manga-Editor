import type { Canvas } from 'fabric';
import { Polygon } from 'fabric';
import { PANEL_FILL, PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import type { Page } from '@/models/Page';
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
		objectType: FABRIC_OBJECT_TYPE.Panel,
		panelId: shape.id,
	});

	return polygon;
};

/** Vacía el canvas y pinta shapes desde el dominio (sin guías; refreshGuides las repone). */
export const hydrateCanvasFromPage = (canvas: Canvas, page: Page): void => {
	canvas.setDimensions({ width: page.width, height: page.height });

	// Incluye draft/rubber (línea azul discontinua): no deben sobrevivir un cambio de página.
	canvas
		.getObjects()
		.slice()
		.forEach((object) => {
			canvas.remove(object);
		});

	canvas.backgroundColor = '#ffffff';

	for (const shape of page.shapes) {
		canvas.add(shapeToPolygon(shape));
	}

	canvas.requestRenderAll();
};
