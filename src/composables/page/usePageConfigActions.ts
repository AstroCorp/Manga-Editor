import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { createConfirmPayload } from '@/lib/ui/createConfirmPayload';
import { useEditorStore } from '@/stores/editor';
import { useMangaStore } from '@/stores/manga';
import type { PageMarginSide, PageRotateDirection } from '@/types/page';

/**
 * Mutaciones de config de página + rotación confirmada.
 * La UI combina esto con `useActivePageLayout` para lecturas.
 */
export const usePageConfigActions = () => {
	const mangaStore = useMangaStore();
	const editorStore = useEditorStore();
	const { activePage } = storeToRefs(mangaStore);
	const {
		pending: pendingRotate,
		request,
		cancel: cancelRotate,
		confirm,
	} = createConfirmPayload<PageRotateDirection>();

	const rotateMessage = computed(() => {
		return `Rotate '${activePage.value.name}'? Panels will be removed.`;
	});

	const setWidth = (width: number) => {
		mangaStore.setActivePageSize(width, activePage.value.height);
	};

	const setHeight = (height: number) => {
		mangaStore.setActivePageSize(activePage.value.width, height);
	};

	const setCols = (cols: number) => {
		mangaStore.setActivePageGrid(cols, activePage.value.gridRows);
	};

	const setRows = (rows: number) => {
		mangaStore.setActivePageGrid(activePage.value.gridCols, rows);
	};

	const setMargin = (side: PageMarginSide, value: number) => {
		const page = activePage.value;

		mangaStore.setActivePageMargins({
			marginTop: page.marginTop,
			marginRight: page.marginRight,
			marginBottom: page.marginBottom,
			marginLeft: page.marginLeft,
			[side]: value,
		});
	};

	const setStrokeWidth = (width: number) => {
		if (!Number.isFinite(width)) {
			return;
		}

		mangaStore.setActivePageStrokeWidth(width);
	};

	const applyRotate = (direction: PageRotateDirection) => {
		editorStore.cancelStroke();
		mangaStore.rotateActivePage(direction);
	};

	const requestRotate = (direction: PageRotateDirection) => {
		if (activePage.value.shapes.length > 0) {
			request(direction);

			return;
		}

		applyRotate(direction);
	};

	const confirmRotate = () => {
		confirm(applyRotate);
	};

	return {
		pendingRotate,
		rotateMessage,
		setWidth,
		setHeight,
		setCols,
		setRows,
		setMargin,
		setStrokeWidth,
		requestRotate,
		cancelRotate,
		confirmRotate,
	};
};
