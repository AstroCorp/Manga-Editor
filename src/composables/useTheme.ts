import { createSharedComposable, useColorMode } from '@vueuse/core';
import { THEME_PREFERENCE } from '@/lib/editor/editorEnums';
import type { ThemePreference } from '@/types/editor';

export const useTheme = createSharedComposable(() => {
	const mode = useColorMode({
		attribute: 'class',
		storageKey: 'manga-editor-color-mode',
		initialValue: THEME_PREFERENCE.Auto,
	});

	const setPreference = (preference: ThemePreference) => {
		mode.value = preference;
	};

	return {
		preference: mode.store,
		setPreference,
	};
});
