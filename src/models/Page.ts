import { createId } from '@/lib/id';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_PAGE_HEIGHT,
	DEFAULT_PAGE_WIDTH,
	DEFAULT_STROKE_WIDTH,
	clampGridSize,
	clampMargin,
	clampPageSize,
	clampStrokeWidth,
} from '@/lib/page/pageLimits';
import { resolveLayoutFields } from '@/lib/page/resolveLayoutFields';
import { Shape } from '@/models/Shape';
import type { ShapeImage } from '@/models/ShapeImage';
import type { PageJSON, PageMargins, PageValue } from '@/types/page';

export class Page {
	public readonly id: string;
	public name: string;
	public width: number;
	public height: number;
	public shapes: Shape[];
	public gridCols: number;
	public gridRows: number;
	public marginTop: number;
	public marginRight: number;
	public marginBottom: number;
	public marginLeft: number;
	public strokeWidth: number;

	constructor(value: PageValue) {
		this.id = value.id;
		this.name = value.name;
		this.shapes = value.shapes ?? [];
		// Todo valor entrante se clampéa para no romper la rejilla ni el canvas.
		this.width = clampPageSize(value.width);
		this.height = clampPageSize(value.height);
		this.gridCols = clampGridSize(value.gridCols ?? DEFAULT_GRID_COLS);
		this.gridRows = clampGridSize(value.gridRows ?? DEFAULT_GRID_ROWS);
		this.strokeWidth = clampStrokeWidth(
			value.strokeWidth ?? DEFAULT_STROKE_WIDTH,
		);
		this.marginTop = 0;
		this.marginRight = 0;
		this.marginBottom = 0;
		this.marginLeft = 0;
		this.setMargins({
			marginTop: value.marginTop ?? DEFAULT_MARGIN,
			marginRight: value.marginRight ?? DEFAULT_MARGIN,
			marginBottom: value.marginBottom ?? DEFAULT_MARGIN,
			marginLeft: value.marginLeft ?? DEFAULT_MARGIN,
		});
	}

	/** Página vacía numerada; hereda tamaño de otra página si se indica. */
	static createBlank(index: number, width?: number, height?: number): Page {
		return new Page({
			id: createId(),
			name: `Page ${index}`,
			width: width ?? DEFAULT_PAGE_WIDTH,
			height: height ?? DEFAULT_PAGE_HEIGHT,
		});
	}

	/** Al cambiar tamaño se re-clampan los márgenes (dependen del lado menor). */
	setSize(width: number, height: number) {
		this.width = clampPageSize(width);
		this.height = clampPageSize(height);
		this.setMargins({
			marginTop: this.marginTop,
			marginRight: this.marginRight,
			marginBottom: this.marginBottom,
			marginLeft: this.marginLeft,
		});
	}

	setGrid(cols: number, rows: number) {
		this.gridCols = clampGridSize(cols);
		this.gridRows = clampGridSize(rows);
	}

	setMargins(margins: PageMargins) {
		this.marginTop = clampMargin(
			margins.marginTop,
			this.width,
			this.height,
		);
		this.marginRight = clampMargin(
			margins.marginRight,
			this.width,
			this.height,
		);
		this.marginBottom = clampMargin(
			margins.marginBottom,
			this.width,
			this.height,
		);
		this.marginLeft = clampMargin(
			margins.marginLeft,
			this.width,
			this.height,
		);
	}

	setStrokeWidth(width: number) {
		this.strokeWidth = clampStrokeWidth(width);
	}

	clearShapes() {
		this.shapes = [];
	}

	addShape(shape: Shape) {
		this.shapes = [...this.shapes, shape];
	}

	removeShape(shapeId: string): boolean {
		const next = this.shapes.filter((shape) => {
			return shape.id !== shapeId;
		});

		if (next.length === this.shapes.length) {
			return false;
		}

		this.shapes = next;

		return true;
	}

	setShapeStrokeWidth(shapeId: string, width: number): boolean {
		const shape = this.findShape(shapeId);

		if (!shape) {
			return false;
		}

		shape.strokeWidth = clampStrokeWidth(width);

		// Nueva ref del array: Vue detecta mutaciones in-place en miniaturas.
		this.shapes = this.shapes.slice();

		return true;
	}

	setShapeImage(shapeId: string, image: ShapeImage | null): boolean {
		const shape = this.findShape(shapeId);

		if (!shape) {
			return false;
		}

		shape.setImage(image);
		// Nueva ref del array: Vue detecta mutaciones in-place en miniaturas.
		this.shapes = this.shapes.slice();

		return true;
	}

	findShape(shapeId: string): Shape | undefined {
		return this.shapes.find((shape) => {
			return shape.id === shapeId;
		});
	}

	/** Copia un layout sobre esta página conservando el id actual. */
	applyLayout(data: PageJSON) {
		const fields = resolveLayoutFields(data);
		
		this.name = data.name;
		this.setSize(data.width, data.height);
		this.shapes = data.shapes.map((shapeJson) => {
			return Shape.fromJSON(shapeJson);
		});
		this.setGrid(fields.gridCols, fields.gridRows);
		this.setMargins({
			marginTop: fields.marginTop,
			marginRight: fields.marginRight,
			marginBottom: fields.marginBottom,
			marginLeft: fields.marginLeft,
		});
		this.setStrokeWidth(fields.strokeWidth);
	}

	toJSON(): PageJSON {
		return {
			id: this.id,
			name: this.name,
			width: this.width,
			height: this.height,
			shapes: this.shapes.map((shape) => {
				return shape.toJSON();
			}),
			gridCols: this.gridCols,
			gridRows: this.gridRows,
			marginTop: this.marginTop,
			marginRight: this.marginRight,
			marginBottom: this.marginBottom,
			marginLeft: this.marginLeft,
			strokeWidth: this.strokeWidth,
		};
	}

	/**
	 * Layout exportable: página + formas geométricas.
	 * Sin imágenes.
	 */
	toLayoutJSON(): PageJSON {
		return {
			id: this.id,
			name: this.name,
			width: this.width,
			height: this.height,
			shapes: this.shapes.map((shape) => {
				return shape.toLayoutJSON();
			}),
			gridCols: this.gridCols,
			gridRows: this.gridRows,
			marginTop: this.marginTop,
			marginRight: this.marginRight,
			marginBottom: this.marginBottom,
			marginLeft: this.marginLeft,
			strokeWidth: this.strokeWidth,
		};
	}

	static fromJSON(data: PageJSON): Page {
		const fields = resolveLayoutFields(data);
		
		return new Page({
			id: data.id,
			name: data.name,
			width: data.width,
			height: data.height,
			shapes: data.shapes.map((shapeJson) => {
				return Shape.fromJSON(shapeJson);
			}),
			gridCols: fields.gridCols,
			gridRows: fields.gridRows,
			marginTop: fields.marginTop,
			marginRight: fields.marginRight,
			marginBottom: fields.marginBottom,
			marginLeft: fields.marginLeft,
			strokeWidth: fields.strokeWidth,
		});
	}
}
