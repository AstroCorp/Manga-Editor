import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PageThumb from '@/components/page/PageThumb.vue';

const mountThumb = (canRemove = true) => {
	return mount(PageThumb, {
		props: {
			name: 'Page 1',
			active: true,
			index: 0,
			canRemove,
			width: 1720,
			height: 2580,
			shapes: [],
			texts: [],
		},
		global: {
			stubs: {
				Icon: true,
				PagePreview: true,
			},
		},
	});
};

describe('PageThumb', () => {
	it('selects and deletes the page', async () => {
		const wrapper = mountThumb();

		await wrapper.get('button[aria-label="Select Page 1"]').trigger('click');
		await wrapper.get('button[aria-label="Delete Page 1"]').trigger('click');

		expect(wrapper.emitted('select')).toHaveLength(1);
		expect(wrapper.emitted('remove')).toHaveLength(1);
	});

	it('renames on blur and cancels with Escape', async () => {
		const wrapper = mountThumb(false);

		await wrapper.get('button[title="Page 1"]').trigger('dblclick');

		const input = wrapper.get('input[aria-label="Name of Page 1"]');

		await input.setValue('Splash');
		await input.trigger('blur');

		expect(wrapper.emitted('rename')?.at(-1)).toEqual(['Splash']);

		await wrapper.get('button[title="Page 1"]').trigger('dblclick');
		await wrapper.get('input[aria-label="Name of Page 1"]').trigger('keydown', {
			key: 'Escape',
		});

		expect(wrapper.emitted('rename')).toHaveLength(1);
		expect(wrapper.find('input').exists()).toBe(false);
	});

	it('does not start a drag while the name is being edited', async () => {
		const wrapper = mountThumb(false);

		await wrapper.get('button[title="Page 1"]').trigger('dblclick');

		const event = new Event('dragstart', { cancelable: true });

		await wrapper.get('div').trigger('dragstart', { event });

		expect(wrapper.emitted('dragstart')).toBeUndefined();
	});
});
