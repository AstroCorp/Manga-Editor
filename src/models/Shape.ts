import { createId } from '@/lib/id';
import { ShapeImage } from '@/models/ShapeImage';
import type { PagePoint, ShapeJSON, ShapeValue } from '@/types/page';

export class Shape {
	public readonly id: string;
	public points: PagePoint[];
	public strokeWidth: number;
	public image: ShapeImage | null;
	/** Preferencia de vista; no se serializa en JSON de layout. */
	public whiteFill: boolean;

	constructor(value: ShapeValue) {
		this.id = value.id;
		this.points = value.points;
		this.strokeWidth = value.strokeWidth;
		this.image = value.image ?? null;
		this.whiteFill = Boolean(value.whiteFill);
	}

	static create(points: PagePoint[], strokeWidth: number): Shape {
		return new Shape({
			id: createId(),
			points,
			strokeWidth,
		});
	}

	setImage(image: ShapeImage | null) {
		this.image = image;
	}

	setWhiteFill(whiteFill: boolean) {
		this.whiteFill = whiteFill;
	}

	toJSON(): ShapeJSON {
		return {
			id: this.id,
			points: this.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokeWidth: this.strokeWidth,
			image: this.image?.toJSON() ?? null,
		};
	}

	/** Geometría del panel sin imagen (export de layouts). */
	toLayoutJSON(): ShapeJSON {
		return {
			...this.toJSON(),
			image: null,
		};
	}

	static fromJSON(data: ShapeJSON): Shape {
		return new Shape({
			id: data.id,
			points: data.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokeWidth: data.strokeWidth,
			image: data.image ? ShapeImage.fromJSON(data.image) : null,
		});
	}
}
