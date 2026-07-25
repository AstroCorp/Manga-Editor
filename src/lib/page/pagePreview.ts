import { ShapeImage } from '@/models/ShapeImage';
import type {
	PagePoint,
	PagePreviewImage,
	PagePreviewModel,
	PagePreviewPanel,
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

const imagePlacement = (image: ShapeImageJSON): PagePreviewImage | null => {
	if (!image.src) {
		return null;
	}

	const imgWidth = Math.max(1, image.width * image.scaleX);
	const imgHeight = Math.max(1, image.height * image.scaleY);

	return {
		href: image.src,
		x: image.originX === 'center' ? image.left - imgWidth / 2 : image.left,
		y: image.originY === 'center' ? image.top - imgHeight / 2 : image.top,
		width: imgWidth,
		height: imgHeight,
	};
};

const toImageJson = (image: ShapeLike['image']): ShapeImageJSON | null => {
	if (!image) {
		return null;
	}

	// Shape de dominio → ShapeImage; JSON de layout → objeto plano.
	if (image instanceof ShapeImage) {
		return image.toJSON();
	}

	return image;
};

/** Modelo de preview ligero (paneles + imágenes) desde shapes de dominio. */
export const buildPagePreview = (width: number, height: number, shapes: ShapeLike[] | null | undefined): PagePreviewModel => {
	const safeWidth = Math.max(1, width);
	const safeHeight = Math.max(1, height);
	const panels: PagePreviewPanel[] = [];
	const images: PagePreviewImage[] = [];

	for (const shape of shapes ?? []) {
		if (shape.points.length >= 3) {
			panels.push({
				points: toSvgPoints(shape.points),
				strokeWidth: Math.max(1, shape.strokeWidth),
			});
		}

		const imageJson = toImageJson(shape.image);

		if (imageJson) {
			const placed = imagePlacement(imageJson);

			if (placed) {
				images.push(placed);
			}
		}
	}

	return { width: safeWidth, height: safeHeight, panels, images };
};
