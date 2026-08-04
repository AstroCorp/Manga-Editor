import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { useMangaStore } from '@/stores/manga';

const setMoveEffect = (event: DragEvent) => {
	if (event.dataTransfer) {
		event.dataTransfer.dropEffect = 'move';
	}
};

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
		setMoveEffect(event);
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
		renamePage: (id: string, name: string) => {
			mangaStore.renamePage(id, name);
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
