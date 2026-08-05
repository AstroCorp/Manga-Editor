import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CustomSelect from '@/components/ui/CustomSelect.vue';

const OPTIONS = [
	{ value: 'a', label: 'Alpha', icon: 'fluent:circle-24-regular' },
	{ value: 'b', label: 'Beta' },
	{ value: 'c', label: 'Gamma' },
] as const;

describe('CustomSelect', () => {
	it('shows the selected label and opens options', async () => {
		const wrapper = mount(CustomSelect, {
			props: {
				modelValue: 'b',
				options: [...OPTIONS],
				label: 'Pick letter',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.get('button[aria-label="Pick letter"]').text()).toContain(
			'Beta',
		);

		await wrapper.get('button[aria-label="Pick letter"]').trigger('click');

		const options = wrapper.findAll('ul[role="listbox"] button');

		expect(options).toHaveLength(3);
		expect(options[0]?.text()).toContain('Alpha');
		expect(options[2]?.text()).toContain('Gamma');
	});

	it('emits update:modelValue when an option is chosen', async () => {
		const wrapper = mount(CustomSelect, {
			props: {
				modelValue: 'a',
				options: [...OPTIONS],
				label: 'Pick letter',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Pick letter"]').trigger('click');
		await wrapper.findAll('ul[role="listbox"] button')[2]!.trigger('click');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['c']);
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);
	});

	it('closes on Escape', async () => {
		const wrapper = mount(CustomSelect, {
			props: {
				modelValue: 'a',
				options: [...OPTIONS],
				label: 'Pick letter',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Pick letter"]').trigger('click');
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true);

		await wrapper.get('ul[role="listbox"]').trigger('keydown', {
			key: 'Escape',
		});

		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);
	});
});
