import { MIN_GRID_POINTS } from '@/lib/page/pageLimits';
import type {
	CanvasPoint,
	GridPoint,
	PageLayoutMetrics,
} from '@/types/geometry';
import type { PageMargins } from '@/types/page';

/** Márgenes nulos: la rejilla ocupa todo el rectángulo de la página. */
export const ZERO_MARGINS: PageMargins = {
	marginTop: 0,
	marginRight: 0,
	marginBottom: 0,
	marginLeft: 0,
};

/** Compara dos puntos de rejilla por columna y fila. */
export const sameGridPoint = (first: GridPoint, second: GridPoint): boolean => {
	return first.col === second.col && first.row === second.row;
};

const sameCanvasPoint = (first: CanvasPoint, second: CanvasPoint): boolean => {
	return first.x === second.x && first.y === second.y;
};

/**
 * Área útil entre márgenes + rejilla con al menos MIN_GRID_POINTS por eje
 * (evita dividir por cero en col/(cols-1)).
 */
const innerArea = (layout: PageLayoutMetrics) => {
	const { width, height, cols, rows, margins } = layout;
	const safeCols = Math.max(MIN_GRID_POINTS, cols);
	const safeRows = Math.max(MIN_GRID_POINTS, rows);

	return {
		left: margins.marginLeft,
		top: margins.marginTop,
		// Mínimo 1px para no dividir por cero si los márgenes se comen la página.
		innerWidth: Math.max(
			1,
			width - margins.marginLeft - margins.marginRight,
		),
		innerHeight: Math.max(
			1,
			height - margins.marginTop - margins.marginBottom,
		),
		cols: safeCols,
		rows: safeRows,
	};
};

/**
 * GridPoint → coordenadas de página (px).
 * Interpola de forma lineal dentro del área interior.
 * col 0 → borde izquierdo interior; col (cols-1) → borde derecho.
 */
export const toCanvasPoint = (point: GridPoint, layout: PageLayoutMetrics): CanvasPoint => {
	const { left, top, innerWidth, innerHeight, cols, rows } = innerArea(layout);

	return {
		x: left + (point.col / (cols - 1)) * innerWidth,
		y: top + (point.row / (rows - 1)) * innerHeight,
	};
};

/**
 * Píxeles de página → GridPoint más cercano.
 * Usado al hacer click en el canvas para “snap” a la rejilla.
 */
export const snapToGridPoint = (canvasX: number, canvasY: number, layout: PageLayoutMetrics): GridPoint => {
	const { left, top, innerWidth, innerHeight, cols, rows } = innerArea(layout);
	const col = Math.round(((canvasX - left) / innerWidth) * (cols - 1));
	const row = Math.round(((canvasY - top) / innerHeight) * (rows - 1));

	// Clamp por si el click cae fuera de la página/márgenes.
	return {
		col: Math.min(cols - 1, Math.max(0, col)),
		row: Math.min(rows - 1, Math.max(0, row)),
	};
};

/**
 * ¿De qué lado queda un punto respecto a un segmento?
 *
 * segmentStart / segmentEnd = extremos del segmento; point = el que miramos.
 *   0 → point está encima de la línea segmentStart→segmentEnd
 *   1 / 2 → point está a un lado o al otro
 *
 * Sirve para detectar cruces (como una X): dos segmentos se cruzan cuando
 * cada punta de uno está en lados distintos del otro.
 */
const orientation = (segmentStart: CanvasPoint, segmentEnd: CanvasPoint, point: CanvasPoint): number => {
	// Producto cruzado: 0 = encima; positivo/negativo = un lado u otro.
	const crossProduct = (segmentEnd.y - segmentStart.y) * (point.x - segmentEnd.x) -
		(segmentEnd.x - segmentStart.x) * (point.y - segmentEnd.y);

	if (crossProduct === 0) {
		return 0;
	}

	return crossProduct > 0 ? 1 : 2;
};

/**
 * ¿El punto `candidate` cae entre los extremos `segmentStart` y `segmentEnd`?
 *
 * Se usa cuando ya sabemos que están en la misma línea (orientation === 0).
 * Aun así el candidato puede estar entre los extremos, o alineado pero fuera.
 *
 * Mira el rectángulo mínimo que envuelve el segmento.
 * Resumen: orientation = “¿misma línea?”; onSegment = “¿entre los extremos?”.
 */
const onSegment = (segmentStart: CanvasPoint, candidate: CanvasPoint, segmentEnd: CanvasPoint): boolean => {
	return (
		candidate.x <= Math.max(segmentStart.x, segmentEnd.x) &&
		candidate.x >= Math.min(segmentStart.x, segmentEnd.x) &&
		candidate.y <= Math.max(segmentStart.y, segmentEnd.y) &&
		candidate.y >= Math.min(segmentStart.y, segmentEnd.y)
	);
};

/**
 * ¿Los segmentos firstStart–firstEnd y secondStart–secondEnd se cruzan de verdad?
 *
 * Cruce de verdad = forman una X (se atraviesan).
 * Solo tocarse en una esquina NO cuenta: es normal al dibujar un polígono.
 *
 * 1) Lados de second respecto a first y de first respecto a second.
 *    Si en ambos casos están en lados distintos → caso X.
 * 2) Si van alineados, onSegment comprueba si un extremo cae en medio
 *    del otro (se solapan en línea).
 */
export const segmentsIntersect = (firstStart: CanvasPoint, firstEnd: CanvasPoint, secondStart: CanvasPoint, secondEnd: CanvasPoint): boolean => {
	// Misma esquina: no cuenta como cruce.
	const sharesEndpoint = sameCanvasPoint(firstStart, secondStart) ||
		sameCanvasPoint(firstStart, secondEnd) ||
		sameCanvasPoint(firstEnd, secondStart) ||
		sameCanvasPoint(firstEnd, secondEnd);

	const secondStartSide = orientation(firstStart, firstEnd, secondStart);
	const secondEndSide = orientation(firstStart, firstEnd, secondEnd);
	const firstStartSide = orientation(secondStart, secondEnd, firstStart);
	const firstEndSide = orientation(secondStart, secondEnd, firstEnd);

	// Caso X: puntas en lados distintos. Si comparten esquina, no lo contamos.
	if (secondStartSide !== secondEndSide && firstStartSide !== firstEndSide) {
		return !sharesEndpoint;
	}

	// Casos en línea: un extremo cae encima del otro segmento (no solo en la esquina).
	return (
		!sharesEndpoint &&
		(
			(secondStartSide === 0 && onSegment(firstStart, secondStart, firstEnd)) ||
			(secondEndSide === 0 && onSegment(firstStart, secondEnd, firstEnd)) ||
			(firstStartSide === 0 && onSegment(secondStart, firstStart, secondEnd)) ||
			(firstEndSide === 0 && onSegment(secondStart, firstEnd, secondEnd))
		)
	);
};

/**
 * Clave de texto de una arista, siempre en el mismo orden.
 *
 * start→end y end→start son la misma línea. Ordenamos extremos (menor col;
 * si empatan, menor row) para que ambas den el mismo string, p. ej. "1,0->2,3".
 */
const edgeKey = (start: GridPoint, end: GridPoint): string => {
	const left = start.col < end.col || (start.col === end.col && start.row <= end.row) ? start : end;
	const right = left === start ? end : start;

	return `${left.col},${left.row}->${right.col},${right.row}`;
};

/** Path cerrado: ≥4 puntos (triángulo + cierre) y el último coincide con el primero. */
export const isClosed = (path: GridPoint[]): boolean => {
	const first = path[0];
	const last = path[path.length - 1];

	return (
		first !== undefined &&
		last !== undefined &&
		path.length >= 4 &&
		sameGridPoint(first, last)
	);
};

/**
 * ¿Se puede dibujar la arista desde el último punto del path hasta `next`?
 *
 * Dice que NO si:
 * - next es el mismo que el último
 * - next ya estaba en el path (salvo al cerrar, que vuelve al primero)
 * - esa arista ya existe (aunque la dibujes al revés)
 * - la nueva arista cruza alguna arista previa del propio trazo
 *
 * El cierre (volver al primer punto con ≥3 vértices previos) sí está permitido.
 */
export const canAddEdge = (path: GridPoint[], next: GridPoint, layout: PageLayoutMetrics): boolean => {
	// Primer punto: siempre válido.
	if (path.length === 0) {
		return true;
	}

	const first = path[0];

	if (first === undefined) {
		return false;
	}

	const last = path[path.length - 1];

	if (last === undefined || sameGridPoint(last, next)) {
		return false;
	}

	// Fuera del cierre, no se puede pisar un vértice ya usado.
	const closing = path.length >= 3 && sameGridPoint(next, first);

	if (!closing && path.some((point) => sameGridPoint(point, next))) {
		return false;
	}

	const newKey = edgeKey(last, next);
	const newEdgeStart = toCanvasPoint(last, layout);
	const newEdgeEnd = toCanvasPoint(next, layout);

	// Misma pasada: arista repetida o cruce geométrico con aristas previas.
	for (let edgeIndex = 0; edgeIndex < path.length - 1; edgeIndex += 1) {
		const edgeStart = path[edgeIndex];
		const edgeEnd = path[edgeIndex + 1];

		if (edgeStart === undefined || edgeEnd === undefined) {
			return false;
		}

		if (edgeKey(edgeStart, edgeEnd) === newKey) {
			return false;
		}

		const isIntersecting = segmentsIntersect(newEdgeStart, newEdgeEnd, toCanvasPoint(edgeStart, layout), toCanvasPoint(edgeEnd, layout));

		if (isIntersecting) {
			return false;
		}
	}

	return true;
};

/**
 * ¿`point` cae encima del segmento segmentStart–segmentEnd?
 *
 * Más estricto que onSegment: usa epsilon porque con decimales casi nunca da 0.
 * 1) ¿Alineado con el segmento?
 * 2) ¿Entre los extremos (proyección), no más allá?
 */
const pointOnSegment = (point: CanvasPoint, segmentStart: CanvasPoint, segmentEnd: CanvasPoint, epsilon = 1e-6): boolean => {
	const crossProduct = (point.y - segmentStart.y) * (segmentEnd.x - segmentStart.x) -
		(point.x - segmentStart.x) * (segmentEnd.y - segmentStart.y);

	if (Math.abs(crossProduct) > epsilon) {
		return false;
	}

	// Proyección sobre el segmento: negativa = antes del start; > longitud = después del end.
	const projection = (point.x - segmentStart.x) * (segmentEnd.x - segmentStart.x) +
		(point.y - segmentStart.y) * (segmentEnd.y - segmentStart.y);

	if (projection < -epsilon) {
		return false;
	}

	const segmentLengthSquared = (segmentEnd.x - segmentStart.x) ** 2 +
		(segmentEnd.y - segmentStart.y) ** 2;

	return projection <= segmentLengthSquared + epsilon;
};

/** ¿El punto toca el borde del polígono (alguna arista)? */
export const isPointOnPolygonBoundary = (point: CanvasPoint, polygon: CanvasPoint[]): boolean => {
	if (polygon.length < 2) {
		return false;
	}

	for (let vertexIndex = 0; vertexIndex < polygon.length; vertexIndex += 1) {
		const edgeStart = polygon[vertexIndex];

		if (edgeStart === undefined) {
			return false;
		}

		// % cierra el polígono: el último vértice se une con el primero.
		const edgeEnd = polygon[(vertexIndex + 1) % polygon.length];

		if (edgeEnd === undefined) {
			return false;
		}

		if (pointOnSegment(point, edgeStart, edgeEnd)) {
			return true;
		}
	}
	return false;
};

/**
 * ¿El punto está DENTRO del polígono (no en el borde)?
 *
 * Truco del rayo: línea a la derecha y cuenta cruces con aristas.
 * Impar = dentro, par = fuera. El borde no cuenta (paneles pueden compartir arista).
 */
export const isPointInsidePolygon = (point: CanvasPoint, polygon: CanvasPoint[]): boolean => {
	if (polygon.length < 3 || isPointOnPolygonBoundary(point, polygon)) {
		return false;
	}

	let inside = false;

	for (let vertexIndex = 0; vertexIndex < polygon.length; vertexIndex += 1) {
		const edgeStart = polygon[vertexIndex];

		if (edgeStart === undefined) {
			return false;
		}

		const edgeEnd = polygon[(vertexIndex + 1) % polygon.length];

		if (edgeEnd === undefined) {
			return false;
		}

		const crossesRay = edgeStart.y > point.y !== edgeEnd.y > point.y &&
			point.x <
				((edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y)) /
					(edgeEnd.y - edgeStart.y) +
					edgeStart.x;

		if (crossesRay) {
			inside = !inside;
		}
	}
	return inside;
};

/** ¿El punto cae dentro de cualquiera de los polígonos? */
export const isPointInsideAnyPolygon = (point: CanvasPoint, polygons: CanvasPoint[][]): boolean => {
	return polygons.some((polygon) => isPointInsidePolygon(point, polygon));
};

/**
 * ¿El segmento segmentStart–segmentEnd atraviesa el interior de un polígono?
 * Compartir solo el borde no cuenta.
 */
export const segmentCrossesPolygon = (segmentStart: CanvasPoint, segmentEnd: CanvasPoint, polygon: CanvasPoint[]): boolean => {
	if (polygon.length < 3) {
		return false;
	}

	// Muestras a 25%, 50% y 75%: si alguna cae dentro, atraviesa.
	for (const fraction of [0.25, 0.5, 0.75]) {
		const sample = {
			x: segmentStart.x + (segmentEnd.x - segmentStart.x) * fraction,
			y: segmentStart.y + (segmentEnd.y - segmentStart.y) * fraction,
		};

		if (isPointInsidePolygon(sample, polygon)) {
			return true;
		}
	}

	// O si cruza alguna arista del perímetro.
	for (let vertexIndex = 0; vertexIndex < polygon.length; vertexIndex += 1) {
		const edgeStart = polygon[vertexIndex];
		const edgeEnd = polygon[(vertexIndex + 1) % polygon.length];

		if (edgeStart === undefined || edgeEnd === undefined) {
			return false;
		}

		const isIntersecting = segmentsIntersect(segmentStart, segmentEnd, edgeStart, edgeEnd);

		if (isIntersecting) {
			return true;
		}
	}

	return false;
};

/** ¿El segmento atraviesa el interior de cualquiera de los polígonos? */
export const segmentCrossesAnyPolygon = (segmentStart: CanvasPoint, segmentEnd: CanvasPoint, polygons: CanvasPoint[][]): boolean => {
	return polygons.some((polygon) =>
		segmentCrossesPolygon(segmentStart, segmentEnd, polygon),
	);
};

/**
 * ¿`outer` contiene en su interior algún vértice de las otras formas?
 * Evita cerrar un trazo que rodee un panel ya dibujado.
 */
export const polygonContainsAnyVertexOf = (outer: CanvasPoint[], polygons: CanvasPoint[][]): boolean => {
	if (outer.length < 3) {
		return false;
	}

	return polygons.some((polygon) =>
		polygon.some((vertex) => isPointInsidePolygon(vertex, outer)),
	);
};

/**
 * Regla completa del stroke: ¿se puede añadir `next` al path actual?
 *
 * Encadena todo en cada click:
 * 1) next no puede caer dentro de un panel existente
 * 2) si el path está vacío, el primer punto vale
 * 3) la arista nueva debe pasar canAddEdge (sin auto-cruces del path)
 * 4) esa arista no puede atravesar paneles existentes
 * 5) si es un cierre, el polígono resultante no puede rodear otro panel
 */
export const canExtendStrokePath = (path: GridPoint[], next: GridPoint, layout: PageLayoutMetrics, existingPolygons: CanvasPoint[][]): boolean => {
	const nextCanvasPoint = toCanvasPoint(next, layout);

	// 1) next no puede caer dentro de un panel existente
	if (isPointInsideAnyPolygon(nextCanvasPoint, existingPolygons)) {
		return false;
	}

	// 2) si el path está vacío, el primer punto vale
	if (path.length === 0) {
		return true;
	}

	// 3) la arista nueva debe pasar canAddEdge (sin auto-cruces del path)
	if (!canAddEdge(path, next, layout)) {
		return false;
	}

	const last = path[path.length - 1];

	if (last === undefined) {
		return false;
	}

	const lastCanvasPoint = toCanvasPoint(last, layout);

	// 4) esa arista no puede atravesar paneles existentes
	const isCrossing = segmentCrossesAnyPolygon(lastCanvasPoint, nextCanvasPoint, existingPolygons);
	if (isCrossing) {
		return false;
	}

	const first = path[0];

	if (first === undefined) {
		return false;
	}

	const closing = path.length >= 3 && sameGridPoint(next, first);

	if (!closing) {
		return true;
	}

	// 5) si es un cierre, el polígono resultante no puede rodear otro panel
	const candidate = path.map((point) => toCanvasPoint(point, layout));

	return !polygonContainsAnyVertexOf(candidate, existingPolygons);
};
