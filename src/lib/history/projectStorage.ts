import { HISTORY_LABEL } from '@/lib/history/historyEnums';
import type {
	HistoryDocumentJSON,
	HistoryEntry,
	HistoryStackState,
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

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
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

const isHistoryStackState = (value: unknown): value is HistoryStackState => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const data = value as Record<string, unknown>;

	if (!Array.isArray(data.entries) || typeof data.index !== 'number') {
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
		data.version === 1 &&
		isHistoryDocumentJSON(data.document) &&
		isHistoryStackState(data.history)
	);
};

export const loadPersistedProject = (): PersistedProject | null => {
	try {
		const raw = localStorage.getItem(PROJECT_STORAGE_KEY);

		if (!raw) {
			return null;
		}

		const parsed: unknown = JSON.parse(raw);

		if (!isPersistedProject(parsed)) {
			return null;
		}

		return parsed;
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

const shrinkHistory = (history: HistoryStackState): HistoryStackState | null => {
	if (history.entries.length <= 1) {
		return null;
	}

	return {
		entries: history.entries.slice(1),
		index: Math.max(0, history.index - 1),
	};
};

/** Guarda documento + historial. Si no cabe, recorta movimientos viejos. */
export const persistProject = (project: PersistedProject): void => {
	let history = project.history;

	while (true) {
		if (
			writeProject({
				version: 1,
				document: project.document,
				history,
			})
		) {
			return;
		}

		const next = shrinkHistory(history);

		if (!next) {
			writeProject({
				version: 1,
				document: project.document,
				history: {
					entries: [
						{
							id: history.entries[0]?.id ?? 'start',
							label: HISTORY_LABEL.Start,
							snapshot: project.document,
						},
					],
					index: 0,
				},
			});

			return;
		}

		history = next;
	}
};
