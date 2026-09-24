import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';

/**
 * Nuevo proyecto con confirmación: una Page 1 en blanco, sin historial ni imágenes.
 */
export const useNewProject = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { pending, request, cancel, confirm } = createConfirmPayload<true>();

	const requestNewProject = () => {
		request(true);
	};

	const confirmNewProject = () => {
		confirm(() => {
			editorStore.cancelStroke();
			mangaStore.resetProject();
		});
	};

	return {
		pendingNewProject: pending,
		requestNewProject,
		cancelNewProject: cancel,
		confirmNewProject,
	};
};
