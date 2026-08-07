import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FontFamilySelect from '@/features/text-color/components/FontFamilySelect.vue';

vi.mock('@/lib/fonts/googleFontsCatalog', async (importOriginal) => {
	const actual =
		await importOriginal<typeof import('@/lib/fonts/googleFontsCatalog')>();

	return {
		...actual,
		getEditorFontCatalog: async () => {
			return [
				{
					id: 'inter',
					family: 'Inter',
					weights: [400],
					styles: ['normal' as const],
					variable: false,
					category: 'sans-serif',
					previewUrl:
						'https://s.w.org/images/fonts/wp-7.0/previews/inter/inter.svg',
				},
				{
					id: 'roboto',
					family: 'Roboto',
					weights: [400],
					styles: ['normal' as const],
					variable: false,
					category: 'sans-serif',
					previewUrl:
						'https://s.w.org/images/fonts/wp-7.0/previews/roboto/roboto.svg',
				},
			];
		},
	};
});

describe('FontFamilySelect', () => {
	it('shows the current family and emits on select', async () => {
		const wrapper = mount(FontFamilySelect, {
			props: {
				modelValue: 'Inter',
				dominantFontFamily: 'Inter',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.get('button[aria-label="Font family"]').text()).toContain(
			'Inter',
		);

		await wrapper.get('button[aria-label="Font family"]').trigger('click');
		await wrapper.vm.$nextTick();

		const robotoImg = wrapper.get('ul[role="listbox"] img[alt="Roboto"]');
		expect(robotoImg.attributes('src')).toContain('/roboto/roboto.svg');

		const robotoButton = wrapper
			.findAll('ul[role="listbox"] button')
			.find((node) => {
				return node.find('img[alt="Roboto"]').exists();
			});

		await robotoButton!.trigger('click');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Roboto']);
	});

	it('shows mix when modelValue is null', () => {
		const wrapper = mount(FontFamilySelect, {
			props: {
				modelValue: null,
				dominantFontFamily: 'Roboto',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.get('button[aria-label="Font family"]').text()).toContain(
			'mix',
		);
	});

	it('filters fonts by search query', async () => {
		const wrapper = mount(FontFamilySelect, {
			props: {
				modelValue: 'Inter',
				dominantFontFamily: 'Inter',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Font family"]').trigger('click');
		await wrapper.vm.$nextTick();

		const search = wrapper.get('input[aria-label="Search fonts"]');
		await search.setValue('robo');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('img[alt="Roboto"]').exists()).toBe(true);
		expect(wrapper.find('img[alt="Inter"]').exists()).toBe(false);

		await search.setValue('zzz');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('ul[role="listbox"]').text()).toContain(
			'No fonts found',
		);
	});

	it('shows a skeleton until the preview image loads', async () => {
		const wrapper = mount(FontFamilySelect, {
			props: {
				modelValue: 'Inter',
				dominantFontFamily: 'Inter',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Font family"]').trigger('click');
		await wrapper.vm.$nextTick();

		const robotoImg = wrapper.get('ul[role="listbox"] img[alt="Roboto"]');
		expect(robotoImg.classes()).toContain('opacity-0');
		expect(
			robotoImg.element.previousElementSibling?.classList.contains(
				'animate-pulse',
			),
		).toBe(true);

		await robotoImg.trigger('load');
		await wrapper.vm.$nextTick();

		expect(robotoImg.classes()).toContain('opacity-100');
		expect(robotoImg.element.previousElementSibling).toBeNull();
	});
});
