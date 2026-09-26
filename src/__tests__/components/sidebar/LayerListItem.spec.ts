import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import LayerListItem from '@/components/sidebar/LayerListItem.vue';
import { Shape } from '@/models/Shape';
import { TextBlock } from '@/models/TextBlock';

const triangle = [
	{ x: 0, y: 0 },
	{ x: 10, y: 0 },
	{ x: 10, y: 10 },
];

const mountItem = () => {
	const shape = Shape.create(triangle, 2);
	const text = TextBlock.create(0, 0);

	text.applyPatch({ content: 'CASE' });

	const wrapper = mount(LayerListItem, {
		props: {
			name: 'Layer 1',
			active: true,
			visible: true,
			canRemove: true,
			width: 800,
			height: 600,
			shapes: [shape],
			texts: [text],
			expanded: true,
			focusedKind: null,
			focusedId: null,
		},
		global: {
			stubs: {
				Icon: true,
				PagePreview: true,
			},
		},
	});

	return { wrapper, shape, text };
};

describe('LayerListItem', () => {
	it('emits layer actions and element actions', async () => {
		const { wrapper, shape, text } = mountItem();

		await wrapper.get('button[aria-label="Collapse elements"]').trigger('click');
		await wrapper.get('button[aria-label="Hide layer"]').trigger('click');
		await wrapper.get('button[aria-label="Delete Layer 1"]').trigger('click');
		await wrapper.get('button[aria-label="Select CASE"]').trigger('click');
		await wrapper
			.get('button[aria-label="Show options for Panel 1"]')
			.trigger('click');
		await wrapper.get('button[aria-label="Delete Panel 1"]').trigger('click');

		expect(wrapper.emitted('toggleExpand')).toHaveLength(1);
		expect(wrapper.emitted('toggleVisible')).toHaveLength(1);
		expect(wrapper.emitted('remove')).toHaveLength(1);
		expect(wrapper.emitted('focusElement')?.[0]).toEqual(['text', text.id]);
		expect(wrapper.emitted('showOptions')?.[0]).toEqual(['shape', shape.id]);
		expect(wrapper.emitted('deleteElement')?.[0]).toEqual(['shape', shape.id]);
	});

	it('shows an empty state and renames the layer', async () => {
		const wrapper = mount(LayerListItem, {
			props: {
				name: 'Layer 1',
				active: false,
				visible: false,
				canRemove: false,
				width: 800,
				height: 600,
				shapes: [],
				texts: [],
				expanded: true,
				focusedKind: null,
				focusedId: null,
			},
			global: {
				stubs: { Icon: true, PagePreview: true },
			},
		});

		expect(wrapper.get('p').text()).toBe('No elements');
		expect(wrapper.get('button[aria-label="Show layer"]').exists()).toBe(true);

		const nameButton = wrapper
			.findAll('button')
			.find((button) => button.text() === 'Layer 1');

		await nameButton!.trigger('dblclick');
		const input = wrapper.get('input[aria-label="Name of Layer 1"]');

		await input.setValue('Inks');
		await input.trigger('keydown', { key: 'Enter' });
		await input.trigger('blur');

		expect(wrapper.emitted('rename')?.at(-1)).toEqual(['Inks']);
	});
});
