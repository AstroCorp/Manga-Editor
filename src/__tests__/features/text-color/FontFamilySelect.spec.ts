import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { useFavoriteFonts } from '@/composables/fonts/useFavoriteFonts';
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

const mountOpen = async (
	modelValue: string | null = 'Inter',
	usedFontFamilies: string[] = [],
) => {
	const wrapper = mount(FontFamilySelect, {
		props: {
			modelValue,
			dominantFontFamily: 'Inter',
			usedFontFamilies,
		},
		global: {
			stubs: {
				Icon: true,
			},
		},
	});

	await wrapper.get('button[aria-label="Font family"]').trigger('click');
	await wrapper.vm.$nextTick();

	return wrapper;
};

describe('FontFamilySelect', () => {
	beforeEach(() => {
		useFavoriteFonts().favoriteFontIds.value = [];
	});

	it('pins favorites above the list and keeps them in the main list', async () => {
		const wrapper = await mountOpen();

		expect(
			wrapper.find('[data-testid="favorite-fonts-heading"]').exists(),
		).toBe(false);

		await wrapper
			.get('button[aria-label="Add Roboto to favorites"]')
			.trigger('click');
		await wrapper.vm.$nextTick();

		expect(useFavoriteFonts().favoriteFontIds.value).toEqual(['roboto']);
		expect(wrapper.emitted('update:modelValue')).toBeUndefined();
		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true);
		expect(
			wrapper.get('[data-testid="favorite-fonts-heading"]').text(),
		).toBe('Favorites');

		const pinned = wrapper.findAll('[data-testid="favorite-font-option"]');

		expect(pinned).toHaveLength(1);
		expect(pinned[0]?.find('img[alt="Roboto"]').exists()).toBe(true);
		expect(wrapper.findAll('img[alt="Roboto"]')).toHaveLength(2);

		const removeButtons = wrapper.findAll(
			'button[aria-label="Remove Roboto from favorites"]',
		);

		expect(removeButtons).toHaveLength(2);
		expect(removeButtons[1]?.attributes('aria-pressed')).toBe('true');

		await removeButtons[0]!.trigger('click');
		await wrapper.vm.$nextTick();

		expect(
			wrapper.find('[data-testid="favorite-fonts-heading"]').exists(),
		).toBe(false);
		expect(wrapper.findAll('img[alt="Roboto"]')).toHaveLength(1);
	});

	it('hides the pinned section while searching but keeps the star marked', async () => {
		useFavoriteFonts().favoriteFontIds.value = ['roboto'];
		const wrapper = await mountOpen();

		expect(
			wrapper.find('[data-testid="favorite-fonts-heading"]').exists(),
		).toBe(true);

		await wrapper.get('input[aria-label="Search fonts"]').setValue('rob');
		await wrapper.vm.$nextTick();

		expect(
			wrapper.find('[data-testid="favorite-fonts-heading"]').exists(),
		).toBe(false);
		expect(wrapper.findAll('img[alt="Roboto"]')).toHaveLength(1);
		expect(
			wrapper
				.get('button[aria-label="Remove Roboto from favorites"]')
				.attributes('aria-pressed'),
		).toBe('true');
	});

	it('lists document fonts in an "In use" section below favorites, hidden while searching', async () => {
		useFavoriteFonts().favoriteFontIds.value = ['inter'];
		const wrapper = await mountOpen('Inter', ['Roboto', 'Arial']);

		const headings = wrapper.findAll('li[role="presentation"]').filter((node) => {
			return node.text().length > 0;
		});

		expect(
			headings.map((node) => {
				return node.text();
			}),
		).toEqual(['Favorites', 'In use']);

		const used = wrapper.findAll('[data-testid="used-font-option"]');

		expect(used).toHaveLength(1);
		expect(used[0]?.find('img[alt="Roboto"]').exists()).toBe(true);
		expect(
			used[0]?.find('button[aria-label="Add Roboto to favorites"]').exists(),
		).toBe(true);

		await used[0]!.get('button[title="Roboto"]').trigger('click');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Roboto']);

		await wrapper.get('button[aria-label="Font family"]').trigger('click');
		await wrapper.vm.$nextTick();
		await wrapper.get('input[aria-label="Search fonts"]').setValue('rob');
		await wrapper.vm.$nextTick();

		expect(wrapper.find('[data-testid="used-fonts-heading"]').exists()).toBe(
			false,
		);
	});

	it('hides the "In use" section when no document font is in the catalog', async () => {
		const wrapper = await mountOpen('Inter', ['Arial']);

		expect(wrapper.find('[data-testid="used-fonts-heading"]').exists()).toBe(
			false,
		);
	});

	it('selecting a pinned favorite emits the family', async () => {
		useFavoriteFonts().favoriteFontIds.value = ['roboto'];
		const wrapper = await mountOpen();

		await wrapper
			.get('[data-testid="favorite-font-option"] button[title="Roboto"]')
			.trigger('click');

		expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['Roboto']);
	});

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
