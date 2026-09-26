import { describe, expect, it } from 'vitest';
import { buildPagePreview } from '@/lib/page/pagePreview';
import { createUniformStrokes } from '@/lib/page/shapeStrokes';
import { TextBlock } from '@/models/TextBlock';
import type { PagePreviewTextRun } from '@/types/page';

const baseRun = (
	text: string,
	overrides: Partial<PagePreviewTextRun> = {},
): PagePreviewTextRun => {
	return {
		text,
		fill: '#000000',
		fontSize: 16,
		fontFamily: 'Noto Sans',
		fontWeight: 'normal',
		fontStyle: 'normal',
		underline: false,
		linethrough: false,
		stroke: null,
		strokeWidth: 0,
		...overrides,
	};
};

const plainPreviewLines = (styledLines: PagePreviewTextRun[][]): string[] => {
	return styledLines.map((runs) => {
		return runs.map((run) => run.text).join('');
	});
};

describe('pagePreview', () => {
	it('returns empty panels for blank shapes', () => {
		const preview = buildPagePreview(100, 200, []);

		expect(preview.panels).toEqual([]);
		expect(preview.texts).toEqual([]);
		expect(preview.height).toBe(200);
	});

	it('builds svg points from shape polygons', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: createUniformStrokes(3, 2),
				image: null,
			},
		]);

		expect(preview.panels).toHaveLength(1);
		expect(preview.panels[0]?.points).toBe('0,0 10,0 10,10');
		expect(preview.panels[0]?.uniformStroke).toEqual({
			width: 2,
			color: '#111111',
		});
		expect(preview.panels[0]?.edges).toEqual([]);
		expect(preview.panels[0]?.fill).toBeNull();
		expect(preview.panels[0]?.image).toBeNull();
	});

	it('splits mixed strokes into per-edge lines and skips hidden edges', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: [
					{ width: 2, color: '#111111' },
					{ width: 0, color: '#111111' },
					{ width: 6, color: '#ff0000' },
				],
				image: null,
			},
		]);

		expect(preview.panels[0]?.uniformStroke).toBeNull();
		expect(preview.panels[0]?.edges).toEqual([
			{ x1: 0, y1: 0, x2: 10, y2: 0, width: 2, color: '#111111' },
			{ x1: 10, y1: 10, x2: 0, y2: 0, width: 6, color: '#ff0000' },
		]);
	});

	it('keeps the fill color per panel in the preview model', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: createUniformStrokes(3, 2),
				image: null,
				fill: '#ffcc00',
			},
		]);

		expect(preview.panels[0]?.fill).toBe('#ffcc00');
	});

	it('clears the fill when the panel has an image', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: createUniformStrokes(3, 2),
				fill: '#ffcc00',
				image: {
					src: 'https://example.com/cover.png',
					left: 0,
					top: 0,
					scaleX: 1,
					scaleY: 1,
					width: 10,
					height: 10,
				},
			},
		]);

		expect(preview.panels[0]?.fill).toBeNull();
		expect(preview.panels[0]?.image).not.toBeNull();
	});

	it('places images with center origin', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: createUniformStrokes(3, 2),
				image: {
					src: 'https://example.com/cover.png',
					left: 100,
					top: 80,
					scaleX: 2,
					scaleY: 2,
					originX: 'center',
					originY: 'center',
					width: 50,
					height: 40,
				},
			},
		]);

		expect(preview.panels[0]?.image).toEqual({
			href: 'https://example.com/cover.png',
			x: 50,
			y: 40,
			width: 100,
			height: 80,
			angle: 0,
			originX: 100,
			originY: 80,
			grayscale: false,
			flipX: false,
			flipY: false,
		});
	});

	it('includes image angle for the panel mask', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 20, y: 0 },
					{ x: 20, y: 20 },
				],
				strokes: createUniformStrokes(3, 2),
				image: {
					src: 'https://example.com/cover.png',
					left: 10,
					top: 10,
					scaleX: 1,
					scaleY: 1,
					originX: 'left',
					originY: 'top',
					width: 20,
					height: 20,
					angle: 30,
				},
			},
		]);

		expect(preview.panels[0]?.image?.angle).toBe(30);
		expect(preview.panels[0]?.points).toBe('0,0 20,0 20,20');
		expect(preview.panels[0]?.image?.originX).toBe(10);
		expect(preview.panels[0]?.image?.originY).toBe(10);
	});

	it('builds preview texts with rotation origin at the text top-left', () => {
		const text = new TextBlock({
			id: 't1',
			content: 'Hello\nthere',
			left: 12,
			top: 24,
			width: 100,
			fontSize: 16,
			fill: '#000000',
			angle: 12,
		});
		const preview = buildPagePreview(200, 200, [], [text]);

		expect(preview.texts).toEqual([
			{
				lines: [[baseRun('Hello')], [baseRun('there')]],
				x: 12,
				y: 40,
				fontSize: 16,
				fontFamily: 'Noto Sans',
				lineHeight: 1.16,
				fill: '#000000',
				fontWeight: 'normal',
				fontStyle: 'normal',
				underline: false,
				linethrough: false,
				stroke: null,
				strokeWidth: 0,
				textAlign: 'left',
				width: 100,
				angle: 12,
				originX: 12,
				originY: 24,
				box: null,
			},
		]);
	});

	it('applies character styles as runs in preview lines', () => {
		const text = new TextBlock({
			id: 't-styled',
			content: 'Hi',
			left: 0,
			top: 0,
			width: 100,
			fontSize: 16,
			fill: '#000000',
			styles: {
				'0': {
					'0': { fontWeight: 'bold', fill: '#ff0000' },
					'1': { fontStyle: 'italic' },
				},
			},
		});
		const preview = buildPagePreview(200, 200, [], [text]);

		expect(preview.texts[0]?.lines).toEqual([
			[
				baseRun('H', { fontWeight: 'bold', fill: '#ff0000' }),
				baseRun('i', { fontStyle: 'italic' }),
			],
		]);
	});

	it('includes rounded box metrics for boxed text', () => {
		const text = TextBlock.createBoxed(10, 20);
		const preview = buildPagePreview(200, 200, [], [text]);

		expect(preview.texts[0]?.box).toEqual({
			fill: '#ffffff',
			stroke: '#000000',
			strokeWidth: 5,
			cornerRadius: 0,
			padding: 12,
			width: 0,
			height: 0,
			verticalAlign: 'middle',
		});
		expect(preview.texts[0]?.x).toBe(22);
		// middle align with auto height ≈ padding top
		expect(preview.texts[0]?.y).toBe(20 + 12 + text.fontSize);
	});

	it('soft-wraps long preview lines to the text width', () => {
		const text = new TextBlock({
			id: 't2',
			content: 'one two three four five six',
			left: 0,
			top: 0,
			width: 40,
			fontSize: 20,
			fill: '#000000',
		});
		const preview = buildPagePreview(200, 200, [], [text]);

		const plain = plainPreviewLines(preview.texts[0]?.lines ?? []);

		expect(plain.length).toBeGreaterThan(1);
		expect(plain.join(' ')).toContain('one');
		expect(plain.join(' ')).toContain('six');
	});

	it('keeps text that fits the box on a single preview line', () => {
		const text = new TextBlock({
			id: 't3',
			content: 'Short line',
			left: 0,
			top: 0,
			width: 200,
			fontSize: 24,
			fill: '#000000',
		});
		const preview = buildPagePreview(200, 200, [], [text]);

		expect(plainPreviewLines(preview.texts[0]?.lines ?? [])).toEqual([
			'Short line',
		]);
	});

	it('includes text stroke in preview when width is positive', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({
			stroke: '#ff0000',
			strokeWidth: 2,
			content: 'Outlined',
		});

		const preview = buildPagePreview(100, 100, [], [text]);

		expect(preview.texts[0]).toMatchObject({
			stroke: '#ff0000',
			strokeWidth: 2,
		});
		expect(plainPreviewLines(preview.texts[0]?.lines ?? [])).toEqual([
			'Outlined',
		]);
		expect(preview.texts[0]?.lines[0]?.[0]).toMatchObject({
			stroke: '#ff0000',
			strokeWidth: 2,
		});
	});

	it('marks grayscale images for preview styling', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: createUniformStrokes(3, 2),
				image: {
					src: 'https://example.com/cover.png',
					left: 10,
					top: 10,
					scaleX: 1,
					scaleY: 1,
					originX: 'left',
					originY: 'top',
					width: 20,
					height: 20,
					grayscale: true,
				},
			},
		]);

		expect(preview.panels[0]?.image?.grayscale).toBe(true);
	});

	it('marks flipped images for preview transforms', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokes: createUniformStrokes(3, 2),
				image: {
					src: 'https://example.com/cover.png',
					left: 10,
					top: 10,
					scaleX: 1,
					scaleY: 1,
					originX: 'left',
					originY: 'top',
					width: 20,
					height: 20,
					flipX: true,
					flipY: true,
				},
			},
		]);

		expect(preview.panels[0]?.image?.flipX).toBe(true);
		expect(preview.panels[0]?.image?.flipY).toBe(true);
	});
});
