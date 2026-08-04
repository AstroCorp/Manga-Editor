import { describe, it, expect } from 'vitest';
import {
	DEFAULT_STROKE_WIDTH,
	MAX_GRID_POINTS,
	MAX_PAGE_SIZE,
	MAX_STROKE_WIDTH,
	MIN_GRID_POINTS,
	MIN_PAGE_SIZE,
	MIN_STROKE_WIDTH,
	clampGridSize,
	clampMargin,
	clampPageSize,
	clampStrokeWidth,
} from '@/lib/page/pageLimits';

describe('pageLimits clamps', () => {
	it('clampGridSize rounds and bounds the value', () => {
		expect(clampGridSize(10.4)).toBe(10);
		expect(clampGridSize(1)).toBe(MIN_GRID_POINTS);
		expect(clampGridSize(999)).toBe(MAX_GRID_POINTS);
		expect(clampGridSize(Number.NaN)).toBe(MIN_GRID_POINTS);
	});

	it('clampPageSize rounds and bounds the value', () => {
		expect(clampPageSize(250.6)).toBe(251);
		expect(clampPageSize(10)).toBe(MIN_PAGE_SIZE);
		expect(clampPageSize(50_000)).toBe(MAX_PAGE_SIZE);
		expect(clampPageSize(Number.POSITIVE_INFINITY)).toBe(MIN_PAGE_SIZE);
	});

	it('clampMargin caps at 20% of the shorter side', () => {
		expect(clampMargin(5, 800, 1200)).toBe(5);
		expect(clampMargin(999, 800, 1200)).toBe(160);
		expect(clampMargin(-3, 800, 1200)).toBe(0);
		expect(clampMargin(Number.NaN, 800, 1200)).toBe(0);
	});

	it('clampStrokeWidth falls back to default when non-finite', () => {
		expect(clampStrokeWidth(7.2)).toBe(7);
		expect(clampStrokeWidth(0)).toBe(MIN_STROKE_WIDTH);
		expect(clampStrokeWidth(100)).toBe(MAX_STROKE_WIDTH);
		expect(clampStrokeWidth(Number.NaN)).toBe(DEFAULT_STROKE_WIDTH);
	});
});
