import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import PageAlignSelect from '@/features/text-color/components/PageAlignSelect.vue';

describe('PageAlignSelect', () => {
	it('opens a select list and emits align without keeping a selection', async () => {
		const wrapper = mount(PageAlignSelect, {
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const trigger = wrapper.get('button[aria-label="Align to page"]');

		expect(trigger.text()).toContain('Page align');
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);

		await trigger.trigger('click');

		const options = wrapper.findAll('ul[role="listbox"] button');

		expect(options).toHaveLength(9);
		expect(options[0]?.text()).toContain('Top left');

		const bottomRight = options.find((node) => {
			return node.text().includes('Bottom right');
		});

		await bottomRight!.trigger('click');

		expect(wrapper.emitted('align')?.at(-1)).toEqual(['bottom-right']);
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);
		expect(trigger.text()).toContain('Page align');
		expect(trigger.text()).not.toContain('Bottom right');
	});
});
