import { describe, expect, it, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ProjectNameField from '@/components/toolbar/ProjectNameField.vue';
import { useMangaStore } from '@/stores/manga';

describe('ProjectNameField', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('commits a trimmed project name and restores an empty draft', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const mangaStore = useMangaStore();
		const wrapper = mount(ProjectNameField, {
			global: { plugins: [pinia] },
		});
		const input = wrapper.get('input[aria-label="Project name"]');

		expect((input.element as HTMLInputElement).value).toBe('Untitled');

		await input.setValue('  Mi Proyecto  ');
		await input.trigger('blur');

		expect(mangaStore.title).toBe('Mi Proyecto');

		await input.trigger('focus');
		await input.setValue('   ');
		await input.trigger('keydown', { key: 'Enter' });

		expect(mangaStore.title).toBe('Mi Proyecto');
		expect((input.element as HTMLInputElement).value).toBe('Mi Proyecto');
	});
});
