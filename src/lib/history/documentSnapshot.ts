import { Layer } from '@/models/Layer';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { TextBlock } from '@/models/TextBlock';
import type {
	HistoryDocumentJSON,
	HistoryLayerJSON,
	HistoryPageJSON,
	HistoryShapeJSON,
} from '@/types/history';

const shapeToHistoryJSON = (shape: Shape): HistoryShapeJSON => {
	return {
		...shape.toJSON(),
		whiteFill: shape.whiteFill,
	};
};

const shapeFromHistoryJSON = (data: HistoryShapeJSON): Shape => {
	const shape = Shape.fromJSON(data);

	shape.whiteFill = Boolean(data.whiteFill);

	return shape;
};

const layerToHistoryJSON = (layer: Layer): HistoryLayerJSON => {
	return {
		id: layer.id,
		name: layer.name,
		visible: layer.visible,
		shapes: layer.shapes.map(shapeToHistoryJSON),
		texts: layer.texts.map((text) => {
			return text.toJSON();
		}),
		gridCols: layer.gridCols,
		gridRows: layer.gridRows,
		marginTop: layer.marginTop,
		marginRight: layer.marginRight,
		marginBottom: layer.marginBottom,
		marginLeft: layer.marginLeft,
		strokeWidth: layer.strokeWidth,
	};
};

const layerFromHistoryJSON = (data: HistoryLayerJSON): Layer => {
	const layer = new Layer({
		id: data.id,
		name: data.name,
		visible: data.visible,
		shapes: data.shapes.map(shapeFromHistoryJSON),
		texts: data.texts.map((text) => {
			return TextBlock.fromJSON(text);
		}),
		gridCols: data.gridCols,
		gridRows: data.gridRows,
		strokeWidth: data.strokeWidth,
	});

	layer.marginTop = data.marginTop;
	layer.marginRight = data.marginRight;
	layer.marginBottom = data.marginBottom;
	layer.marginLeft = data.marginLeft;

	return layer;
};

const pageToHistoryJSON = (page: Page): HistoryPageJSON => {
	return {
		id: page.id,
		name: page.name,
		width: page.width,
		height: page.height,
		activeLayerId: page.activeLayerId,
		layers: page.layers.map(layerToHistoryJSON),
	};
};

const pageFromHistoryJSON = (data: HistoryPageJSON): Page => {
	return new Page({
		id: data.id,
		name: data.name,
		width: data.width,
		height: data.height,
		activeLayerId: data.activeLayerId,
		layers: data.layers.map(layerFromHistoryJSON),
	});
};

export const captureDocument = (input: {
	title: string;
	activePageId: string;
	pages: Page[];
}): HistoryDocumentJSON => {
	return {
		title: input.title,
		activePageId: input.activePageId,
		pages: input.pages.map(pageToHistoryJSON),
	};
};

export const pagesFromDocument = (snapshot: HistoryDocumentJSON): Page[] => {
	return snapshot.pages.map(pageFromHistoryJSON);
};

export const isSameDocument = (
	left: HistoryDocumentJSON,
	right: HistoryDocumentJSON,
): boolean => {
	return JSON.stringify(left) === JSON.stringify(right);
};
