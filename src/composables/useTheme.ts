import { createSharedComposable, useColorMode } from '@vueuse/core';
import type { ThemePreference } from '@/types/editor';

export const useTheme = createSharedComposable(() => {
	const mode = useColorMode({
		attribute: 'class',
		storageKey: 'manga-editor-color-mode',
		initialValue: 'auto',
	});

	const setPreference = (preference: ThemePreference) => {
		mode.value = preference;
	};

	return {
		preference: mode.store,
		resolved: mode.state,
		setPreference,
	};
});
