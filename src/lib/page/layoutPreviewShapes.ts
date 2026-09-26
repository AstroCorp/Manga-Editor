import {
	resolveLayoutFields,
	resolveLayoutLayerSources,
} from '@/lib/page/resolveLayoutFields';
import { createStroke, normalizeShapeStrokes } from '@/lib/page/shapeStrokes';
import type { LayoutJSON } from '@/types/layouts';
import type { ShapeJSON } from '@/types/page';

/**
 * Shapes para preview: aplana capas. Los paneles sin `strokes` heredan el
 * stroke por defecto de su capa en cada arista.
 */
export const layoutPreviewShapes = (layout: LayoutJSON): ShapeJSON[] => {
	return resolveLayoutLayerSources(layout).flatMap((layer) => {
		const fields = resolveLayoutFields(layer);
		const fallback = createStroke(fields.strokeWidth, fields.strokeColor);

		return (layer.shapes ?? []).map((shape) => {
			return {
				id: shape.id,
				points: shape.points,
				image: shape.image,
				strokes: normalizeShapeStrokes(
					shape.points.length,
					shape.strokes,
					fallback,
				),
			};
		});
	});
};
