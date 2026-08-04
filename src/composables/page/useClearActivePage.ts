import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

/**
 * Clear de la página activa con confirmación + cancelStroke.
 * El mensaje lo arma la UI con `useActivePageLayout`.
 */
export const useClearActivePage = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { pending, request, cancel, confirm } = createConfirmPayload<true>();

	const requestClear = () => {
		request(true);
	};

	const confirmClear = () => {
		confirm(() => {
			editorStore.cancelStroke();
			mangaStore.clearActivePage();
		});
	};

	return {
		pendingClear: pending,
		requestClear,
		cancelClear: cancel,
		confirmClear,
	};
};
