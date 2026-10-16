import { describe, expect, it } from 'vitest';
import { wrapWordsToWidth, type WrapWord } from '@/lib/fabric/wrapWords';

const word = (text: string, width: number): WrapWord => {
	return {
		graphemes: [...text],
		width,
	};
};

const evenGraphemes = (item: WrapWord) => {
	return item.width / item.graphemes.length;
};

describe('wrapWordsToWidth', () => {
	it('keeps words that fit together on the same line', () => {
		const lines = wrapWordsToWidth(
			[word('HOLA', 40), word('MUNDO', 50)],
			100,
			10,
			evenGraphemes,
		);

		expect(lines).toEqual([[...'HOLA MUNDO']]);
	});

	it('moves the next word to a new line when it no longer fits', () => {
		const lines = wrapWordsToWidth(
			[word('HOLA', 40), word('MUNDO', 50)],
			70,
			10,
			evenGraphemes,
		);

		expect(lines).toEqual([[...'HOLA'], [...'MUNDO']]);
	});

	it('splits only a word that is wider than the box', () => {
		const lines = wrapWordsToWidth(
			[word('HOLA', 40), word('AJUSTARSE', 80)],
			50,
			10,
			evenGraphemes,
		);

		expect(lines[0]?.join('')).toBe('HOLA');
		expect(lines.slice(1).map((line) => line.join('')).join('')).toBe('AJUSTARSE');
		expect(lines.slice(1).length).toBeGreaterThan(1);
		expect(lines.slice(1).every((line) => line.join('').length <= 5)).toBe(true);
	});
});
