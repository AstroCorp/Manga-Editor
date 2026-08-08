import type {
	PagePreviewTextRun,
	PreviewTextBaseStyle,
	TextCharStyle,
	TextStylesJSON,
} from '@/types/page';

const mergeCharStyle = (
	base: PreviewTextBaseStyle,
	charStyle: TextCharStyle | undefined,
): PreviewTextBaseStyle => {
	if (!charStyle) {
		return base;
	}

	return {
		fill: charStyle.fill ?? base.fill,
		fontSize: charStyle.fontSize ?? base.fontSize,
		fontFamily: charStyle.fontFamily ?? base.fontFamily,
		fontWeight: charStyle.fontWeight ?? base.fontWeight,
		fontStyle: charStyle.fontStyle ?? base.fontStyle,
		underline: charStyle.underline ?? base.underline,
		linethrough: charStyle.linethrough ?? base.linethrough,
		stroke:
			charStyle.stroke !== undefined ? charStyle.stroke : base.stroke,
		strokeWidth: charStyle.strokeWidth ?? base.strokeWidth,
	};
};

const sameRunStyle = (
	left: PreviewTextBaseStyle,
	right: PreviewTextBaseStyle,
): boolean => {
	return (
		left.fill === right.fill &&
		left.fontSize === right.fontSize &&
		left.fontFamily === right.fontFamily &&
		left.fontWeight === right.fontWeight &&
		left.fontStyle === right.fontStyle &&
		left.underline === right.underline &&
		left.linethrough === right.linethrough &&
		left.stroke === right.stroke &&
		left.strokeWidth === right.strokeWidth
	);
};

const toRun = (
	text: string,
	style: PreviewTextBaseStyle,
): PagePreviewTextRun => {
	return {
		text,
		fill: style.fill,
		fontSize: style.fontSize,
		fontFamily: style.fontFamily,
		fontWeight: style.fontWeight,
		fontStyle: style.fontStyle,
		underline: style.underline,
		linethrough: style.linethrough,
		stroke: style.stroke,
		strokeWidth: style.strokeWidth,
	};
};

/**
 * Agrupa caracteres de cada línea visual en runs con estilo efectivo
 * (bloque + TextStylesJSON de Fabric por línea/char).
 */
export const buildStyledPreviewLines = (
	plainLines: string[],
	base: PreviewTextBaseStyle,
	styles: TextStylesJSON | null | undefined,
): PagePreviewTextRun[][] => {
	return plainLines.map((line, lineIndex) => {
		if (line.length === 0) {
			return [toRun('', base)];
		}

		const lineStyles = styles?.[String(lineIndex)];
		const runs: PagePreviewTextRun[] = [];
		let currentStyle = mergeCharStyle(base, lineStyles?.[String(0)]);
		let currentText = line[0] ?? '';

		for (let charIndex = 1; charIndex < line.length; charIndex++) {
			const nextStyle = mergeCharStyle(
				base,
				lineStyles?.[String(charIndex)],
			);

			if (sameRunStyle(currentStyle, nextStyle)) {
				currentText += line[charIndex] ?? '';
				continue;
			}

			runs.push(toRun(currentText, currentStyle));
			currentStyle = nextStyle;
			currentText = line[charIndex] ?? '';
		}

		runs.push(toRun(currentText, currentStyle));

		return runs;
	});
};

export const plainPreviewLines = (
	styledLines: PagePreviewTextRun[][],
): string[] => {
	return styledLines.map((runs) => {
		return runs.map((run) => run.text).join('');
	});
};
