import { watch } from 'vue';
import type { ContentResetDeps } from '@/types/page';

/** Unifica wipe de contenido al cambiar tamaño/rejilla/márgenes. */
export const usePageContentReset = ({
	contentResetEpoch,
	applyReset,
	discardSelection,
}: ContentResetDeps) => {
	watch(contentResetEpoch, () => {
		discardSelection?.();
		applyReset();
	});
};
