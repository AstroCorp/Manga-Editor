import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePageListActions } from '@/composables/page/usePageListActions';
import { useMangaStore } from '@/stores/manga';

vi.mock('vue3-toastify', () => {
	return {
		toast: {
			warn: vi.fn(),
		},
	};
});

const dragEvent = (partial: Partial<DragEvent> = {}): DragEvent => {
	return {
		preventDefault: () => undefined,
		dataTransfer: {
			setData: () => undefined,
			effectAllowed: 'none',
			dropEffect: 'none',
		},
		...partial,
	} as DragEvent;
};

describe('usePageListActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
	});

	it('adds, selects and renames pages', () => {
		const mangaStore = useMangaStore();
		const { addPage, selectPage, renamePage, pages, activePageId, canRemove } =
			usePageListActions();

		expect(canRemove.value).toBe(false);

		addPage();
		expect(pages.value).toHaveLength(2);
		expect(canRemove.value).toBe(true);

		const secondId = pages.value[1]!.id;

		selectPage(secondId);
		expect(activePageId.value).toBe(secondId);

		renamePage(secondId, 'Chapter 2');
		expect(mangaStore.pages[1]?.name).toBe('Chapter 2');
	});

	it('confirms page removal', () => {
		const {
			addPage,
			pages,
			requestRemove,
			confirmRemove,
			cancelRemove,
			pendingRemoveId,
			canRemove,
		} = usePageListActions();

		addPage();
		const id = pages.value[1]!.id;

		requestRemove(id);
		expect(pendingRemoveId.value).toBe(id);

		cancelRemove();
		expect(pendingRemoveId.value).toBeNull();
		expect(pages.value).toHaveLength(2);

		requestRemove(id);
		confirmRemove();

		expect(pages.value).toHaveLength(1);
		expect(canRemove.value).toBe(false);
	});

	it('does not request remove when only one page remains', () => {
		const { requestRemove, pendingRemoveId, pages } = usePageListActions();

		requestRemove(pages.value[0]!.id);
		expect(pendingRemoveId.value).toBeNull();
	});

	it('reorders pages on drop', () => {
		const mangaStore = useMangaStore();
		const { addPage, onDragStart, onDrop, pages } = usePageListActions();

		addPage();
		const [first, second] = pages.value;

		onDragStart(0, dragEvent());
		onDrop(1, dragEvent());

		expect(mangaStore.pages[0]?.id).toBe(second!.id);
		expect(mangaStore.pages[1]?.id).toBe(first!.id);
	});

	it('toggles strip visibility', () => {
		const { pagesVisible, togglePagesVisible } = usePageListActions();

		expect(pagesVisible.value).toBe(true);
		togglePagesVisible();
		expect(pagesVisible.value).toBe(false);
	});

	it('warns when renaming to a duplicate page name', async () => {
		const { toast } = await import('vue3-toastify');
		const mangaStore = useMangaStore();
		const { addPage, renamePage } = usePageListActions();

		addPage();
		renamePage(mangaStore.pages[0]!.id, 'Cover');
		renamePage(mangaStore.pages[1]!.id, 'cover');

		expect(toast.warn).toHaveBeenCalledExactlyOnceWith(
			'A page with that name already exists.',
		);
		expect(mangaStore.pages[1]?.name).not.toBe('cover');
	});
});
