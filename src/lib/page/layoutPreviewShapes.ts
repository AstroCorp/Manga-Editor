import { DEFAULT_STROKE_WIDTH } from '@/lib/page/pageLimits';
import { resolveLayoutLayerSources } from '@/lib/page/resolveLayoutFields';
import type { LayoutJSON } from '@/types/layouts';
import type { ShapeJSON } from '@/types/page';

/** Shapes para preview: aplana capas e inyecta el stroke de cada capa. */
export const layoutPreviewShapes = (layout: LayoutJSON): ShapeJSON[] => {
	return resolveLayoutLayerSources(layout).flatMap((layer) => {
		const strokeWidth = layer.strokeWidth ?? DEFAULT_STROKE_WIDTH;

		return (layer.shapes ?? []).map((shape) => {
			return {
				id: shape.id,
				points: shape.points,
				image: shape.image,
				strokeWidth,
			};
		});
	});
};
