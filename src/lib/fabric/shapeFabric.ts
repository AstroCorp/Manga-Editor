import type { FabricObject, StaticCanvas } from 'fabric';
import { panelFillColor } from '@/lib/fabric/fabricColors';
import { FABRIC_OBJECT_TYPE } from '@/lib/fabric/fabricObjectType';
import { PanelPolygonShape } from '@/lib/fabric/PanelPolygon';
import { stackPageContent } from '@/lib/fabric/isGuide';
import { applyPageCanvasLayout } from '@/lib/fabric/pageCanvasLayout';
import { shapeImageToFabric } from '@/lib/fabric/panelImageFabric';
import { textBlockToFabric } from '@/lib/fabric/textFabric';
import {
	collectFontFamiliesFromText,
	ensureFontFamilyLoaded,
} from '@/lib/fonts/loadGoogleFont';
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
	const polygon = new PanelPolygonShape(
		shape.points.map((point) => {
			return { x: point.x, y: point.y };
		}),
		{
			fill: panelFillColor(shape.fill, { hasImage }),
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

	polygon.setEdgeStrokes(shape.strokes);
	polygon.set({
		objectType: FABRIC_OBJECT_TYPE.Panel,
		panelId: shape.id,
		layerId: options.layerId,
	});

	return polygon;
};

/** Objetos de la página fuera del canvas; las imágenes se cargan en paralelo. */
const buildPageObjects = async (page: Page): Promise<FabricObject[]> => {
	const activeLayerId = page.activeLayerId;
	const layers = page.layers
		.filter((layer) => {
			return layer.visible;
		})
		.map((layer) => {
			const interactive = layer.id === activeLayerId;

			return {
				shapes: layer.shapes.map((shape) => {
					const polygon = shapeToPolygon(shape, {
						layerId: layer.id,
						interactive,
					});

					return {
						polygon,
						image: shape.image
							? shapeImageToFabric(shape, shape.image, polygon, {
									interactive,
								})
							: null,
					};
				}),
				texts: layer.texts.map((text) => {
					return textBlockToFabric(text, {
						layerId: layer.id,
						interactive,
					});
				}),
			};
		});

	const objects: FabricObject[] = [];

	for (const layer of layers) {
		for (const { polygon, image } of layer.shapes) {
			objects.push(polygon);

			if (image) {
				objects.push(await image);
			}
		}

		objects.push(...layer.texts);
	}

	return objects;
};

export const hydrateCanvasFromPage = async (
	canvas: StaticCanvas,
	page: Page,
): Promise<void> => {
	const fontFamilies = [
		...new Set(
			page.layers.flatMap((layer) => {
				return layer.texts.flatMap((text) => {
					return collectFontFamiliesFromText(text);
				});
			}),
		),
	];

	await Promise.all(
		fontFamilies.map((family) => {
			return ensureFontFamilyLoaded(family);
		}),
	);

	const objects = await buildPageObjects(page);

	// Swap síncrono: el contenido anterior sigue a la vista mientras cargan
	// fuentes e imágenes, así no se ve la página en blanco entre medias.
	applyPageCanvasLayout(canvas, page.width, page.height);
	canvas.backgroundColor = page.backgroundColor;
	canvas
		.getObjects()
		.slice()
		.forEach((object) => {
			canvas.remove(object);
		});
	objects.forEach((object) => {
		canvas.add(object);
	});
	stackPageContent(canvas, page.visibleLayerIds());
	canvas.requestRenderAll();
};
