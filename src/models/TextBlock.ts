import { createId } from '@/lib/id';
import type { TextBlockJSON, TextBlockPatch } from '@/types/page';

export const DEFAULT_TEXT_CONTENT = 'Default text';
export const DEFAULT_TEXT_WIDTH = 200;
export const DEFAULT_TEXT_FONT_SIZE = 24;
export const DEFAULT_TEXT_FILL = '#000000';

export class TextBlock {
	public readonly id: string;
	public content: string;
	public left: number;
	public top: number;
	public width: number;
	public fontSize: number;
	public fill: string;
	public angle: number;

	constructor(value: TextBlockJSON) {
		this.id = value.id;
		this.content = value.content;
		this.left = value.left;
		this.top = value.top;
		this.width = value.width;
		this.fontSize = value.fontSize;
		this.fill = value.fill;
		this.angle = value.angle ?? 0;
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
			angle: 0,
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

		if (patch.angle !== undefined) {
			this.angle = patch.angle;
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
			angle: this.angle,
		};
	}

	static fromJSON(data: TextBlockJSON): TextBlock {
		return new TextBlock(data);
	}
}
