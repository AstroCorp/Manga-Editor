import { describe, expect, it } from 'vitest';
import {
	DEFAULT_TEXT_CONTENT,
	DEFAULT_TEXT_FILL,
	DEFAULT_TEXT_FONT_SIZE,
	DEFAULT_TEXT_WIDTH,
	TextBlock,
} from '@/models/TextBlock';

describe('TextBlock', () => {
	it('creates a default simple text', () => {
		const text = TextBlock.create(40, 80);

		expect(text.content).toBe(DEFAULT_TEXT_CONTENT);
		expect(text.left).toBe(40);
		expect(text.top).toBe(80);
		expect(text.width).toBe(DEFAULT_TEXT_WIDTH);
		expect(text.fontSize).toBe(DEFAULT_TEXT_FONT_SIZE);
		expect(text.fill).toBe(DEFAULT_TEXT_FILL);
		expect(text.angle).toBe(0);
		expect(text.id).toBeTruthy();
	});

	it('applies a partial patch', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({
			content: 'Hello\nworld',
			angle: 25,
			left: 12,
		});

		expect(text.content).toBe('Hello\nworld');
		expect(text.angle).toBe(25);
		expect(text.left).toBe(12);
		expect(text.top).toBe(0);
	});

	it('serializes and restores angle', () => {
		const text = TextBlock.create(10, 20);

		text.applyPatch({ angle: 45, content: 'Rotated' });

		const restored = TextBlock.fromJSON(text.toJSON());

		expect(restored.content).toBe('Rotated');
		expect(restored.angle).toBe(45);
		expect(restored.left).toBe(10);
		expect(restored.top).toBe(20);
		expect(restored.id).toBe(text.id);
	});

	it('serializes format styles and base props', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({
			fill: '#111111',
			fontWeight: 'bold',
			fontStyle: 'italic',
			underline: true,
			linethrough: true,
			styles: {
				'0': {
					'0': { fill: '#ff0000', fontSize: 18 },
				},
			},
		});

		const json = text.toJSON();
		const restored = TextBlock.fromJSON(json);

		expect(json.fill).toBe('#111111');
		expect(json.fontWeight).toBe('bold');
		expect(json.fontStyle).toBe('italic');
		expect(json.underline).toBe(true);
		expect(json.linethrough).toBe(true);
		expect(json.styles).toEqual({
			'0': {
				'0': { fill: '#ff0000', fontSize: 18 },
			},
		});
		expect(restored.styles).toEqual(json.styles);
		expect(restored.styles).not.toBe(text.styles);
		expect(restored.fontWeight).toBe('bold');
	});

	it('defaults missing format props from JSON', () => {
		const restored = TextBlock.fromJSON({
			id: 't1',
			content: 'Legacy',
			left: 1,
			top: 2,
			width: 100,
			fontSize: 18,
			fill: '#111111',
		});

		expect(restored.angle).toBe(0);
		expect(restored.fontWeight).toBe('normal');
		expect(restored.fontStyle).toBe('normal');
		expect(restored.underline).toBe(false);
		expect(restored.linethrough).toBe(false);
	});

	it('clears styles with an explicit null patch', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({
			styles: {
				'0': {
					'0': { fill: '#ff0000' },
				},
			},
		});
		text.applyPatch({ styles: null });

		expect(text.styles).toBeNull();
	});

	it('applies a single format flag without touching the rest', () => {
		const text = TextBlock.create(0, 0);

		text.applyPatch({ fontWeight: 'bold', underline: true });
		text.applyPatch({ underline: false });

		expect(text.fontWeight).toBe('bold');
		expect(text.underline).toBe(false);
	});

	it('omits null styles from JSON', () => {
		const text = TextBlock.create(0, 0);

		expect(text.toJSON().styles).toBeUndefined();
	});

	it('serializes stroke props and clears stroke with null', () => {
		const text = TextBlock.create(0, 0);

		expect(text.stroke).toBeNull();
		expect(text.strokeWidth).toBe(0);

		text.applyPatch({ stroke: '#ff0000', strokeWidth: 2 });

		const json = text.toJSON();

		expect(json.stroke).toBe('#ff0000');
		expect(json.strokeWidth).toBe(2);

		text.applyPatch({ stroke: null });

		expect(text.stroke).toBeNull();
		expect(text.strokeWidth).toBe(2);
	});
});
