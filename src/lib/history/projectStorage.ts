import {
	createHistoryState,
	dropOldestMovements,
	fromPersistedHistory,
	toPersistedHistory,
} from '@/lib/history/historyStack';
import {
	deleteImageAssetsExcept,
	loadImageAssets,
	saveImageAssets,
} from '@/lib/history/imageAssetDb';
import {
	collectAssetIdsFromPersistedHistory,
} from '@/lib/history/imageAssets';
import type {
	HistoryDocumentJSON,
	HistoryEntry,
	HydratedProject,
	PersistedHistoryStack,
	PersistedProject,
	ProjectPersistenceInput,
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

const isPersistedProject = (value: unknown): value is PersistedProject => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	return (
		data.version === 3 &&
		isHistoryDocumentJSON(data.document) &&
		isPersistedHistoryStack(data.history)
	);
};

export const loadPersistedProject = async (): Promise<HydratedProject | null> => {
	try {
		const raw = localStorage.getItem(PROJECT_STORAGE_KEY);

		if (!raw) {
			return null;
		}

		const parsed: unknown = JSON.parse(raw);

		if (!isPersistedProject(parsed)) {
			return null;
		}

		const usedIds = collectAssetIdsFromPersistedHistory(
			parsed.history,
			parsed.document,
		);
		const images = await loadImageAssets(usedIds);

		return {
			...parsed,
			images,
		};
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

const writeWithHistory = (
	project: ProjectPersistenceInput,
	history: PersistedHistoryStack,
): boolean => {
	return writeProject({
		version: 3,
		document: project.document,
		history,
	});
};

/**
 * Guarda primero los assets en IndexedDB y confirma después los metadatos.
 * Si localStorage no admite el historial completo, recorta movimientos viejos.
 *
 * @returns El historial que quedó almacenado, o `null` si no se pudo guardar.
 */
export const persistProject = async (
	project: ProjectPersistenceInput,
): Promise<PersistedHistoryStack | null> => {
	const allUsedIds = collectAssetIdsFromPersistedHistory(
		project.history,
		project.document,
	);

	try {
		await saveImageAssets(project.images, allUsedIds);
	} catch {
		return null;
	}

	if (writeWithHistory(project, project.history)) {
		await deleteImageAssetsExcept(allUsedIds).catch(() => undefined);

		return project.history;
	}

	const state = fromPersistedHistory(project.history);
	const movements = state.entries.length - 1;
	const withoutHistory = toPersistedHistory(
		createHistoryState(project.document),
	);

	if (!writeWithHistory(project, withoutHistory)) {
		return null;
	}

	if (movements <= 0) {
		const usedIds = collectAssetIdsFromPersistedHistory(
			withoutHistory,
			project.document,
		);

		await deleteImageAssetsExcept(usedIds).catch(() => undefined);

		return withoutHistory;
	}

	// Bisección sobre cuántos movimientos recientes caben, para no re-serializar
	// el proyecto entero una vez por movimiento descartado.
	let fits = 0;
	let fitsHistory = withoutHistory;
	let tooMany = movements;

	while (tooMany - fits > 1) {
		const keep = Math.floor((fits + tooMany) / 2);
		const trimmed = dropOldestMovements(state, movements - keep);
		const history = trimmed ? toPersistedHistory(trimmed) : null;

		if (history && writeWithHistory(project, history)) {
			fits = keep;
			fitsHistory = history;
		} else {
			tooMany = keep;
		}
	}

	const usedIds = collectAssetIdsFromPersistedHistory(
		fitsHistory,
		project.document,
	);

	await deleteImageAssetsExcept(usedIds).catch(() => undefined);

	return fitsHistory;
};
