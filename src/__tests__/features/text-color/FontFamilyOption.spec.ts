import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import FontFamilyOption from '@/features/text-color/components/FontFamilyOption.vue';
import type { EditorFontFamily } from '@/types/fonts';

const font: EditorFontFamily = {
	id: 'bangers',
	family: 'Bangers',
	weights: [400],
	styles: ['normal'],
	variable: false,
	previewUrl: 'https://example.test/bangers.png',
};

const mountOption = (
	props: Partial<{
		favorite: boolean;
		previewLoaded: boolean;
		previewFailed: boolean;
		font: EditorFontFamily;
	}> = {},
) => {
	return mount(FontFamilyOption, {
		props: {
			font,
			selected: true,
			favorite: false,
			previewLoaded: false,
			previewFailed: false,
			...props,
		},
	});
};

describe('FontFamilyOption', () => {
	it('selects the family and toggles the favorite without selecting', async () => {
		const wrapper = mountOption();

		await wrapper.get('button[title="Bangers"]').trigger('click');
		await wrapper
			.get('button[aria-label="Add Bangers to favorites"]')
			.trigger('click');

		expect(wrapper.emitted('select')).toEqual([['Bangers']]);
		expect(wrapper.emitted('toggleFavorite')).toEqual([['bangers']]);
		expect(wrapper.get('li').attributes('aria-selected')).toBe('true');
	});

	it('reports preview load and falls back to the family name', async () => {
		const wrapper = mountOption();
		const image = wrapper.get('img');

		await image.trigger('load');
		await image.trigger('error');

		expect(wrapper.emitted('previewLoad')).toEqual([['bangers']]);
		expect(wrapper.emitted('previewError')).toEqual([['bangers']]);

		await wrapper.setProps({ previewFailed: true });

		expect(wrapper.find('img').exists()).toBe(false);
		expect(wrapper.text()).toContain('Bangers');
		expect(
			wrapper.get('button[aria-label="Add Bangers to favorites"]').attributes(
				'aria-pressed',
			),
		).toBe('false');
	});

	it('marks a favorite star as pressed', () => {
		const wrapper = mountOption({
			favorite: true,
			font: { ...font, previewUrl: undefined },
		});

		expect(
			wrapper
				.get('button[aria-label="Remove Bangers from favorites"]')
				.attributes('aria-pressed'),
		).toBe('true');
		expect(wrapper.find('img').exists()).toBe(false);
	});
});
