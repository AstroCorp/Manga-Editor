import { describe, expect, it } from 'vitest';
import { layoutPreviewShapes } from '@/lib/page/layoutPreviewShapes';

describe('layoutPreviewShapes', () => {
	it('uses root shapes when there are no layers', () => {
		expect(
			layoutPreviewShapes({
				width: 100,
				height: 200,
				shapes: [
					{
						id: 'a',
						points: [
							{ x: 0, y: 0 },
							{ x: 1, y: 0 },
							{ x: 1, y: 1 },
						],
						strokeWidth: 2,
						image: null,
					},
				],
			}),
		).toHaveLength(1);
	});

	it('flattens shapes from layers', () => {
		expect(
			layoutPreviewShapes({
				width: 100,
				height: 200,
				shapes: [],
				layers: [
					{
						shapes: [
							{
								id: 'a',
								points: [
									{ x: 0, y: 0 },
									{ x: 1, y: 0 },
									{ x: 1, y: 1 },
								],
								strokeWidth: 2,
								image: null,
							},
						],
					},
					{
						shapes: [
							{
								id: 'b',
								points: [
									{ x: 0, y: 0 },
									{ x: 2, y: 0 },
									{ x: 2, y: 2 },
								],
								strokeWidth: 2,
								image: null,
							},
						],
					},
				],
			}),
		).toHaveLength(2);
	});
});
