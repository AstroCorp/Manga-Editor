import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { toast } from 'vue3-toastify';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { setDragMoveEffect } from '@/lib/ui/setDragMoveEffect';
import { normalizeNameKey } from '@/lib/ui/uniqueName';
import { useMangaStore } from '@/stores/manga';

/** CRUD + reorder + confirmación de borrado del listado de páginas. */
export const usePageListActions = () => {
	const mangaStore = useMangaStore();
	const { pages, activePageId } = storeToRefs(mangaStore);

	const pagesVisible = ref(true);
	const dragFromIndex = ref<number | null>(null);
	const dropTargetIndex = ref<number | null>(null);

	const {
		pending: pendingRemoveId,
		request,
		cancel: cancelRemove,
		confirm,
	} = createConfirmPayload<string>();

	const canRemove = computed(() => {
		return pages.value.length > 1;
	});

	const removeMessage = computed(() => {
		const id = pendingRemoveId.value;
		const name =
			pages.value.find((page) => {
				return page.id === id;
			})?.name ?? 'this page';

		return `Delete '${name}'? This cannot be undone.`;
	});

	const togglePagesVisible = () => {
		pagesVisible.value = !pagesVisible.value;
	};

	const selectPage = (id: string) => {
		if (id === activePageId.value) {
			return;
		}

		mangaStore.selectPage(id);
	};

	const requestRemove = (id: string) => {
		if (!canRemove.value) {
			return;
		}

		request(id);
	};

	const confirmRemove = () => {
		confirm((id) => {
			mangaStore.removePage(id);
		});
	};

	const clearDragState = () => {
		dragFromIndex.value = null;
		dropTargetIndex.value = null;
	};

	const onDragStart = (index: number, event: DragEvent) => {
		dragFromIndex.value = index;
		dropTargetIndex.value = index;
		event.dataTransfer?.setData('text/plain', String(index));

		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
	};

	const onDragOver = (index: number, event: DragEvent) => {
		event.preventDefault();
		setDragMoveEffect(event);
		dropTargetIndex.value = index;
	};

	const onDrop = (index: number, event: DragEvent) => {
		event.preventDefault();

		const from = dragFromIndex.value;

		clearDragState();

		if (from === null || from === index) {
			return;
		}

		mangaStore.reorderPages(from, index);
	};

	const renamePage = (id: string, name: string) => {
		const page = pages.value.find((item) => {
			return item.id === id;
		});
		const trimmed = name.trim();

		if (!page || !trimmed) {
			return;
		}

		if (normalizeNameKey(trimmed) === normalizeNameKey(page.name)) {
			return;
		}

		if (!mangaStore.renamePage(id, name)) {
			toast.warn('A page with that name already exists.');
		}
	};

	return {
		pages,
		activePageId,
		pagesVisible,
		canRemove,
		pendingRemoveId,
		removeMessage,
		dragFromIndex,
		dropTargetIndex,
		togglePagesVisible,
		selectPage,
		addPage: () => {
			mangaStore.addPage();
		},
		renamePage,
		requestRemove,
		cancelRemove,
		confirmRemove,
		onDragStart,
		onDragOver,
		onDrop,
		clearDragState,
	};
};
