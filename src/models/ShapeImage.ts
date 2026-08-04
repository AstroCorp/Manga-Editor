import type { ShapeImageJSON, ShapeImageValue } from '@/types/page';

export class ShapeImage {
	public src: string;
	public left: number;
	public top: number;
	public scaleX: number;
	public scaleY: number;
	public originX: 'center' | 'left';
	public originY: 'center' | 'top';
	/** Tamaño intrínseco pre-scale (necesario para preview SVG). */
	public width: number;
	public height: number;
	public grayscale: boolean;

	constructor(value: ShapeImageValue) {
		this.src = value.src;
		this.left = value.left;
		this.top = value.top;
		this.scaleX = value.scaleX;
		this.scaleY = value.scaleY;
		this.originX = value.originX ?? 'center';
		this.originY = value.originY ?? 'center';
		this.width = value.width ?? 1;
		this.height = value.height ?? 1;
		this.grayscale = Boolean(value.grayscale);
	}

	toJSON(): ShapeImageJSON {
		return {
			src: this.src,
			left: this.left,
			top: this.top,
			scaleX: this.scaleX,
			scaleY: this.scaleY,
			originX: this.originX,
			originY: this.originY,
			width: this.width,
			height: this.height,
			grayscale: this.grayscale,
		};
	}

	static fromJSON(data: ShapeImageJSON): ShapeImage {
		return new ShapeImage(data);
	}
}
