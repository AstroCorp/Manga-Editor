import { describe, expect, it } from 'vitest';
import { ShapeImage } from '@/models/ShapeImage';

describe('ShapeImage', () => {
	it('fills optional fields and coerces flags', () => {
		const image = new ShapeImage({
			src: 'asset://photo',
			left: 12,
			top: 24,
			scaleX: 1.5,
			scaleY: 0.5,
		});

		expect(image.originX).toBe('center');
		expect(image.originY).toBe('center');
		expect(image.width).toBe(1);
		expect(image.height).toBe(1);
		expect(image.angle).toBe(0);
		expect(image.grayscale).toBe(false);
		expect(image.flipX).toBe(false);
		expect(image.flipY).toBe(false);
	});

	it('round-trips through JSON', () => {
		const image = new ShapeImage({
			src: 'asset://photo',
			left: 4,
			top: 8,
			scaleX: 2,
			scaleY: 3,
			originX: 'left',
			originY: 'top',
			width: 80,
			height: 40,
			angle: 15,
			grayscale: true,
			flipX: true,
			flipY: false,
		});

		expect(ShapeImage.fromJSON(image.toJSON())).toEqual(image);
	});
});
