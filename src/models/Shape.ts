import { createId } from '@/lib/id';
import {
	DEFAULT_STROKE_COLOR,
	DEFAULT_STROKE_WIDTH,
} from '@/lib/page/pageLimits';
import {
	cloneStrokes,
	createStroke,
	createUniformStrokes,
	normalizeShapeStrokes,
} from '@/lib/page/shapeStrokes';
import { ShapeImage } from '@/models/ShapeImage';
import type {
	PagePoint,
	ShapeJSON,
	ShapeJSONInput,
	ShapeStroke,
	ShapeStrokePatch,
	ShapeValue,
} from '@/types/page';

export class Shape {
	public readonly id: string;
	public points: PagePoint[];
	/** Un trazo por arista: `strokes[i]` une `points[i]` con `points[i+1]`. */
	public strokes: ShapeStroke[];
	public image: ShapeImage | null;
	/** Preferencia de vista; no se serializa en JSON de layout. */
	public whiteFill: boolean;

	constructor(value: ShapeValue) {
		this.id = value.id;
		this.points = value.points;
		this.strokes = normalizeShapeStrokes(value.points.length, value.strokes);
		this.image = value.image ?? null;
		this.whiteFill = Boolean(value.whiteFill);
	}

	static create(
		points: PagePoint[],
		strokeWidth = DEFAULT_STROKE_WIDTH,
		strokeColor = DEFAULT_STROKE_COLOR,
	): Shape {
		return new Shape({
			id: createId(),
			points,
			strokes: createUniformStrokes(points.length, strokeWidth, strokeColor),
		});
	}

	setImage(image: ShapeImage | null) {
		this.image = image;
	}

	setWhiteFill(whiteFill: boolean) {
		this.whiteFill = whiteFill;
	}

	/** Reemplaza el trazo de todas las aristas. */
	setUniformStroke(stroke: ShapeStroke) {
		this.strokes = createUniformStrokes(
			this.points.length,
			stroke.width,
			stroke.color,
		);
	}

	setEdgeStroke(edgeIndex: number, patch: ShapeStrokePatch): boolean {
		const current = this.strokes[edgeIndex];

		if (!current) {
			return false;
		}

		const next = cloneStrokes(this.strokes);

		next[edgeIndex] = createStroke(
			patch.width ?? current.width,
			patch.color ?? current.color,
		);
		this.strokes = next;

		return true;
	}

	toJSON(): ShapeJSON {
		return {
			id: this.id,
			points: this.points.map((point) => {
				return { x: point.x, y: point.y };
			}),
			strokes: cloneStrokes(this.strokes),
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

	/**
	 * Acepta `strokes` por arista o, en JSON antiguos, un `strokeWidth` único
	 * (y opcionalmente `strokeColor`) que se replica en cada arista.
	 */
	static fromJSON(data: ShapeJSONInput): Shape {
		const points = data.points.map((point) => {
			return { x: point.x, y: point.y };
		});
		const fallback = createStroke(
			data.strokeWidth ?? DEFAULT_STROKE_WIDTH,
			data.strokeColor ?? DEFAULT_STROKE_COLOR,
		);

		return new Shape({
			id: data.id,
			points,
			strokes: normalizeShapeStrokes(points.length, data.strokes, fallback),
			image: data.image ? ShapeImage.fromJSON(data.image) : null,
		});
	}
}
