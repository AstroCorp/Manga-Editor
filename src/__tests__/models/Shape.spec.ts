import { describe, expect, it } from 'vitest';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';

const triangle = [
	{ x: 0, y: 0 },
	{ x: 10, y: 0 },
	{ x: 10, y: 10 },
];

describe('Shape', () => {
	it('normalizes fill to lowercase hex or null', () => {
		expect(Shape.normalizeFill(undefined)).toBeNull();
		expect(Shape.normalizeFill('#AABBCC')).toBe('#aabbcc');
		expect(Shape.normalizeFill('red')).toBeNull();
	});

	it('creates uniform strokes and rejects an invalid or unchanged fill', () => {
		const shape = Shape.create(triangle, 4, '#222222');

		expect(shape.points).toEqual(triangle);
		expect(shape.strokes).toEqual([
			{ width: 4, color: '#222222' },
			{ width: 4, color: '#222222' },
			{ width: 4, color: '#222222' },
		]);
		expect(shape.fill).toBeNull();
		expect(shape.setFill('nope')).toBe(false);
		expect(shape.fill).toBeNull();
		expect(shape.setFill('#ffffff')).toBe(true);
		expect(shape.setFill('#FFFFFF')).toBe(false);
		expect(shape.setFill(null)).toBe(true);
		expect(shape.fill).toBeNull();
	});

	it('patches one edge and ignores an unknown index', () => {
		const shape = Shape.create(triangle, 2, '#111111');

		expect(shape.setEdgeStroke(9, { width: 8 })).toBe(false);
		expect(shape.setEdgeStroke(1, { width: 8, color: '#abcdef' })).toBe(true);
		expect(shape.strokes[1]).toEqual({ width: 8, color: '#abcdef' });
		expect(shape.strokes[0]).toEqual({ width: 2, color: '#111111' });

		shape.setUniformStroke({ width: 3, color: '#000000' });
		expect(shape.strokes.every((stroke) => stroke.width === 3)).toBe(true);
	});

	it('restores legacy single-stroke JSON and drops the image from layout export', () => {
		const image = new ShapeImage({
			src: 'asset://photo',
			left: 1,
			top: 2,
			scaleX: 1,
			scaleY: 1,
		});
		const shape = Shape.fromJSON({
			id: 'shape-1',
			points: triangle,
			strokeWidth: 6,
			strokeColor: '#333333',
			image: image.toJSON(),
		});

		expect(shape.id).toBe('shape-1');
		expect(shape.strokes).toEqual([
			{ width: 6, color: '#333333' },
			{ width: 6, color: '#333333' },
			{ width: 6, color: '#333333' },
		]);
		expect(shape.toJSON().image?.src).toBe('asset://photo');
		expect(shape.toLayoutJSON().image).toBeNull();
		expect(Shape.fromJSON(shape.toJSON()).image?.src).toBe('asset://photo');
	});
});
