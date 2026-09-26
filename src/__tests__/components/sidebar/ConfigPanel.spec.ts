import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ConfigPanel from '@/components/sidebar/ConfigPanel.vue';
import { useMangaStore } from '@/stores/manga';

const mountPanel = () => {
	const pinia = createPinia();

	setActivePinia(pinia);

	return mount(ConfigPanel, {
		global: {
			plugins: [pinia],
			stubs: {
				Icon: true,
			},
		},
	});
};

describe('ConfigPanel', () => {
	it('edits the background color of the active page only', async () => {
		const wrapper = mountPanel();
		const mangaStore = useMangaStore();
		const firstId = mangaStore.activePageId;

		mangaStore.addPage();
		await wrapper.vm.$nextTick();

		expect(wrapper.get('[data-testid="page-background-value"]').text()).toBe(
			'#ffffff',
		);

		await wrapper
			.get('input[aria-label="Page background color"]')
			.setValue('#336699');

		expect(mangaStore.activePage.backgroundColor).toBe('#336699');
		expect(wrapper.get('[data-testid="page-background-value"]').text()).toBe(
			'#336699',
		);
		expect(
			mangaStore.pages.find((page) => {
				return page.id === firstId;
			})?.backgroundColor,
		).toBe('#ffffff');

		wrapper.unmount();
	});
});
