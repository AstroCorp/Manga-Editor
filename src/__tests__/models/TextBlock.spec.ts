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

	it('defaults missing angle from JSON to 0', () => {
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
	});
});
