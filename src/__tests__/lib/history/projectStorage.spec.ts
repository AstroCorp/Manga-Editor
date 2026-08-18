import { describe, expect, it, vi } from 'vitest';
import { HISTORY_LABEL, historyLabelForPage } from '@/lib/history/historyEnums';
import { captureDocument } from '@/lib/history/documentSnapshot';
import { createHistoryState, pushMovement } from '@/lib/history/historyStack';
import {
	PROJECT_STORAGE_KEY,
	loadPersistedProject,
	persistProject,
} from '@/lib/history/projectStorage';
import { Page } from '@/models/Page';
import type { HistoryStackState } from '@/types/history';

const documentOf = (page: Page, title = 'Saved') => {
	return captureDocument({
		title,
		activePageId: page.id,
		pages: [page],
	});
};

describe('projectStorage', () => {
	it('round-trips a persisted project', () => {
		const page = Page.createBlank(1);
		const start = documentOf(page);

		page.name = 'Cover';

		const document = documentOf(page);
		const history = pushMovement(
			createHistoryState(start),
			historyLabelForPage(HISTORY_LABEL.RenamePage, 'Cover'),
			document,
		);

		persistProject({
			version: 1,
			document,
			history,
		});

		const loaded = loadPersistedProject();

		expect(localStorage.getItem(PROJECT_STORAGE_KEY)).toBeTruthy();
		expect(loaded?.document.title).toBe('Saved');
		expect(loaded?.history.index).toBe(history.index);
		expect(loaded?.history.entries).toHaveLength(history.entries.length);
	});

	it('returns null for missing, corrupt or invalid storage', () => {
		expect(loadPersistedProject()).toBeNull();

		localStorage.setItem(PROJECT_STORAGE_KEY, '{not-json');
		expect(loadPersistedProject()).toBeNull();

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 2,
				document: { title: 'x', activePageId: 'a', pages: [{}] },
				history: { entries: [], index: 0 },
			}),
		);
		expect(loadPersistedProject()).toBeNull();

		localStorage.setItem(
			PROJECT_STORAGE_KEY,
			JSON.stringify({
				version: 1,
				document: { title: 'x', activePageId: 'a', pages: [] },
				history: { entries: [], index: -1 },
			}),
		);
		expect(loadPersistedProject()).toBeNull();
	});

	it('drops the oldest movements when a write exceeds quota', () => {
		const page = Page.createBlank(1);
		let history: HistoryStackState = createHistoryState(documentOf(page));

		for (let index = 0; index < 4; index += 1) {
			page.name = `Page ${index + 2}`;
			history = pushMovement(
				history,
				historyLabelForPage(HISTORY_LABEL.RenamePage, page.name),
				documentOf(page),
			);
		}

		const originalSetItem = Storage.prototype.setItem;
		const write = vi
			.spyOn(Storage.prototype, 'setItem')
			.mockImplementation(function setItem(this: Storage, key, value) {
				if (key === PROJECT_STORAGE_KEY) {
					const parsed: { history?: { entries?: unknown[] } } = JSON.parse(
						String(value),
					);

					if ((parsed.history?.entries?.length ?? 0) > 3) {
						throw new DOMException('quota', 'QuotaExceededError');
					}
				}

				originalSetItem.call(this, key, value);
			});

		try {
			persistProject({
				version: 1,
				document: documentOf(page),
				history,
			});
		} finally {
			write.mockRestore();
		}

		const loaded = loadPersistedProject();

		expect(loaded?.history.entries.length).toBeLessThanOrEqual(3);
		expect(loaded?.document.pages[0]?.name).toBe('Page 5');
	});

	it('does not throw when even the fallback write fails', () => {
		const page = Page.createBlank(1);
		const document = documentOf(page);
		const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new DOMException('quota', 'QuotaExceededError');
		});

		expect(() => {
			persistProject({
				version: 1,
				document,
				history: createHistoryState(document),
			});
		}).not.toThrow();

		write.mockRestore();
		expect(loadPersistedProject()).toBeNull();
	});
});
