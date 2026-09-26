import { describe, expect, it } from 'vitest';
import {
	createStroke,
	createUniformStrokes,
	maxStrokeWidth,
	normalizeShapeStrokes,
	normalizeStrokeColor,
	uniformStroke,
} from '@/lib/page/shapeStrokes';
import { MAX_STROKE_WIDTH } from '@/lib/page/pageLimits';

describe('shapeStrokes', () => {
	it('normalizes hex colors and falls back on invalid input', () => {
		expect(normalizeStrokeColor('#ABCDEF')).toBe('#abcdef');
		expect(normalizeStrokeColor(' #abc ')).toBe('#aabbcc');
		expect(normalizeStrokeColor('red')).toBe('#111111');
		expect(normalizeStrokeColor(undefined, '#ff0000')).toBe('#ff0000');
		expect(normalizeStrokeColor(42)).toBe('#111111');
	});

	it('clamps stroke width when creating strokes', () => {
		expect(createStroke(999, '#00ff00')).toEqual({
			width: MAX_STROKE_WIDTH,
			color: '#00ff00',
		});
		expect(createStroke(-3)).toEqual({ width: 0, color: '#111111' });
		expect(createUniformStrokes(3, 4, '#ff0000')).toEqual([
			{ width: 4, color: '#ff0000' },
			{ width: 4, color: '#ff0000' },
			{ width: 4, color: '#ff0000' },
		]);
	});

	it('fills missing or invalid edges with the fallback stroke', () => {
		const fallback = { width: 5, color: '#123456' };

		expect(normalizeShapeStrokes(3, undefined, fallback)).toEqual([
			fallback,
			fallback,
			fallback,
		]);
		expect(
			normalizeShapeStrokes(
				3,
				[{ width: 2, color: '#000000' }, { color: 'bad' }, null],
				fallback,
			),
		).toEqual([
			{ width: 2, color: '#000000' },
			{ width: 5, color: '#123456' },
			fallback,
		]);
		expect(
			normalizeShapeStrokes(2, createUniformStrokes(5, 1), fallback),
		).toHaveLength(2);
	});

	it('detects uniform strokes and the widest edge', () => {
		const uniform = createUniformStrokes(4, 3, '#111111');
		const mixed = [
			{ width: 3, color: '#111111' },
			{ width: 3, color: '#ff0000' },
		];

		expect(uniformStroke(uniform)).toEqual({ width: 3, color: '#111111' });
		expect(uniformStroke(uniform)).not.toBe(uniform[0]);
		expect(uniformStroke(mixed)).toBeNull();
		expect(uniformStroke([])).toBeNull();
		expect(maxStrokeWidth([{ width: 1, color: '#000000' }, ...mixed])).toBe(3);
		expect(maxStrokeWidth([])).toBe(0);
	});
});
