import { describe, it, expect } from 'vitest';
import { toStageCoords } from '@/features/toStageCoords';

describe('toStageCoords', () => {
	it('returns nulls when there is no overlay position', () => {
		expect(toStageCoords(null, 1.5)).toEqual({ left: null, top: null });
	});

	it('scales page coordinates by zoom', () => {
		expect(
			toStageCoords(
				{
					left: 100,
					top: 40,
				},
				2,
			),
		).toEqual({ left: 200, top: 80 });
	});
});
