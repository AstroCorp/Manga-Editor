import { FabricText } from 'fabric';
import { DEFAULT_TEXT_LINE_HEIGHT } from '@/models/TextBlock';

type StyleWithLineHeight = {
	lineHeight?: unknown;
};

let patched = false;

const objectLineHeight = (text: FabricText): number => {
	const value = text.lineHeight;

	return typeof value === 'number' && Number.isFinite(value) && value > 0
		? value
		: DEFAULT_TEXT_LINE_HEIGHT;
};

/**
 * Multiplicador efectivo de una línea: si hay `lineHeight` en estilos de
 * carácter, usa el máximo de esos; si no, el del objeto. Fabric mide altura
 * por línea, no por carácter a mitad de renglón.
 */
export const resolveLineHeightMultiplier = (
	text: FabricText,
	lineIndex: number,
): number => {
	const fallback = objectLineHeight(text);
	const line = text._textLines?.[lineIndex];

	if (!line || line.length === 0) {
		return fallback;
	}

	let maxStyled: number | null = null;

	for (let i = 0; i < line.length; i++) {
		const style = text._getStyleDeclaration(
			lineIndex,
			i,
		) as StyleWithLineHeight;
		const raw = style.lineHeight;

		if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
			maxStyled = maxStyled === null ? raw : Math.max(maxStyled, raw);
		}
	}

	return maxStyled ?? fallback;
};

/** Hace que `getHeightOfLine` respete `styles[*][*].lineHeight`. */
export const setupPerCharLineHeight = () => {
	if (patched) {
		return;
	}

	patched = true;

	const originalGetHeightOfLine = FabricText.prototype.getHeightOfLine;

	FabricText.prototype.getHeightOfLine = function (
		this: FabricText,
		lineIndex: number,
	) {
		const objectLh = this.lineHeight;
		const effective = resolveLineHeightMultiplier(this, lineIndex);

		if (effective === objectLh) {
			return originalGetHeightOfLine.call(this, lineIndex);
		}

		this.lineHeight = effective;

		try {
			return originalGetHeightOfLine.call(this, lineIndex);
		} finally {
			this.lineHeight = objectLh;
		}
	};
};
