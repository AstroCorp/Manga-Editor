import type { Canvas } from 'fabric';
import { Polygon } from 'fabric';
import { PANEL_FILL, PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { stackPageContent } from '@/lib/fabric/isGuide';
import { shapeImageToFabric } from '@/lib/fabric/panelImageFabric';
import type { Page } from '@/models/Page';
import type { Shape } from '@/models/Shape';
import type { PanelPolygon } from '@/types/fabric';

export const shapeToPolygon = (shape: Shape): PanelPolygon => {
	const hasImage = Boolean(shape.image);
	const polygon = new Polygon(
		shape.points.map((point) => {
			return { x: point.x, y: point.y };
		}),
		{
			fill: PANEL_FILL,
			stroke: PANEL_STROKE_COLOR,
			strokeWidth: shape.strokeWidth,
			selectable: !hasImage,
			evented: !hasImage,
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

/** Vacía el canvas y pinta shapes (+ imágenes) desde el dominio. */
export const hydrateCanvasFromPage = async (canvas: Canvas, page: Page): Promise<void> => {
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
		const polygon = shapeToPolygon(shape);

		canvas.add(polygon);

		if (shape.image) {
			const fabricImage = await shapeImageToFabric(
				shape,
				shape.image,
				polygon,
			);

			canvas.add(fabricImage);
		}
	}

	stackPageContent(canvas);
	canvas.requestRenderAll();
};
