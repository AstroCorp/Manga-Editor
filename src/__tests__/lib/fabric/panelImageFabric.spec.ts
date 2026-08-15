import { describe, it, expect, vi } from 'vitest';
import {
	bindPanelImageToPanel,
	clipContextToPanel,
	coverCenterForPanel,
	coverScaleForPanel,
	shapeImageFromFabric,
} from '@/lib/fabric/panelImageFabric';
import { shapeToPolygon } from '@/lib/fabric/shapeFabric';
import { Shape } from '@/models/Shape';
import type { FabricImage, FabricObject } from 'fabric';

describe('panelImageFabric', () => {
	it('coverScaleForPanel fills the panel bbox', () => {
		expect(
			coverScaleForPanel({ left: 0, top: 0, width: 200, height: 100 }, 100, 100),
		).toBe(2);
		expect(
			coverScaleForPanel({ left: 0, top: 0, width: 100, height: 200 }, 100, 100),
		).toBe(2);
	});

	it('coverCenterForPanel returns the bbox center', () => {
		expect(
			coverCenterForPanel({ left: 10, top: 20, width: 100, height: 40 }),
		).toEqual({ left: 60, top: 40 });
	});

	it('shapeImageFromFabric maps transform to ShapeImage', () => {
		const fabricImage = {
			getSrc: () => {
				return 'data:image/png;base64,xx';
			},
			left: 50,
			top: 60,
			scaleX: 1.5,
			scaleY: 2,
			originX: 'center',
			originY: 'center',
			width: 80,
			height: 40,
			get: (key: string) => {
				return key === 'src' ? 'data:image/png;base64,xx' : undefined;
			},
		} as unknown as FabricImage;

		const shapeImage = shapeImageFromFabric(fabricImage);

		expect(shapeImage.src).toBe('data:image/png;base64,xx');
		expect(shapeImage.left).toBe(50);
		expect(shapeImage.top).toBe(60);
		expect(shapeImage.scaleX).toBe(1.5);
		expect(shapeImage.scaleY).toBe(2);
		expect(shapeImage.originX).toBe('center');
		expect(shapeImage.originY).toBe('center');
		expect(shapeImage.width).toBe(80);
		expect(shapeImage.height).toBe(40);
		expect(shapeImage.angle).toBe(0);
		expect(shapeImage.grayscale).toBe(false);
		expect(shapeImage.flipX).toBe(false);
		expect(shapeImage.flipY).toBe(false);
	});

	it('shapeImageFromFabric maps angle', () => {
		const fabricImage = {
			getSrc: () => {
				return 'data:image/png;base64,xx';
			},
			left: 10,
			top: 20,
			scaleX: 1,
			scaleY: 1,
			originX: 'center',
			originY: 'center',
			width: 40,
			height: 40,
			angle: 42,
			get: (key: string) => {
				return key === 'src' ? 'data:image/png;base64,xx' : undefined;
			},
		} as unknown as FabricImage;

		expect(shapeImageFromFabric(fabricImage).angle).toBe(42);
	});

	it('shapeImageFromFabric reads grayscale from Fabric filters', () => {
		const fabricImage = {
			getSrc: () => {
				return 'data:image/png;base64,xx';
			},
			left: 10,
			top: 20,
			scaleX: 1,
			scaleY: 1,
			originX: 'center',
			originY: 'center',
			width: 40,
			height: 40,
			filters: [{ type: 'Grayscale' }],
			get: (key: string) => {
				return key === 'src' ? 'data:image/png;base64,xx' : undefined;
			},
		} as unknown as FabricImage;

		expect(shapeImageFromFabric(fabricImage).grayscale).toBe(true);
	});

	it('shapeImageFromFabric reads flipX and flipY', () => {
		const fabricImage = {
			getSrc: () => {
				return 'data:image/png;base64,xx';
			},
			left: 10,
			top: 20,
			scaleX: 1,
			scaleY: 1,
			originX: 'center',
			originY: 'center',
			width: 40,
			height: 40,
			flipX: true,
			flipY: true,
			get: (key: string) => {
				return key === 'src' ? 'data:image/png;base64,xx' : undefined;
			},
		} as unknown as FabricImage;

		const shapeImage = shapeImageFromFabric(fabricImage);

		expect(shapeImage.flipX).toBe(true);
		expect(shapeImage.flipY).toBe(true);
	});
});

describe('bindPanelImageToPanel', () => {
	const createTrianglePanel = () => {
		const shape = Shape.create(
			[
				{ x: 0, y: 0 },
				{ x: 40, y: 0 },
				{ x: 20, y: 30 },
			],
			2,
		);

		return shapeToPolygon(shape);
	};

	it('traces the panel polygon for canvas clipping', () => {
		const panel = createTrianglePanel();
		const ctx = {
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
		} as unknown as CanvasRenderingContext2D;

		expect(clipContextToPanel(ctx, panel)).toBe(true);
		expect(ctx.beginPath).toHaveBeenCalledOnce();
		expect(ctx.moveTo).toHaveBeenCalledOnce();
		expect(ctx.lineTo).toHaveBeenCalledTimes(2);
		expect(ctx.closePath).toHaveBeenCalledOnce();
	});

	it('does not clip when the panel has no polygon', () => {
		const panel = {
			points: [],
			getCoords: () => {
				return [];
			},
		} as unknown as FabricObject;
		const ctx = {
			beginPath: vi.fn(),
		} as unknown as CanvasRenderingContext2D;

		expect(clipContextToPanel(ctx, panel)).toBe(false);
		expect(ctx.beginPath).not.toHaveBeenCalled();
	});

	it('disables fabric caching so large scales keep clipping on the main canvas', () => {
		const panel = createTrianglePanel();
		const image = {
			render: vi.fn(),
			containsPoint: vi.fn(),
		} as unknown as FabricImage;

		bindPanelImageToPanel(image, panel);

		expect(image.objectCaching).toBe(false);
		expect(image.needsItsOwnCache()).toBe(false);
		expect(image.shouldCache()).toBe(false);
	});

	it('clips to the panel before drawing the image', () => {
		const panel = createTrianglePanel();
		const render = vi.fn();
		const image = { render } as unknown as FabricImage;

		bindPanelImageToPanel(image, panel);

		const ctx = {
			save: vi.fn(),
			restore: vi.fn(),
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			clip: vi.fn(),
		} as unknown as CanvasRenderingContext2D;

		image.render(ctx);

		expect(ctx.clip).toHaveBeenCalledOnce();
		expect(render).toHaveBeenCalledWith(ctx);
		expect(ctx.save).toHaveBeenCalled();
		expect(ctx.restore).toHaveBeenCalled();
	});
});
