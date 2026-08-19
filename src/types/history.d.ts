import type { Patch } from 'immer';
import type { Page } from '@/models/Page';
import type { ShapeImageJSON, ShapeJSON, TextBlockJSON } from '@/types/page';

/** Imagen en historial: el blob vive en el almacén compartido. */
export type HistoryShapeImageJSON = Omit<ShapeImageJSON, 'src'> & {
	assetId: string;
};

/** Panel en un snapshot de historial (incluye relleno blanco de vista). */
export type HistoryShapeJSON = Omit<ShapeJSON, 'image'> & {
	whiteFill?: boolean;
	image: HistoryShapeImageJSON | null;
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

/** Documento entero en un punto del historial (sin blobs de imagen). */
export type HistoryDocumentJSON = {
	title: string;
	activePageId: string;
	pages: HistoryPageJSON[];
};

export type HistoryEntry = {
	id: string;
	label: string;
	patches: Patch[];
	inversePatches: Patch[];
};

/** Estado en memoria: `current` se reconstruye al hidratar. */
export type HistoryStackState = {
	baseline: HistoryDocumentJSON;
	current: HistoryDocumentJSON;
	entries: HistoryEntry[];
	index: number;
};

/** Historial persistido: sin `current` (se aplica desde baseline + parches). */
export type PersistedHistoryStack = {
	baseline: HistoryDocumentJSON;
	entries: HistoryEntry[];
	index: number;
};

export type PersistedProject = {
	version: 2;
	document: HistoryDocumentJSON;
	images: Record<string, string>;
	history: PersistedHistoryStack;
};

export type HistoryListItem = {
	id: string;
	label: string;
	isCurrent: boolean;
	isFuture: boolean;
};

export type InternImageSrc = (src: string) => string;

export type ResolveImageAsset = (assetId: string) => string;

export type ImageAssetStore = {
	intern: InternImageSrc;
	resolve: ResolveImageAsset;
	exportAll: () => Record<string, string>;
	hydrate: (images: Record<string, string>) => void;
	retain: (usedIds: Iterable<string>) => void;
};

export type CaptureDocumentInput = {
	title: string;
	activePageId: string;
	pages: Page[];
	intern: InternImageSrc;
};

export type HistoryAssetScanInput = {
	baseline: HistoryDocumentJSON;
	current?: HistoryDocumentJSON;
	entries: ReadonlyArray<HistoryEntry>;
};

export type TransformKind = 'rotate' | 'scale' | 'move';

export type TransformHistoryTarget = 'text' | 'image';

export type TransformPose = {
	left: number;
	top: number;
	angle?: number;
	scaleX?: number;
	scaleY?: number;
	width?: number;
};
