import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useNewProject } from '@/composables/page/useNewProject';
import { Shape } from '@/models/Shape';
import { useEditorStore } from '@/stores/editor';
import { useHistoryStore } from '@/stores/history';
import { useMangaStore } from '@/stores/manga';

describe('useNewProject', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('opens confirmation and resets the project on confirm', () => {
		const mangaStore = useMangaStore();
		const editorStore = useEditorStore();
		const historyStore = useHistoryStore();
		const cancelStroke = vi.spyOn(editorStore, 'cancelStroke');

		mangaStore.addPage();
		mangaStore.addShape(
			Shape.create(
				[
					{ x: 0, y: 0 },
					{ x: 10, y: 0 },
					{ x: 10, y: 10 },
				],
				2,
			),
		);

		const {
			pendingNewProject,
			requestNewProject,
			confirmNewProject,
		} = useNewProject();

		requestNewProject();
		expect(pendingNewProject.value).toBe(true);

		confirmNewProject();

		expect(pendingNewProject.value).toBeNull();
		expect(cancelStroke).toHaveBeenCalledOnce();
		expect(mangaStore.pages).toHaveLength(1);
		expect(mangaStore.activePage.name).toBe('Page 1');
		expect(mangaStore.shapes).toHaveLength(0);
		expect(historyStore.entries).toHaveLength(1);
		expect(historyStore.canUndo).toBe(false);
	});

	it('cancel leaves the document untouched', () => {
		const mangaStore = useMangaStore();

		mangaStore.addPage();

		const { pendingNewProject, requestNewProject, cancelNewProject } =
			useNewProject();

		requestNewProject();
		cancelNewProject();

		expect(pendingNewProject.value).toBeNull();
		expect(mangaStore.pages).toHaveLength(2);
	});
});
