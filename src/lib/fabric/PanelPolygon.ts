import { Polygon, type FabricObject } from 'fabric';
import { PANEL_STROKE_COLOR } from '@/lib/fabric/fabricColors';
import {
	cloneStrokes,
	maxStrokeWidth,
	uniformStroke,
} from '@/lib/page/shapeStrokes';
import type { ShapeStroke } from '@/types/page';

/**
 * Polígono de panel con un trazo (grosor + color) por arista.
 *
 * Si todas las aristas coinciden se delega en el stroke nativo de Fabric
 * (uniones miter limpias). Si difieren, cada arista se pinta por separado con
 * `lineCap: square` para que las esquinas queden cubiertas.
 *
 * `strokeWidth`/`stroke` se mantienen sincronizados con el trazo máximo para
 * que el bounding box, la caché y el hit-test sigan siendo correctos.
 */
export class PanelPolygonShape extends Polygon {
	declare edgeStrokes: ShapeStroke[] | undefined;

	static cacheProperties: string[] = [...Polygon.cacheProperties, 'edgeStrokes'];

	setEdgeStrokes(strokes: readonly ShapeStroke[]) {
		const next = cloneStrokes(strokes);
		const uniform = uniformStroke(next);

		this.set({
			edgeStrokes: next,
			strokeWidth: maxStrokeWidth(next),
			stroke: uniform?.color ?? next[0]?.color ?? PANEL_STROKE_COLOR,
		});
		this.setCoords();
	}

	_render(ctx: CanvasRenderingContext2D) {
		const points = this.points;
		const len = points.length;
		const last = points[len - 1];

		if (!len || !last || Number.isNaN(last.y)) {
			return;
		}

		const { x, y } = this.pathOffset;

		ctx.beginPath();
		ctx.moveTo(points[0]!.x - x, points[0]!.y - y);

		for (let index = 1; index < len; index += 1) {
			const point = points[index]!;

			ctx.lineTo(point.x - x, point.y - y);
		}

		ctx.closePath();
		this._renderFill(ctx);

		const strokes = this.edgeStrokes;

		if (!strokes || strokes.length === 0 || uniformStroke(strokes)) {
			this._renderStroke(ctx);

			return;
		}

		for (let index = 0; index < len; index += 1) {
			const stroke = strokes[index];
			const start = points[index]!;
			const end = points[(index + 1) % len]!;

			if (!stroke || stroke.width <= 0) {
				continue;
			}

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(start.x - x, start.y - y);
			ctx.lineTo(end.x - x, end.y - y);
			ctx.lineWidth = stroke.width;
			ctx.strokeStyle = stroke.color;
			ctx.lineCap = 'square';
			ctx.stroke();
			ctx.restore();
		}
	}
}

export const asPanelPolygonShape = (
	object: FabricObject | null | undefined,
): PanelPolygonShape | null => {
	return object instanceof PanelPolygonShape ? object : null;
};
