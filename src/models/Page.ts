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
import type { LayoutJSON } from '@/types/layouts';
import type { PageMargins, PageRotateDirection, PageValue } from '@/types/page';

const findShapeOnPage = (page: Page, shapeId: string): Shape | undefined => {
	return page.shapes.find((shape) => {
		return shape.id === shapeId;
	});
};

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

	/**
	 * Orientación portrait ↔ landscape: width↔height, cols↔rows.
	 * Márgenes en ciclo (clockwise: top→right→bottom→left).
	 * No borra shapes (el store limpia al rotar).
	 */
	rotateOrientation(direction: PageRotateDirection) {
		const nextWidth = this.height;
		const nextHeight = this.width;
		const nextCols = this.gridRows;
		const nextRows = this.gridCols;
		const { marginTop, marginRight, marginBottom, marginLeft } = this;

		const nextMargins: PageMargins =
			direction === 'clockwise'
				? {
						marginTop: marginLeft,
						marginRight: marginTop,
						marginBottom: marginRight,
						marginLeft: marginBottom,
					}
				: {
						marginTop: marginRight,
						marginRight: marginBottom,
						marginBottom: marginLeft,
						marginLeft: marginTop,
					};

		this.setSize(nextWidth, nextHeight);
		this.setGrid(nextCols, nextRows);
		this.setMargins(nextMargins);
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

	/** Stroke global de la página: aplica a todos los paneles. */
	setStrokeWidth(width: number) {
		this.strokeWidth = clampStrokeWidth(width);

		for (const shape of this.shapes) {
			shape.strokeWidth = this.strokeWidth;
		}

		if (this.shapes.length > 0) {
			this.shapes = this.shapes.slice();
		}
	}

	clearShapes() {
		this.shapes = [];
	}

	addShape(shape: Shape) {
		shape.strokeWidth = this.strokeWidth;
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

	setShapeImage(shapeId: string, image: ShapeImage | null): boolean {
		const shape = findShapeOnPage(this, shapeId);

		if (!shape) {
			return false;
		}

		shape.setImage(image);
		// Nueva ref del array: Vue detecta mutaciones in-place en miniaturas.
		this.shapes = this.shapes.slice();

		return true;
	}

	applyLayout(data: LayoutJSON) {
		const fields = resolveLayoutFields(data);
		const pageStroke = clampStrokeWidth(fields.strokeWidth);

		this.setSize(data.width, data.height);
		this.setGrid(fields.gridCols, fields.gridRows);
		this.setMargins({
			marginTop: fields.marginTop,
			marginRight: fields.marginRight,
			marginBottom: fields.marginBottom,
			marginLeft: fields.marginLeft,
		});
		this.strokeWidth = pageStroke;
		this.shapes = data.shapes.map((shapeJson) => {
			return Shape.fromJSON({
				...shapeJson,
				strokeWidth: pageStroke,
			});
		});
	}

	/**
	 * Layout exportable: página + formas geométricas.
	 * Sin imágenes.
	 */
	toLayoutJSON(): LayoutJSON {
		return {
			width: this.width,
			height: this.height,
			shapes: this.shapes.map((shape) => {
				return {
					...shape.toLayoutJSON(),
					strokeWidth: this.strokeWidth,
				};
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
}
