export type WrapWord = {
	graphemes: readonly string[];
	width: number;
};

/**
 * Envuelve por palabras. Una palabra solo se parte si ella sola no cabe,
 * para que no se dibuje fuera de la caja.
 */
export const wrapWordsToWidth = (
	words: readonly WrapWord[],
	limit: number,
	spaceWidth: number,
	graphemeWidth: (word: WrapWord, graphemeIndex: number) => number,
): string[][] => {
	const maxWidth = Math.max(1, limit);
	const lines: string[][] = [];
	let line: string[] = [];
	let lineWidth = 0;

	const commit = () => {
		if (line.length === 0) {
			return;
		}

		lines.push(line);
		line = [];
		lineWidth = 0;
	};

	for (const word of words) {
		if (word.graphemes.length === 0) {
			continue;
		}

		if (word.width <= maxWidth) {
			const gap = line.length > 0 ? spaceWidth : 0;

			if (line.length > 0 && lineWidth + gap + word.width > maxWidth) {
				commit();
			}

			if (line.length > 0) {
				line.push(' ');
				lineWidth += spaceWidth;
			}

			line.push(...word.graphemes);
			lineWidth += word.width;
			continue;
		}

		commit();

		word.graphemes.forEach((grapheme, index) => {
			const width = graphemeWidth(word, index);

			if (line.length > 0 && lineWidth + width > maxWidth) {
				commit();
			}

			line.push(grapheme);
			lineWidth += width;
		});
	}

	commit();

	return lines.length > 0 ? lines : [[]];
};
