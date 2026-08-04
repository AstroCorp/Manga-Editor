import { describe, it, expect } from 'vitest';
import {
	coverCenterForPanel,
	coverScaleForPanel,
	shapeImageFromFabric,
} from '@/lib/fabric/panelImageFabric';
import type { FabricImage } from 'fabric';

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
		expect(shapeImage.grayscale).toBe(false);
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
});
