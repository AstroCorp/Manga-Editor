import { createId } from '@/lib/id';
import { DEFAULT_TEXT_FONT_FAMILY } from '@/lib/fonts/googleFontsCatalog';
import type {
	TextBlockJSON,
	TextBlockPatch,
	TextBoxStyle,
	TextFontStyle,
	TextFontWeight,
	TextStylesJSON,
	TextTextAlign,
} from '@/types/page';

export const DEFAULT_TEXT_CONTENT = 'Default text';
export const DEFAULT_TEXT_WIDTH = 200;
export const DEFAULT_TEXT_FONT_SIZE = 24;
export const DEFAULT_TEXT_FILL = '#000000';
export const DEFAULT_TEXT_STROKE = '#000000';
export const DEFAULT_TEXT_STROKE_WIDTH = 0;
export const DEFAULT_TEXT_LINE_HEIGHT = 1.16;
const DEFAULT_TEXT_FONT_WEIGHT: TextFontWeight = 'normal';
const DEFAULT_TEXT_FONT_STYLE: TextFontStyle = 'normal';
export const DEFAULT_TEXT_ALIGN: TextTextAlign = 'left';

export const DEFAULT_TEXT_BOX: TextBoxStyle = {
	fill: '#ffffff',
	stroke: '#000000',
	strokeWidth: 2,
	cornerRadius: 8,
	padding: 12,
	width: 0,
	height: 0,
	verticalAlign: 'middle',
};

export { DEFAULT_TEXT_FONT_FAMILY };

const cloneStyles = (
	styles: TextStylesJSON | null | undefined,
): TextStylesJSON | null => {
	if (!styles) {
		return null;
	}

	return JSON.parse(JSON.stringify(styles)) as TextStylesJSON;
};

const cloneBox = (box: TextBoxStyle | null | undefined): TextBoxStyle | null => {
	if (!box) {
		return null;
	}

	return {
		fill: box.fill,
		stroke: box.stroke,
		strokeWidth: box.strokeWidth,
		cornerRadius: box.cornerRadius,
		padding: box.padding,
		width: Math.max(0, Number(box.width) || 0),
		height: Math.max(0, Number(box.height) || 0),
		verticalAlign:
			box.verticalAlign === 'top' || box.verticalAlign === 'bottom'
				? box.verticalAlign
				: 'middle',
	};
};

export class TextBlock {
	public readonly id: string;
	public content: string;
	public left: number;
	public top: number;
	public width: number;
	public fontSize: number;
	public fontFamily: string;
	public fill: string;
	public fontWeight: TextFontWeight;
	public fontStyle: TextFontStyle;
	public underline: boolean;
	public linethrough: boolean;
	public stroke: string | null;
	public strokeWidth: number;
	public lineHeight: number;
	public textAlign: TextTextAlign;
	public angle: number;
	public styles: TextStylesJSON | null;
	public box: TextBoxStyle | null;

	constructor(value: TextBlockJSON) {
		this.id = value.id;
		this.content = value.content;
		this.left = value.left;
		this.top = value.top;
		this.width = value.width;
		this.fontSize = value.fontSize;
		this.fontFamily = value.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY;
		this.fill = value.fill;
		this.fontWeight = value.fontWeight ?? DEFAULT_TEXT_FONT_WEIGHT;
		this.fontStyle = value.fontStyle ?? DEFAULT_TEXT_FONT_STYLE;
		this.underline = value.underline ?? false;
		this.linethrough = value.linethrough ?? false;
		this.stroke = value.stroke ?? null;
		this.strokeWidth = value.strokeWidth ?? DEFAULT_TEXT_STROKE_WIDTH;
		this.lineHeight = value.lineHeight ?? DEFAULT_TEXT_LINE_HEIGHT;
		this.textAlign = value.textAlign ?? DEFAULT_TEXT_ALIGN;
		this.angle = value.angle ?? 0;
		this.styles = cloneStyles(value.styles);
		this.box = cloneBox(value.box);
	}

	static create(left: number, top: number): TextBlock {
		return new TextBlock({
			id: createId(),
			content: DEFAULT_TEXT_CONTENT,
			left,
			top,
			width: DEFAULT_TEXT_WIDTH,
			fontSize: DEFAULT_TEXT_FONT_SIZE,
			fontFamily: DEFAULT_TEXT_FONT_FAMILY,
			fill: DEFAULT_TEXT_FILL,
			fontWeight: DEFAULT_TEXT_FONT_WEIGHT,
			fontStyle: DEFAULT_TEXT_FONT_STYLE,
			underline: false,
			linethrough: false,
			stroke: null,
			strokeWidth: DEFAULT_TEXT_STROKE_WIDTH,
			lineHeight: DEFAULT_TEXT_LINE_HEIGHT,
			textAlign: DEFAULT_TEXT_ALIGN,
			angle: 0,
			styles: undefined,
			box: null,
		});
	}

	static createBoxed(left: number, top: number): TextBlock {
		const text = TextBlock.create(left, top);
		text.box = cloneBox(DEFAULT_TEXT_BOX);

		return text;
	}

	applyPatch(patch: TextBlockPatch) {
		if (patch.content !== undefined) {
			this.content = patch.content;
		}

		if (patch.left !== undefined) {
			this.left = patch.left;
		}

		if (patch.top !== undefined) {
			this.top = patch.top;
		}

		if (patch.width !== undefined) {
			this.width = patch.width;
		}

		if (patch.fontSize !== undefined) {
			this.fontSize = patch.fontSize;
		}

		if (patch.fontFamily !== undefined) {
			this.fontFamily = patch.fontFamily;
		}

		if (patch.fill !== undefined) {
			this.fill = patch.fill;
		}

		if (patch.fontWeight !== undefined) {
			this.fontWeight = patch.fontWeight;
		}

		if (patch.fontStyle !== undefined) {
			this.fontStyle = patch.fontStyle;
		}

		if (patch.underline !== undefined) {
			this.underline = patch.underline;
		}

		if (patch.linethrough !== undefined) {
			this.linethrough = patch.linethrough;
		}

		if ('stroke' in patch) {
			this.stroke = patch.stroke ?? null;
		}

		if (patch.strokeWidth !== undefined) {
			this.strokeWidth = patch.strokeWidth;
		}

		if (patch.lineHeight !== undefined) {
			this.lineHeight = patch.lineHeight;
		}

		if (patch.textAlign !== undefined) {
			this.textAlign = patch.textAlign;
		}

		if (patch.angle !== undefined) {
			this.angle = patch.angle;
		}

		if ('styles' in patch) {
			this.styles = cloneStyles(patch.styles);
		}

		if ('box' in patch) {
			this.box = cloneBox(patch.box);
		}
	}

	toJSON(): TextBlockJSON {
		return {
			id: this.id,
			content: this.content,
			left: this.left,
			top: this.top,
			width: this.width,
			fontSize: this.fontSize,
			fontFamily: this.fontFamily,
			fill: this.fill,
			fontWeight: this.fontWeight,
			fontStyle: this.fontStyle,
			underline: this.underline,
			linethrough: this.linethrough,
			stroke: this.stroke,
			strokeWidth: this.strokeWidth,
			lineHeight: this.lineHeight,
			textAlign: this.textAlign,
			angle: this.angle,
			...(this.styles ? { styles: cloneStyles(this.styles) ?? undefined } : {}),
			...(this.box ? { box: cloneBox(this.box) ?? undefined } : {}),
		};
	}

	static fromJSON(data: TextBlockJSON): TextBlock {
		return new TextBlock(data);
	}
};
