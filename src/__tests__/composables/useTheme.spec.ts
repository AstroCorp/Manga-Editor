import { beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useTheme } from '@/composables/useTheme';
import { THEME_PREFERENCE } from '@/lib/editor/editorEnums';

describe('useTheme', () => {
	beforeEach(() => {
		localStorage.removeItem('manga-editor-color-mode');
		document.documentElement.classList.remove('dark', 'light');
		useTheme().setPreference(THEME_PREFERENCE.Auto);
	});

	it('stores the preference, applies the class and shares it between callers', async () => {
		const Host = defineComponent({
			setup() {
				return useTheme();
			},
			template: '<div />',
		});
		const wrapper = mount(Host);

		wrapper.vm.setPreference(THEME_PREFERENCE.Dark);
		await nextTick();

		expect(wrapper.vm.preference).toBe(THEME_PREFERENCE.Dark);
		expect(useTheme().preference.value).toBe(THEME_PREFERENCE.Dark);
		expect(document.documentElement.classList.contains('dark')).toBe(true);
		expect(localStorage.getItem('manga-editor-color-mode')).toBe('dark');

		wrapper.unmount();
	});
});
