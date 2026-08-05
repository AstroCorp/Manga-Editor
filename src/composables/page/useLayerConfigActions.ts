import { storeToRefs } from 'pinia';
import { useMangaStore } from '@/stores/manga';
import type { PageMarginSide } from '@/types/page';

/** Mutaciones de rejilla / márgenes / stroke de la capa activa. */
export const useLayerConfigActions = () => {
	const mangaStore = useMangaStore();
	const { activeLayer } = storeToRefs(mangaStore);

	const setCols = (cols: number) => {
		mangaStore.setActiveLayerGrid(cols, activeLayer.value.gridRows);
	};

	const setRows = (rows: number) => {
		mangaStore.setActiveLayerGrid(activeLayer.value.gridCols, rows);
	};

	const setMargin = (side: PageMarginSide, eventValue: number) => {
		const layer = activeLayer.value;

		mangaStore.setActiveLayerMargins({
			marginTop: layer.marginTop,
			marginRight: layer.marginRight,
			marginBottom: layer.marginBottom,
			marginLeft: layer.marginLeft,
			[side]: eventValue,
		});
	};

	const setStrokeWidth = (width: number) => {
		if (!Number.isFinite(width)) {
			return;
		}

		mangaStore.setActiveLayerStrokeWidth(width);
	};

	return {
		setCols,
		setRows,
		setMargin,
		setStrokeWidth,
	};
};
