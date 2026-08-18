import type { ShapeJSON, TextBlockJSON } from '@/types/page';

/** Panel en un snapshot de historial (incluye relleno blanco de vista). */
export type HistoryShapeJSON = ShapeJSON & {
	whiteFill?: boolean;
};

/** Capa completa: geometría, textos e imágenes. */
export type HistoryLayerJSON = {
	id: string;
	name: string;
	visible: boolean;
	shapes: HistoryShapeJSON[];
	texts: TextBlockJSON[];
	gridCols: number;
	gridRows: number;
	marginTop: number;
	marginRight: number;
	marginBottom: number;
	marginLeft: number;
	strokeWidth: number;
};

export type HistoryPageJSON = {
	id: string;
	name: string;
	width: number;
	height: number;
	activeLayerId: string;
	layers: HistoryLayerJSON[];
};

/** Documento entero en un punto del historial. */
export type HistoryDocumentJSON = {
	title: string;
	activePageId: string;
	pages: HistoryPageJSON[];
};

export type HistoryEntry = {
	id: string;
	label: string;
	snapshot: HistoryDocumentJSON;
};

export type HistoryStackState = {
	entries: HistoryEntry[];
	index: number;
};

export type PersistedProject = {
	version: 1;
	document: HistoryDocumentJSON;
	history: HistoryStackState;
};

export type HistoryListItem = {
	id: string;
	label: string;
	isCurrent: boolean;
	isFuture: boolean;
};
