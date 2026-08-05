import { createId } from '@/lib/id';
import {
	DEFAULT_GRID_COLS,
	DEFAULT_GRID_ROWS,
	DEFAULT_MARGIN,
	DEFAULT_STROKE_WIDTH,
	clampGridSize,
	clampMargin,
	clampStrokeWidth,
} from '@/lib/page/pageLimits';
import { resolveLayoutFields } from '@/lib/page/resolveLayoutFields';
import { Shape } from '@/models/Shape';
import { TextBlock } from '@/models/TextBlock';
import type { ShapeImage } from '@/models/ShapeImage';
import type { LayoutLayerJSON } from '@/types/layouts';
import type { LayerValue, PageMargins, TextBlockPatch } from '@/types/page';

export const DEFAULT_LAYER_NAME = 'Layer 1';

const findShapeOnLayer = (layer: Layer, shapeId: string): Shape | undefined => {
	return layer.shapes.find((shape) => {
		return shape.id === shapeId;
	});
};

const updateShapeOnLayer = (
	layer: Layer,
	shapeId: string,
	mutate: (shape: Shape) => void,
): boolean => {
	const shape = findShapeOnLayer(layer, shapeId);

	if (!shape) {
		return false;
	}

	mutate(shape);
	layer.shapes = layer.shapes.slice();

	return true;
};

const updateTextOnLayer = (
	layer: Layer,
	textId: string,
	mutate: (text: TextBlock) => void,
): boolean => {
	const text = layer.texts.find((item) => {
		return item.id === textId;
	});

	if (!text) {
		return false;
	}

	mutate(text);
	layer.texts = layer.texts.slice();

	return true;
};

export class Layer {
	public readonly id: string;
	public name: string;
	public visible: boolean;
	public shapes: Shape[];
	public texts: TextBlock[];
	public gridCols: number;
	public gridRows: number;
	public marginTop: number;
	public marginRight: number;
	public marginBottom: number;
	public marginLeft: number;
	public strokeWidth: number;

	constructor(value: LayerValue) {
		this.id = value.id;
		this.name = value.name;
		this.visible = value.visible ?? true;
		this.shapes = value.shapes ?? [];
		this.texts = value.texts ?? [];
		this.gridCols = clampGridSize(value.gridCols ?? DEFAULT_GRID_COLS);
		this.gridRows = clampGridSize(value.gridRows ?? DEFAULT_GRID_ROWS);
		this.strokeWidth = clampStrokeWidth(
			value.strokeWidth ?? DEFAULT_STROKE_WIDTH,
		);
		this.marginTop = 0;
		this.marginRight = 0;
		this.marginBottom = 0;
		this.marginLeft = 0;
	}

	static createDefault(index = 1): Layer {
		return new Layer({
			id: createId(),
			name: index <= 1 ? DEFAULT_LAYER_NAME : `Layer ${index}`,
			visible: true,
		});
	}

	/** Márgenes clampados al tamaño de página actual. */
	setMargins(margins: PageMargins, pageWidth: number, pageHeight: number) {
		this.marginTop = clampMargin(margins.marginTop, pageWidth, pageHeight);
		this.marginRight = clampMargin(
			margins.marginRight,
			pageWidth,
			pageHeight,
		);
		this.marginBottom = clampMargin(
			margins.marginBottom,
			pageWidth,
			pageHeight,
		);
		this.marginLeft = clampMargin(margins.marginLeft, pageWidth, pageHeight);
	}

	applyDefaultMargins(pageWidth: number, pageHeight: number) {
		this.setMargins(
			{
				marginTop: DEFAULT_MARGIN,
				marginRight: DEFAULT_MARGIN,
				marginBottom: DEFAULT_MARGIN,
				marginLeft: DEFAULT_MARGIN,
			},
			pageWidth,
			pageHeight,
		);
	}

	setGrid(cols: number, rows: number) {
		this.gridCols = clampGridSize(cols);
		this.gridRows = clampGridSize(rows);
	}

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

	clearTexts() {
		this.texts = [];
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

	addText(text: TextBlock) {
		this.texts = [...this.texts, text];
	}

	removeText(textId: string): boolean {
		const next = this.texts.filter((text) => {
			return text.id !== textId;
		});

		if (next.length === this.texts.length) {
			return false;
		}

		this.texts = next;

		return true;
	}

	updateText(textId: string, patch: TextBlockPatch): boolean {
		return updateTextOnLayer(this, textId, (text) => {
			text.applyPatch(patch);
		});
	}

	setShapeImage(shapeId: string, image: ShapeImage | null): boolean {
		return updateShapeOnLayer(this, shapeId, (shape) => {
			shape.setImage(image);
		});
	}

	setShapeWhiteFill(shapeId: string, whiteFill: boolean): boolean {
		return updateShapeOnLayer(this, shapeId, (shape) => {
			shape.setWhiteFill(whiteFill);
		});
	}

	/** Aplica geometría de layout (sin tamaño de página). */
	applyLayoutContent(
		data: LayoutLayerJSON,
		pageWidth: number,
		pageHeight: number,
	) {
		const fields = resolveLayoutFields(data);
		const layerStroke = clampStrokeWidth(fields.strokeWidth);

		this.setGrid(fields.gridCols, fields.gridRows);
		this.setMargins(
			{
				marginTop: fields.marginTop,
				marginRight: fields.marginRight,
				marginBottom: fields.marginBottom,
				marginLeft: fields.marginLeft,
			},
			pageWidth,
			pageHeight,
		);
		this.strokeWidth = layerStroke;
		this.shapes = (data.shapes ?? []).map((shapeJson) => {
			return Shape.fromJSON({
				...shapeJson,
				strokeWidth: layerStroke,
			});
		});
		this.texts = [];
	}

	toLayoutFields(): Omit<LayoutLayerJSON, 'name' | 'visible'> & {
		shapes: NonNullable<LayoutLayerJSON['shapes']>;
	} {
		return {
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
