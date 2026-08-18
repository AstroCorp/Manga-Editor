import { describe, expect, it, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ExportActions from '@/components/toolbar/ExportActions.vue';
import { EXPORT_IMAGE_FORMAT } from '@/lib/editor/editorEnums';
import { useEditorStore } from '@/stores/editor';

describe('ExportActions', () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});

	it('lists current-page and zip download options', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const wrapper = mount(ExportActions, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		await wrapper.get('button[aria-label="Download"]').trigger('click');

		const items = wrapper.findAll('[role="menuitem"]');

		expect(items.map((item) => item.text())).toEqual([
			'PNG (current page)',
			'JPG (current page)',
			'ZIP with PNGs (all pages)',
			'ZIP with JPGs (all pages)',
		]);

		wrapper.unmount();
	});

	it('exports the current page as PNG', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const editorStore = useEditorStore();
		const exportPage = vi
			.spyOn(editorStore, 'exportPage')
			.mockImplementation(() => undefined);

		const wrapper = mount(ExportActions, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		await wrapper.get('button[aria-label="Download"]').trigger('click');
		await wrapper.get('[role="menuitem"]').trigger('click');

		expect(exportPage).toHaveBeenCalledExactlyOnceWith(
			EXPORT_IMAGE_FORMAT.Png,
		);
		expect(wrapper.find('[role="menu"]').exists()).toBe(false);

		wrapper.unmount();
	});

	it('exports a zip of all pages as JPG', async () => {
		const pinia = createPinia();

		setActivePinia(pinia);

		const editorStore = useEditorStore();
		const exportPagesZip = vi
			.spyOn(editorStore, 'exportPagesZip')
			.mockResolvedValue(undefined);

		const wrapper = mount(ExportActions, {
			global: {
				plugins: [pinia],
				stubs: { Icon: true },
			},
		});

		await wrapper.get('button[aria-label="Download"]').trigger('click');
		await wrapper.findAll('[role="menuitem"]')[3]!.trigger('click');

		expect(exportPagesZip).toHaveBeenCalledExactlyOnceWith(
			EXPORT_IMAGE_FORMAT.Jpeg,
		);
		expect(wrapper.find('[role="menu"]').exists()).toBe(false);

		wrapper.unmount();
	});
});
