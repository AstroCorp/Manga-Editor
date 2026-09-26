import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TextAlignSelect from '@/features/text-color/components/TextAlignSelect.vue';

describe('TextAlignSelect', () => {
	it('shows only the icon in the trigger and labelled options in the menu', async () => {
		const wrapper = mount(TextAlignSelect, {
			props: {
				modelValue: 'center',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});
		const trigger = wrapper.get('button[aria-label="Text align"]');

		expect(trigger.text()).toBe('');
		expect(trigger.attributes('title')).toBe('Text align');

		await trigger.trigger('click');

		const options = wrapper.findAll('ul[role="listbox"] button');

		expect(options).toHaveLength(7);
		expect(options[0]?.text()).toBe('Left');
		expect(options[2]?.text()).toBe('Right');
		expect(options[0]?.find('svg[aria-hidden="true"]').exists()).toBe(true);
	});

	it('emits update:modelValue when an option is chosen', async () => {
		const wrapper = mount(TextAlignSelect, {
			props: {
				modelValue: 'left',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Text align"]').trigger('click');

		const justify = wrapper.findAll('ul[role="listbox"] button').find((node) => {
			return node.text() === 'Justify center';
		});

		await justify!.trigger('click');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
			'justify-center',
		]);
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);
	});
});
