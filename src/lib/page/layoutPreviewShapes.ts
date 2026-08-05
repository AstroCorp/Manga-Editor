import type { LayoutJSON } from '@/types/layouts';
import type { ShapeJSON } from '@/types/page';

/** Shapes para preview: aplana `layers` o usa la raíz (formato legado). */
export const layoutPreviewShapes = (layout: LayoutJSON): ShapeJSON[] => {
	if (layout.layers && layout.layers.length > 0) {
		return layout.layers.flatMap((layer) => {
			return layer.shapes ?? [];
		});
	}

	return layout.shapes ?? [];
};
