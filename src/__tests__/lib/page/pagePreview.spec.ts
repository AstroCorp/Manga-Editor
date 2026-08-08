import { describe, expect, it } from 'vitest';
import { buildPagePreview } from '@/lib/page/pagePreview';
import { TextBlock } from '@/models/TextBlock';

describe('pagePreview', () => {
	it('returns empty panels for blank shapes', () => {
		const preview = buildPagePreview(100, 200, []);

		expect(preview.panels).toEqual([]);
		expect(preview.images).toEqual([]);
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
				strokeWidth: 2,
				image: null,
			},
		]);

		expect(preview.panels).toHaveLength(1);
		expect(preview.panels[0]?.points).toBe('0,0 10,0 10,10');
		expect(preview.panels[0]?.strokeWidth).toBe(2);
		expect(preview.panels[0]?.whiteFill).toBe(false);
	});

	it('keeps whiteFill per panel in the preview model', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokeWidth: 2,
				image: null,
				whiteFill: true,
			},
		]);

		expect(preview.panels[0]?.whiteFill).toBe(true);
	});

	it('places images with center origin', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				strokeWidth: 2,
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

		expect(preview.images).toHaveLength(1);
		expect(preview.images[0]).toEqual({
			href: 'https://example.com/cover.png',
			x: 50,
			y: 40,
			width: 100,
			height: 80,
			angle: 0,
			originX: 100,
			originY: 80,
			clipPoints: '0,0 10,0 10,10',
			grayscale: false,
		});
	});

	it('includes image angle and clip points for the panel mask', () => {
		const preview = buildPagePreview(200, 200, [
			{
				points: [
					{ x: 0, y: 0 },
					{ x: 20, y: 0 },
					{ x: 20, y: 20 },
				],
				strokeWidth: 2,
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

		expect(preview.images[0]?.angle).toBe(30);
		expect(preview.images[0]?.clipPoints).toBe('0,0 20,0 20,20');
		expect(preview.images[0]?.originX).toBe(10);
		expect(preview.images[0]?.originY).toBe(10);
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
				lines: ['Hello', 'there'],
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

	it('includes rounded box metrics for boxed text', () => {
		const text = TextBlock.createBoxed(10, 20);
		const preview = buildPagePreview(200, 200, [], [text]);

		expect(preview.texts[0]?.box).toEqual({
			fill: '#ffffff',
			stroke: '#000000',
			strokeWidth: 5,
			cornerRadius: 8,
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

		expect(preview.texts[0]?.lines.length).toBeGreaterThan(1);
		expect(preview.texts[0]?.lines.join(' ')).toContain('one');
		expect(preview.texts[0]?.lines.join(' ')).toContain('six');
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

		expect(preview.texts[0]?.lines).toEqual(['Short line']);
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
			lines: ['Outlined'],
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
				strokeWidth: 2,
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

		expect(preview.images[0]?.grayscale).toBe(true);
	});
});
