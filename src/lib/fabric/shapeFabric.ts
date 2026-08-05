import type { Canvas } from 'fabric';
import { Polygon } from 'fabric';
import {
	PANEL_STROKE_COLOR,
	panelFillColor,
} from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { stackPageContent } from '@/lib/fabric/isGuide';
import { shapeImageToFabric } from '@/lib/fabric/panelImageFabric';
import type { Page } from '@/models/Page';
import type { Shape } from '@/models/Shape';
import type { PanelPolygon } from '@/types/fabric';

type ShapeToPolygonOptions = {
	layerId: string;
	interactive: boolean;
};

export const shapeToPolygon = (
	shape: Shape,
	options: ShapeToPolygonOptions = {
		layerId: 'layer',
		interactive: true,
	},
): PanelPolygon => {
	const hasImage = Boolean(shape.image);
	const interactive = options.interactive && !hasImage;
	const polygon = new Polygon(
		shape.points.map((point) => {
			return { x: point.x, y: point.y };
		}),
		{
			fill: panelFillColor(shape.whiteFill),
			stroke: PANEL_STROKE_COLOR,
			strokeWidth: shape.strokeWidth,
			selectable: interactive,
			evented: interactive,
			lockMovementX: true,
			lockMovementY: true,
			lockRotation: true,
			lockScalingX: true,
			lockScalingY: true,
			hasControls: false,
			hoverCursor: interactive ? 'pointer' : 'default',
			objectCaching: true,
			perPixelTargetFind: true,
		},
	) as PanelPolygon;

	polygon.set({
		objectType: FABRIC_OBJECT_TYPE.Panel,
		panelId: shape.id,
		layerId: options.layerId,
	});

	return polygon;
};

export const hydrateCanvasFromPage = async (
	canvas: Canvas,
	page: Page,
): Promise<void> => {
	canvas.setDimensions({ width: page.width, height: page.height });

	canvas
		.getObjects()
		.slice()
		.forEach((object) => {
			canvas.remove(object);
		});

	canvas.backgroundColor = '#ffffff';

	const activeLayerId = page.activeLayerId;

	for (const layer of page.layers) {
		if (!layer.visible) {
			continue;
		}

		const interactive = layer.id === activeLayerId;

		for (const shape of layer.shapes) {
			const polygon = shapeToPolygon(shape, {
				layerId: layer.id,
				interactive,
			});

			canvas.add(polygon);

			if (shape.image) {
				const fabricImage = await shapeImageToFabric(
					shape,
					shape.image,
					polygon,
					{ interactive },
				);

				canvas.add(fabricImage);
			}
		}
	}

	stackPageContent(canvas, page.visibleLayerIds());
	canvas.requestRenderAll();
};
