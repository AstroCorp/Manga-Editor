import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PageThumb from '@/components/page/PageThumb.vue';

const mountThumb = (canRemove = true, pageCount = 1) => {
	return mount(PageThumb, {
		props: {
			active: true,
			index: 0,
			pageCount,
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

		expect(wrapper.text()).toContain('1');
		expect(wrapper.find('input').exists()).toBe(false);

		await wrapper.get('button[aria-label="Select Page 1"]').trigger('click');
		await wrapper.get('button[aria-label="Delete Page 1"]').trigger('click');

		expect(wrapper.emitted('select')).toHaveLength(1);
		expect(wrapper.emitted('remove')).toHaveLength(1);
	});

	it('starts a drag from the thumb', async () => {
		const wrapper = mountThumb(false);

		await wrapper.get('div').trigger('dragstart');

		expect(wrapper.emitted('dragstart')).toHaveLength(1);
	});

	it('pads the page number to the width of the page count', () => {
		const wrapper = mountThumb(false, 12);

		expect(wrapper.text()).toContain('01');
		expect(wrapper.get('button[aria-label="Select Page 01"]').exists()).toBe(
			true,
		);
	});
});
