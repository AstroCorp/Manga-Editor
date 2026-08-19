import { HISTORY_LABEL } from '@/lib/history/historyEnums';
import { internDocumentImages } from '@/lib/history/documentSnapshot';
import {
	createHistoryState,
	dropOldestMovement,
	fromPersistedHistory,
	pushMovement,
	toPersistedHistory,
} from '@/lib/history/historyStack';
import {
	collectAssetIdsFromPersistedHistory,
	createImageAssetStore,
	pickImageAssets,
} from '@/lib/history/imageAssets';
import type {
	HistoryDocumentJSON,
	HistoryEntry,
	PersistedHistoryStack,
	PersistedProject,
} from '@/types/history';

export const PROJECT_STORAGE_KEY = 'manga-editor-project';

const isHistoryDocumentJSON = (
	value: unknown,
): value is HistoryDocumentJSON => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return (
		typeof data.title === 'string' &&
		typeof data.activePageId === 'string' &&
		Array.isArray(data.pages) &&
		data.pages.length > 0
	);
};

const isPatch = (value: unknown): boolean => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return (
		(data.op === 'replace' || data.op === 'remove' || data.op === 'add') &&
		Array.isArray(data.path)
	);
};

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return (
		typeof data.id === 'string' &&
		typeof data.label === 'string' &&
		Array.isArray(data.patches) &&
		Array.isArray(data.inversePatches) &&
		data.patches.every(isPatch) &&
		data.inversePatches.every(isPatch)
	);
};

const isPersistedHistoryStack = (
	value: unknown,
): value is PersistedHistoryStack => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	if (
		!isHistoryDocumentJSON(data.baseline) ||
		!Array.isArray(data.entries) ||
		typeof data.index !== 'number'
	) {
		return false;
	}

	if (
		!Number.isInteger(data.index) ||
		data.index < 0 ||
		data.index >= data.entries.length ||
		!data.entries.every(isHistoryEntry)
	) {
		return false;
	}

	return true;
};

const isImageMap = (value: unknown): value is Record<string, string> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	return Object.values(value).every((src) => {
		return typeof src === 'string';
	});
};

const isPersistedProject = (value: unknown): value is PersistedProject => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return (
		data.version === 2 &&
		isHistoryDocumentJSON(data.document) &&
		isImageMap(data.images) &&
		isPersistedHistoryStack(data.history)
	);
};

const isLegacyHistoryEntry = (
	value: unknown,
): value is { id: string; label: string; snapshot: HistoryDocumentJSON } => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return (
		typeof data.id === 'string' &&
		typeof data.label === 'string' &&
		isHistoryDocumentJSON(data.snapshot)
	);
};

const migrateLegacyProject = (value: unknown): PersistedProject | null => {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const data = value as Record<string, unknown>;

	if (data.version !== 1 || !isHistoryDocumentJSON(data.document)) {
		return null;
	}

	const history = data.history;

	if (!history || typeof history !== 'object') {
		return null;
	}

	const historyData = history as Record<string, unknown>;

	if (
		!Array.isArray(historyData.entries) ||
		typeof historyData.index !== 'number' ||
		!Number.isInteger(historyData.index) ||
		historyData.index < 0 ||
		historyData.index >= historyData.entries.length ||
		!historyData.entries.every(isLegacyHistoryEntry)
	) {
		return null;
	}

	const assets = createImageAssetStore();
	const internedSnapshots = historyData.entries.map((entry) => {
		return internDocumentImages(entry.snapshot, assets.intern);
	});
	const first = internedSnapshots[0];

	if (!first) {
		return null;
	}

	let stack = createHistoryState(first);

	for (let index = 1; index < internedSnapshots.length; index += 1) {
		const snapshot = internedSnapshots[index];
		const label = historyData.entries[index]?.label ?? HISTORY_LABEL.Start;

		if (!snapshot) {
			continue;
		}

		stack = pushMovement(stack, label, snapshot);
	}

	const targetIndex = Math.min(historyData.index, stack.entries.length - 1);

	return {
		version: 2,
		document: internDocumentImages(data.document, assets.intern),
		images: assets.exportAll(),
		history: {
			baseline: stack.baseline,
			entries: stack.entries,
			index: targetIndex,
		},
	};
};

export const loadPersistedProject = (): PersistedProject | null => {
	try {
		const raw = localStorage.getItem(PROJECT_STORAGE_KEY);

		if (!raw) {
			return null;
		}

		const parsed: unknown = JSON.parse(raw);

		if (isPersistedProject(parsed)) {
			return parsed;
		}

		return migrateLegacyProject(parsed);
	} catch {
		return null;
	}
};

const writeProject = (project: PersistedProject): boolean => {
	try {
		localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(project));

		return true;
	} catch {
		return false;
	}
};

const withUsedImages = (project: PersistedProject): PersistedProject => {
	return {
		...project,
		images: pickImageAssets(
			project.images,
			collectAssetIdsFromPersistedHistory(project.history, project.document),
		),
	};
};

/** Guarda documento + historial. Si no cabe, recorta movimientos viejos. */
export const persistProject = (project: PersistedProject): void => {
	let history = project.history;

	while (true) {
		const nextProject = withUsedImages({
			version: 2,
			document: project.document,
			images: project.images,
			history,
		});

		if (writeProject(nextProject)) {
			return;
		}

		const trimmed = dropOldestMovement(fromPersistedHistory(history));

		if (!trimmed) {
			writeProject(
				withUsedImages({
					version: 2,
					document: project.document,
					images: project.images,
					history: toPersistedHistory(createHistoryState(project.document)),
				}),
			);

			return;
		}

		history = toPersistedHistory(trimmed);
	}
};
