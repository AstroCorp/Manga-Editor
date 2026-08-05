import { ShapeImage } from '@/models/ShapeImage';
import type { TextBlock } from '@/models/TextBlock';
import type {
	PagePoint,
	PagePreviewImage,
	PagePreviewModel,
	PagePreviewPanel,
	PagePreviewText,
	ShapeImageJSON,
	ShapeLike,
} from '@/types/page';

const toSvgPoints = (points: PagePoint[]): string => {
	return points
		.map((point) => {
			return `${point.x},${point.y}`;
		})
		.join(' ');
};

const imagePlacement = (
	image: ShapeImageJSON,
	clipPoints: string,
): PagePreviewImage | null => {
	if (!image.src || !clipPoints) {
		return null;
	}

	const imgWidth = Math.max(1, image.width * image.scaleX);
	const imgHeight = Math.max(1, image.height * image.scaleY);
	const x = image.originX === 'center' ? image.left - imgWidth / 2 : image.left;
	const y = image.originY === 'center' ? image.top - imgHeight / 2 : image.top;

	return {
		href: image.src,
		x,
		y,
		width: imgWidth,
		height: imgHeight,
		angle: image.angle ?? 0,
		originX: image.originX === 'center' ? image.left : x,
		originY: image.originY === 'center' ? image.top : y,
		clipPoints,
		grayscale: Boolean(image.grayscale),
	};
};

const toImageJson = (image: ShapeLike['image']): ShapeImageJSON | null => {
	if (!image) {
		return null;
	}

	if (image instanceof ShapeImage) {
		return image.toJSON();
	}

	return image;
};

const toPreviewTexts = (
	texts: TextBlock[] | null | undefined,
): PagePreviewText[] => {
	return (texts ?? []).map((text) => {
		return {
			content: text.content.replace(/\n/g, ' '),
			x: text.left,
			y: text.top + text.fontSize,
			fontSize: text.fontSize,
			fill: text.fill,
			fontWeight: text.fontWeight,
			fontStyle: text.fontStyle,
			underline: text.underline,
			linethrough: text.linethrough,
			stroke: text.stroke,
			strokeWidth: text.strokeWidth,
			angle: text.angle,
			originX: text.left,
			originY: text.top,
		};
	});
};

/** Modelo de preview ligero (paneles + imágenes + textos) desde shapes de dominio. */
export const buildPagePreview = (
	width: number,
	height: number,
	shapes: ShapeLike[] | null | undefined,
	texts?: TextBlock[] | null,
): PagePreviewModel => {
	const safeWidth = Math.max(1, width);
	const safeHeight = Math.max(1, height);
	const panels: PagePreviewPanel[] = [];
	const images: PagePreviewImage[] = [];

	for (const shape of shapes ?? []) {
		const clipPoints =
			shape.points.length >= 3 ? toSvgPoints(shape.points) : '';

		if (clipPoints) {
			panels.push({
				points: clipPoints,
				strokeWidth: Math.max(1, shape.strokeWidth),
				whiteFill: Boolean(shape.whiteFill),
			});
		}

		const imageJson = toImageJson(shape.image);

		if (imageJson && clipPoints) {
			const placed = imagePlacement(imageJson, clipPoints);

			if (placed) {
				images.push(placed);
			}
		}
	}

	return {
		width: safeWidth,
		height: safeHeight,
		panels,
		images,
		texts: toPreviewTexts(texts),
	};
};
