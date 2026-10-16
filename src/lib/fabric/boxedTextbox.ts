import { Textbox } from 'fabric';
import { wrapWordsToWidth, type WrapWord } from '@/lib/fabric/wrapWords';

type MeasuredWord = WrapWord & {
	start: number;
};

/**
 * Textbox de caja: el wrap salta por palabras.
 * dynamicMinWidth se deja en 0 para que la palabra más larga no ensanche la caja.
 */
export class BoxedTextbox extends Textbox {
	override _wrapLine(
		lineIndex: number,
		desiredWidth: number,
		data: {
			wordsData: { word: string[]; width: number }[][];
			largestWordWidth: number;
		},
		reservedSpace = 0,
	): string[][] {
		const limit = Math.max(1, desiredWidth - reservedSpace);
		const source = data.wordsData[lineIndex] ?? [];
		let offset = 0;
		const words: MeasuredWord[] = source.map((entry) => {
			const start = offset;

			offset += entry.word.length + 1;

			return {
				graphemes: entry.word,
				width: entry.width,
				start,
			};
		});
		const spaceWidth = this._measureWord([' '], lineIndex, 0);
		const lines = wrapWordsToWidth(words, limit, spaceWidth, (word, graphemeIndex) => {
			const measured = word as MeasuredWord;
			const grapheme = measured.graphemes[graphemeIndex] ?? '';

			return this._measureWord(
				[grapheme],
				lineIndex,
				measured.start + graphemeIndex,
			);
		});

		this.dynamicMinWidth = 0;

		return lines;
	}
}
