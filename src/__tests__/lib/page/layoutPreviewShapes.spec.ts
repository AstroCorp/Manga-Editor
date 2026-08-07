import { describe, expect, it } from 'vitest';
import { layoutPreviewShapes } from '@/lib/page/layoutPreviewShapes';

describe('layoutPreviewShapes', () => {
	it('flattens shapes and applies each layer stroke', () => {
		expect(
			layoutPreviewShapes({
				width: 100,
				height: 200,
				layers: [
					{
						strokeWidth: 3,
						shapes: [
							{
								id: 'a',
								points: [
									{ x: 0, y: 0 },
									{ x: 1, y: 0 },
									{ x: 1, y: 1 },
								],
								image: null,
							},
						],
					},
				],
			}),
		).toEqual([
			{
				id: 'a',
				points: [
					{ x: 0, y: 0 },
					{ x: 1, y: 0 },
					{ x: 1, y: 1 },
				],
				image: null,
				strokeWidth: 3,
			},
		]);
	});

	it('flattens shapes from multiple layers with their strokes', () => {
		expect(
			layoutPreviewShapes({
				width: 100,
				height: 200,
				layers: [
					{
						strokeWidth: 2,
						shapes: [
							{
								id: 'a',
								points: [
									{ x: 0, y: 0 },
									{ x: 1, y: 0 },
									{ x: 1, y: 1 },
								],
								image: null,
							},
						],
					},
					{
						strokeWidth: 8,
						shapes: [
							{
								id: 'b',
								points: [
									{ x: 0, y: 0 },
									{ x: 2, y: 0 },
									{ x: 2, y: 2 },
								],
								image: null,
							},
						],
					},
				],
			}).map((shape) => {
				return { id: shape.id, strokeWidth: shape.strokeWidth };
			}),
		).toEqual([
			{ id: 'a', strokeWidth: 2 },
			{ id: 'b', strokeWidth: 8 },
		]);
	});
});
