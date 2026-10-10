import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { setDragMoveEffect } from '@/lib/ui/setDragMoveEffect';
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
		const index = pages.value.findIndex((page) => {
			return page.id === id;
		});

		if (index < 0) {
			return 'Delete this page?';
		}

		return `Delete page ${index + 1}?`;
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
		requestRemove,
		cancelRemove,
		confirmRemove,
		onDragStart,
		onDragOver,
		onDrop,
		clearDragState,
	};
};
