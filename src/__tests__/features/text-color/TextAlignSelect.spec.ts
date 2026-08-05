import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TextAlignSelect from '@/features/text-color/components/TextAlignSelect.vue';

describe('TextAlignSelect', () => {
	it('shows the current alignment label and opens styled options', async () => {
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

		expect(wrapper.get('button[aria-label="Text align"]').text()).toContain(
			'Center',
		);

		await wrapper.get('button[aria-label="Text align"]').trigger('click');

		const options = wrapper.findAll('ul[role="listbox"] button');

		expect(options).toHaveLength(7);
		expect(options[0]?.text()).toContain('Left');
		expect(options[2]?.text()).toContain('Right');
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
			return node.text().includes('Justify center');
		});

		await justify!.trigger('click');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([
			'justify-center',
		]);
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);
	});
});
