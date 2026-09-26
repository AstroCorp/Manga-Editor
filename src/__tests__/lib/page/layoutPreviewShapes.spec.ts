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
				strokes: [
					{ width: 3, color: '#111111' },
					{ width: 3, color: '#111111' },
					{ width: 3, color: '#111111' },
				],
			},
		]);
	});

	it('keeps per-edge strokes declared on the shape', () => {
		const [shape] = layoutPreviewShapes({
			width: 100,
			height: 200,
			layers: [
				{
					strokeWidth: 3,
					strokeColor: '#ff0000',
					shapes: [
						{
							id: 'a',
							points: [
								{ x: 0, y: 0 },
								{ x: 1, y: 0 },
								{ x: 1, y: 1 },
							],
							strokes: [{ width: 9, color: '#00ff00' }],
							image: null,
						},
					],
				},
			],
		});

		expect(shape?.strokes).toEqual([
			{ width: 9, color: '#00ff00' },
			{ width: 3, color: '#ff0000' },
			{ width: 3, color: '#ff0000' },
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
				return { id: shape.id, strokeWidth: shape.strokes[0]?.width };
			}),
		).toEqual([
			{ id: 'a', strokeWidth: 2 },
			{ id: 'b', strokeWidth: 8 },
		]);
	});
});
