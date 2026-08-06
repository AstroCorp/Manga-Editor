import { createId } from '@/lib/id';
import type {
	TextBlockJSON,
	TextBlockPatch,
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
/** Default Fabric Text lineHeight. */
export const DEFAULT_TEXT_LINE_HEIGHT = 1.16;
export const DEFAULT_TEXT_FONT_WEIGHT: TextFontWeight = 'normal';
export const DEFAULT_TEXT_FONT_STYLE: TextFontStyle = 'normal';
export const DEFAULT_TEXT_ALIGN: TextTextAlign = 'left';

const cloneStyles = (
	styles: TextStylesJSON | null | undefined,
): TextStylesJSON | null => {
	if (!styles) {
		return null;
	}

	return JSON.parse(JSON.stringify(styles)) as TextStylesJSON;
};

export class TextBlock {
	public readonly id: string;
	public content: string;
	public left: number;
	public top: number;
	public width: number;
	public fontSize: number;
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

	constructor(value: TextBlockJSON) {
		this.id = value.id;
		this.content = value.content;
		this.left = value.left;
		this.top = value.top;
		this.width = value.width;
		this.fontSize = value.fontSize;
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
	}

	static create(left: number, top: number): TextBlock {
		return new TextBlock({
			id: createId(),
			content: DEFAULT_TEXT_CONTENT,
			left,
			top,
			width: DEFAULT_TEXT_WIDTH,
			fontSize: DEFAULT_TEXT_FONT_SIZE,
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
		});
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
	}

	toJSON(): TextBlockJSON {
		return {
			id: this.id,
			content: this.content,
			left: this.left,
			top: this.top,
			width: this.width,
			fontSize: this.fontSize,
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
		};
	}

	static fromJSON(data: TextBlockJSON): TextBlock {
		return new TextBlock(data);
	}
}
