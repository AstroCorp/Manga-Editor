import { Layer } from '@/models/Layer';
import { Page } from '@/models/Page';
import { Shape } from '@/models/Shape';
import { ShapeImage } from '@/models/ShapeImage';
import { TextBlock } from '@/models/TextBlock';
import type {
	CaptureDocumentInput,
	HistoryDocumentJSON,
	HistoryLayerJSON,
	HistoryPageJSON,
	HistoryShapeImageJSON,
	HistoryShapeJSON,
	InternImageSrc,
	ResolveImageAsset,
} from '@/types/history';
import type { ShapeImageJSON } from '@/types/page';

const internShapeImage = (
	image: ShapeImage,
	intern: InternImageSrc,
): HistoryShapeImageJSON => {
	const { src: _src, ...rest } = image.toJSON();

	return {
		...rest,
		assetId: intern(image.src),
	};
};

const resolveShapeImage = (
	image: HistoryShapeImageJSON,
	resolve: ResolveImageAsset,
): ShapeImageJSON => {
	const { assetId, ...rest } = image;

	return {
		...rest,
		src: resolve(assetId),
	};
};

const shapeToHistoryJSON = (
	shape: Shape,
	intern: InternImageSrc,
): HistoryShapeJSON => {
	return {
		id: shape.id,
		points: shape.points.map((point) => {
			return { x: point.x, y: point.y };
		}),
		strokeWidth: shape.strokeWidth,
		whiteFill: shape.whiteFill,
		image: shape.image ? internShapeImage(shape.image, intern) : null,
	};
};

const shapeFromHistoryJSON = (
	data: HistoryShapeJSON,
	resolve: ResolveImageAsset,
): Shape => {
	const shape = Shape.fromJSON({
		id: data.id,
		points: data.points,
		strokeWidth: data.strokeWidth,
		image: data.image ? resolveShapeImage(data.image, resolve) : null,
	});

	shape.whiteFill = Boolean(data.whiteFill);

	return shape;
};

const layerToHistoryJSON = (
	layer: Layer,
	intern: InternImageSrc,
): HistoryLayerJSON => {
	return {
		id: layer.id,
		name: layer.name,
		visible: layer.visible,
		shapes: layer.shapes.map((shape) => {
			return shapeToHistoryJSON(shape, intern);
		}),
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

const layerFromHistoryJSON = (
	data: HistoryLayerJSON,
	resolve: ResolveImageAsset,
): Layer => {
	const layer = new Layer({
		id: data.id,
		name: data.name,
		visible: data.visible,
		shapes: data.shapes.map((shape) => {
			return shapeFromHistoryJSON(shape, resolve);
		}),
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

const pageToHistoryJSON = (
	page: Page,
	intern: InternImageSrc,
): HistoryPageJSON => {
	return {
		id: page.id,
		name: page.name,
		width: page.width,
		height: page.height,
		activeLayerId: page.activeLayerId,
		layers: page.layers.map((layer) => {
			return layerToHistoryJSON(layer, intern);
		}),
	};
};

const pageFromHistoryJSON = (
	data: HistoryPageJSON,
	resolve: ResolveImageAsset,
): Page => {
	return new Page({
		id: data.id,
		name: data.name,
		width: data.width,
		height: data.height,
		activeLayerId: data.activeLayerId,
		layers: data.layers.map((layer) => {
			return layerFromHistoryJSON(layer, resolve);
		}),
	});
};

export const captureDocument = (
	input: CaptureDocumentInput,
): HistoryDocumentJSON => {
	return {
		title: input.title,
		activePageId: input.activePageId,
		pages: input.pages.map((page) => {
			return pageToHistoryJSON(page, input.intern);
		}),
	};
};

export const pagesFromDocument = (
	snapshot: HistoryDocumentJSON,
	resolve: ResolveImageAsset,
): Page[] => {
	return snapshot.pages.map((page) => {
		return pageFromHistoryJSON(page, resolve);
	});
};

const internLegacyImage = (
	image: unknown,
	intern: InternImageSrc,
): HistoryShapeImageJSON | null => {
	if (!image || typeof image !== 'object') {
		return null;
	}

	const data = image as Record<string, unknown>;

	if (typeof data.assetId === 'string' && typeof data.src !== 'string') {
		const { src: _src, ...rest } = data;

		return rest as HistoryShapeImageJSON;
	}

	if (typeof data.src !== 'string') {
		return null;
	}

	const { src, ...rest } = data;

	return {
		...(rest as Omit<HistoryShapeImageJSON, 'assetId'>),
		assetId: intern(src),
	};
};

/** Convierte un documento legado (src embebido) a refs de imagen. */
export const internDocumentImages = (
	document: HistoryDocumentJSON,
	intern: InternImageSrc,
): HistoryDocumentJSON => {
	return {
		...document,
		pages: document.pages.map((page) => {
			return {
				...page,
				layers: page.layers.map((layer) => {
					return {
						...layer,
						shapes: layer.shapes.map((shape) => {
							return {
								...shape,
								image: internLegacyImage(shape.image as unknown, intern),
							};
						}),
					};
				}),
			};
		}),
	};
};
