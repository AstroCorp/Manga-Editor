import { describe, expect, it, vi } from 'vitest';
import { hydrateCanvasFromPage, shapeToPolygon } from '@/lib/fabric/shapeFabric';
import { shapeImageToFabric } from '@/lib/fabric/panelImageFabric';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import type { FabricImage, FabricObject, StaticCanvas } from 'fabric';

vi.mock('@/lib/fabric/panelImageFabric', () => {
	return {
		shapeImageToFabric: vi.fn(),
	};
});

const createCanvas = () => {
	const objects: FabricObject[] = [];

	return {
		objects,
		getObjects: () => {
			return objects;
		},
		add: (...items: FabricObject[]) => {
			objects.push(...items);
		},
		remove: (...items: FabricObject[]) => {
			items.forEach((item) => {
				const index = objects.indexOf(item);

				if (index >= 0) {
					objects.splice(index, 1);
				}
			});
		},
		moveObjectTo: (object: FabricObject, index: number) => {
			objects.splice(objects.indexOf(object), 1);
			objects.splice(index, 0, object);
		},
		getWidth: () => {
			return 0;
		},
		getHeight: () => {
			return 0;
		},
		setDimensions: vi.fn(),
		setViewportTransform: vi.fn(),
		requestRenderAll: vi.fn(),
	} as unknown as StaticCanvas & { objects: FabricObject[] };
};

const pageWithImagePanel = () => {
	const page = Page.createBlank(1, 400, 600);
	const shape = Shape.create(
		[
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 100, y: 100 },
			{ x: 0, y: 100 },
		],
		3,
	);

	shape.setImage(
		new ShapeImage({
			src: 'data:image/webp;base64,xx',
			left: 0,
			top: 0,
			scaleX: 1,
			scaleY: 1,
			originX: 'left',
			originY: 'top',
			width: 100,
			height: 100,
			angle: 0,
		}),
	);
	page.addShape(shape);

	return page;
};

describe('hydrateCanvasFromPage', () => {
	it('keeps the previous content on screen until the new objects are ready', async () => {
		const canvas = createCanvas();
		const stale = shapeToPolygon(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				3,
			),
			{ layerId: 'stale', interactive: true },
		);

		canvas.add(stale);

		let resolveImage = (_image: FabricImage) => {};
		const pending = new Promise<FabricImage>((resolve) => {
			resolveImage = resolve;
		});

		vi.mocked(shapeImageToFabric).mockReturnValue(pending);

		const hydration = hydrateCanvasFromPage(canvas, pageWithImagePanel());

		await Promise.resolve();
		await Promise.resolve();

		// La imagen sigue cargando: el canvas no puede haberse vaciado todavía.
		expect(canvas.objects).toEqual([stale]);

		resolveImage({
			get: () => {
				return undefined;
			},
		} as unknown as FabricImage);
		await hydration;

		expect(canvas.objects).not.toContain(stale);
		expect(canvas.objects).toHaveLength(2);
		expect(canvas.requestRenderAll).toHaveBeenCalled();
	});
});
