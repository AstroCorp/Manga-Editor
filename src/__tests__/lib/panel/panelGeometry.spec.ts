import { describe, it, expect } from 'vitest';
import {
	canAddEdge,
	canExtendStrokePath,
	isClosed,
	isPointInsideAnyPolygon,
	isPointInsidePolygon,
	polygonContainsAnyVertexOf,
	segmentCrossesAnyPolygon,
	segmentCrossesPolygon,
	segmentsIntersect,
	snapToGridPoint,
	toCanvasPoint,
	ZERO_MARGINS,
} from '@/lib/panel/panelGeometry';
import type { GridPoint, PageLayoutMetrics } from '@/types/geometry';
import type { PageMargins } from '@/types/page';

const PAGE_WIDTH = 300;
const PAGE_HEIGHT = 300;
const GRID_COLS = 3;
const GRID_ROWS = 3;

const gridPoint = (col: number, row: number): GridPoint => {
	return { col, row };
};

const layoutOf = (margins: PageMargins = ZERO_MARGINS): PageLayoutMetrics => {
	return {
		width: PAGE_WIDTH,
		height: PAGE_HEIGHT,
		cols: GRID_COLS,
		rows: GRID_ROWS,
		margins,
	};
};

const layout = layoutOf();

describe('panelGeometry', () => {
	it('maps grid corners to canvas edges with zero margins', () => {
		expect(toCanvasPoint(gridPoint(0, 0), layout)).toEqual({
			x: 0,
			y: 0,
		});
		expect(toCanvasPoint(gridPoint(2, 2), layout)).toEqual({
			x: PAGE_WIDTH,
			y: PAGE_HEIGHT,
		});
	});

	it('maps grid inside asymmetric margins', () => {
		const margins: PageMargins = {
			marginTop: 20,
			marginRight: 40,
			marginBottom: 10,
			marginLeft: 30,
		};
		const withMargins = layoutOf(margins);

		expect(toCanvasPoint(gridPoint(0, 0), withMargins)).toEqual({
			x: 30,
			y: 20,
		});
		expect(toCanvasPoint(gridPoint(2, 2), withMargins)).toEqual({
			x: PAGE_WIDTH - 40,
			y: PAGE_HEIGHT - 10,
		});
	});

	it('snaps canvas coordinates to nearest grid point', () => {
		expect(snapToGridPoint(0, 0, layout)).toEqual(gridPoint(0, 0));
		expect(snapToGridPoint(PAGE_WIDTH, PAGE_HEIGHT, layout)).toEqual(
			gridPoint(2, 2),
		);
		expect(
			snapToGridPoint(PAGE_WIDTH / 2, PAGE_HEIGHT / 2, layout),
		).toEqual(gridPoint(1, 1));
	});

	it('snaps with margins using the inner area', () => {
		const margins: PageMargins = {
			marginTop: 50,
			marginRight: 50,
			marginBottom: 50,
			marginLeft: 50,
		};
		const withMargins = layoutOf(margins);

		expect(snapToGridPoint(50, 50, withMargins)).toEqual(gridPoint(0, 0));
		expect(snapToGridPoint(250, 250, withMargins)).toEqual(
			gridPoint(2, 2),
		);
	});

	it('detects crossing diagonals (X)', () => {
		const firstStart = toCanvasPoint(gridPoint(0, 0), layout);
		const firstEnd = toCanvasPoint(gridPoint(2, 2), layout);
		const secondStart = toCanvasPoint(gridPoint(0, 2), layout);
		const secondEnd = toCanvasPoint(gridPoint(2, 0), layout);

		expect(
			segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd),
		).toBe(true);
	});

	it('allows segments that only share a vertex', () => {
		const firstStart = toCanvasPoint(gridPoint(0, 0), layout);
		const firstEnd = toCanvasPoint(gridPoint(1, 0), layout);
		const secondStart = toCanvasPoint(gridPoint(1, 0), layout);
		const secondEnd = toCanvasPoint(gridPoint(1, 1), layout);

		expect(
			segmentsIntersect(firstStart, firstEnd, secondStart, secondEnd),
		).toBe(false);
	});

	it('rejects an edge that would cross the current path', () => {
		const path = [gridPoint(0, 0), gridPoint(2, 0), gridPoint(2, 2)];

		expect(canAddEdge(path, gridPoint(0, 2), layout)).toBe(true);

		const crossed = [gridPoint(0, 0), gridPoint(2, 2)];

		expect(canAddEdge(crossed, gridPoint(0, 2), layout)).toBe(true);
		expect(
			canAddEdge([...crossed, gridPoint(0, 2)], gridPoint(2, 0), layout),
		).toBe(false);
	});

	it('allows closing a triangle and marks it closed', () => {
		const path = [gridPoint(0, 0), gridPoint(2, 0), gridPoint(1, 2)];

		expect(canAddEdge(path, gridPoint(0, 0), layout)).toBe(true);

		const closed = [...path, gridPoint(0, 0)];

		expect(isClosed(closed)).toBe(true);
		expect(isClosed(path)).toBe(false);
	});

	it('rejects revisiting a midpoint vertex', () => {
		const path = [gridPoint(0, 0), gridPoint(1, 0), gridPoint(1, 1)];

		expect(canAddEdge(path, gridPoint(1, 0), layout)).toBe(false);
	});
});

describe('isPointInsidePolygon', () => {
	const square = [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 100, y: 100 },
		{ x: 0, y: 100 },
	];

	it('detects strict interior points', () => {
		expect(isPointInsidePolygon({ x: 50, y: 50 }, square)).toBe(true);
		expect(isPointInsidePolygon({ x: 10, y: 90 }, square)).toBe(true);
	});

	it('treats boundary and exterior as not interior', () => {
		expect(isPointInsidePolygon({ x: 0, y: 0 }, square)).toBe(false);
		expect(isPointInsidePolygon({ x: 50, y: 0 }, square)).toBe(false);
		expect(isPointInsidePolygon({ x: 150, y: 50 }, square)).toBe(false);
	});

	it('checks any of several polygons', () => {
		const other = [
			{ x: 200, y: 200 },
			{ x: 300, y: 200 },
			{ x: 250, y: 300 },
		];

		expect(isPointInsideAnyPolygon({ x: 50, y: 50 }, [square, other])).toBe(
			true,
		);
		expect(
			isPointInsideAnyPolygon({ x: 250, y: 230 }, [square, other]),
		).toBe(true);
		expect(
			isPointInsideAnyPolygon({ x: 150, y: 150 }, [square, other]),
		).toBe(false);
	});
});

describe('segmentCrossesPolygon', () => {
	const square = [
		{ x: 0, y: 0 },
		{ x: 100, y: 0 },
		{ x: 100, y: 100 },
		{ x: 0, y: 100 },
	];

	it('rejects a segment that cuts through the interior', () => {
		expect(
			segmentCrossesPolygon(
				{ x: -10, y: 50 },
				{ x: 110, y: 50 },
				square,
			),
		).toBe(true);
		expect(
			segmentCrossesPolygon({ x: 0, y: 0 }, { x: 100, y: 100 }, square),
		).toBe(true);
	});

	it('allows shared boundary edges', () => {
		expect(
			segmentCrossesPolygon({ x: 0, y: 0 }, { x: 100, y: 0 }, square),
		).toBe(false);
		expect(
			segmentCrossesPolygon({ x: 100, y: 0 }, { x: 100, y: 100 }, square),
		).toBe(false);
	});

	it('allows segments fully outside', () => {
		expect(
			segmentCrossesPolygon(
				{ x: 150, y: 0 },
				{ x: 200, y: 50 },
				square,
			),
		).toBe(false);
	});

	it('checks any of several polygons', () => {
		const other = [
			{ x: 200, y: 200 },
			{ x: 300, y: 200 },
			{ x: 250, y: 300 },
		];
		
		expect(
			segmentCrossesAnyPolygon(
				{ x: -10, y: 50 },
				{ x: 110, y: 50 },
				[square, other],
			),
		).toBe(true);
		expect(
			segmentCrossesAnyPolygon(
				{ x: 150, y: 150 },
				{ x: 180, y: 180 },
				[square, other],
			),
		).toBe(false);
	});
});

describe('polygonContainsAnyVertexOf', () => {
	const outer = [
		{ x: 0, y: 0 },
		{ x: 200, y: 0 },
		{ x: 200, y: 200 },
		{ x: 0, y: 200 },
	];
	const inner = [
		{ x: 50, y: 50 },
		{ x: 100, y: 50 },
		{ x: 100, y: 100 },
		{ x: 50, y: 100 },
	];
	const adjacent = [
		{ x: 200, y: 0 },
		{ x: 300, y: 0 },
		{ x: 300, y: 100 },
		{ x: 200, y: 100 },
	];

	it('detects when a closed path surrounds another shape', () => {
		expect(polygonContainsAnyVertexOf(outer, [inner])).toBe(true);
	});

	it('allows adjacent shapes that only share a boundary', () => {
		expect(polygonContainsAnyVertexOf(outer, [adjacent])).toBe(false);
	});
});

describe('canExtendStrokePath', () => {
	/** Cubre el punto de rejilla (1,1) = (150,150). Vértices en (100,100)… */
	const existing = [
		[
			{ x: 100, y: 100 },
			{ x: 200, y: 100 },
			{ x: 200, y: 200 },
			{ x: 100, y: 200 },
		],
	];

	it('rejects points inside an existing shape', () => {
		expect(
			canExtendStrokePath([], gridPoint(0, 0), layout, existing),
		).toBe(true);
		expect(
			canExtendStrokePath([], gridPoint(1, 1), layout, existing),
		).toBe(false);
	});

	it('rejects vertices already used by an existing shape', () => {
		const onGrid = [
			[
				toCanvasPoint(gridPoint(0, 0), layout),
				toCanvasPoint(gridPoint(1, 0), layout),
				toCanvasPoint(gridPoint(1, 1), layout),
				toCanvasPoint(gridPoint(0, 1), layout),
			],
		];

		expect(canExtendStrokePath([], gridPoint(0, 0), layout, onGrid)).toBe(
			false,
		);
		expect(canExtendStrokePath([], gridPoint(2, 2), layout, onGrid)).toBe(
			true,
		);
		expect(
			canExtendStrokePath(
				[gridPoint(2, 0)],
				gridPoint(1, 0),
				layout,
				onGrid,
			),
		).toBe(false);
	});

	it('rejects an edge that cuts through an existing shape', () => {
		expect(
			canExtendStrokePath(
				[gridPoint(0, 0)],
				gridPoint(2, 2),
				layout,
				existing,
			),
		).toBe(false);
	});

	it('rejects closing a path that surrounds an existing shape', () => {
		const path = [
			gridPoint(0, 0),
			gridPoint(2, 0),
			gridPoint(2, 2),
			gridPoint(0, 2),
		];
		expect(
			canExtendStrokePath(path, gridPoint(0, 0), layout, existing),
		).toBe(false);
	});
});
