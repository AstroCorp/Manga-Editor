import { createId } from '@/lib/id';
import { ShapeImage } from '@/models/ShapeImage';
import type { PagePoint, ShapeJSON, ShapeValue } from '@/types/page';

export class Shape {
	public readonly id: string;
	public points: PagePoint[];
	public strokeWidth: number;
	public image: ShapeImage | null;

	constructor(value: ShapeValue) {
		this.id = value.id;
		this.points = value.points;
		this.strokeWidth = value.strokeWidth;
		this.image = value.image ?? null;
	}

	static create(points: PagePoint[], strokeWidth: number): Shape {
		return new Shape({
			id: createId(),
			points,
			strokeWidth,
			image: null,
		});
	}

	setImage(image: ShapeImage | null) {
		this.image = image;
	}

	toJSON(): ShapeJSON {
		return {
			id: this.id,
			// Copia defensiva para no compartir referencias mutables.
			points: this.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokeWidth: this.strokeWidth,
			image: this.image?.toJSON() ?? null,
		};
	}

	/** Solo geometría del panel (sin imagen); para export de layouts. */
	toLayoutJSON(): ShapeJSON {
		return {
			id: this.id,
			points: this.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokeWidth: this.strokeWidth,
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
