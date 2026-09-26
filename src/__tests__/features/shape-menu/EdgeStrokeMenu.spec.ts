import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import EdgeStrokeMenu from '@/features/shape-menu/components/EdgeStrokeMenu.vue';

const strokes = [
	{ width: 2, color: '#111111' },
	{ width: 5, color: '#ff0000' },
	{ width: 0, color: '#00ff00' },
];

describe('EdgeStrokeMenu', () => {
	it('opens a scrollable list with one row per edge', async () => {
		const wrapper = mount(EdgeStrokeMenu, {
			props: { strokes },
		});

		expect(wrapper.find('[data-testid="edge-stroke-list"]').exists()).toBe(
			false,
		);

		await wrapper.get('button[aria-label="Edge strokes"]').trigger('click');

		const list = wrapper.get('[data-testid="edge-stroke-list"]');

		expect(list.classes()).toContain('overflow-y-auto');
		expect(list.findAll('li')).toHaveLength(3);
		expect(list.text()).toContain('Edge 1');
		expect(list.text()).toContain('Edge 3');
		expect(
			wrapper.get('input[aria-label="Edge 2 color"]').attributes('value'),
		).toBe('#ff0000');
		expect(
			wrapper.get('button[aria-label="Edge strokes"]').attributes('aria-expanded'),
		).toBe('true');
	});

	it('lists every edge when embedded in the element panel', () => {
		const wrapper = mount(EdgeStrokeMenu, {
			props: { strokes, embedded: true },
		});

		expect(wrapper.find('button[aria-label="Edge strokes"]').exists()).toBe(
			false,
		);
		expect(wrapper.get('[data-testid="edge-stroke-list"]').findAll('li')).toHaveLength(
			3,
		);
	});

	it('opens downward from the toolbar button', async () => {
		const wrapper = mount(EdgeStrokeMenu, {
			props: { strokes },
		});

		await wrapper.get('button[aria-label="Edge strokes"]').trigger('click');

		const menu = wrapper.get('[role="group"]');

		expect(menu.classes()).toContain('top-full');
		expect(menu.classes()).not.toContain('bottom-full');
	});

	it('emits preview on color input and definitive changes on change/width', async () => {
		const wrapper = mount(EdgeStrokeMenu, {
			props: { strokes },
		});

		await wrapper.get('button[aria-label="Edge strokes"]').trigger('click');

		const color = wrapper.get('input[aria-label="Edge 2 color"]');

		// setValue dispara `input` y `change`, como el picker nativo al cerrarse.
		await color.setValue('#0000ff');

		expect(wrapper.emitted('previewEdgeStroke')).toEqual([
			[1, { color: '#0000ff' }],
		]);
		expect(wrapper.emitted('setEdgeStroke')).toEqual([[1, { color: '#0000ff' }]]);

		const width = wrapper.get('input[aria-label="Edge 3 width"]');

		await width.setValue('4');
		await width.trigger('blur');

		expect(wrapper.emitted('setEdgeStroke')?.at(-1)).toEqual([2, { width: 4 }]);
	});

	it('highlights the hovered row and clears it when the pointer leaves', async () => {
		const wrapper = mount(EdgeStrokeMenu, {
			props: { strokes },
		});

		await wrapper.get('button[aria-label="Edge strokes"]').trigger('click');

		const rows = wrapper.get('[data-testid="edge-stroke-list"]').findAll('li');

		await rows[1]?.trigger('mouseenter');

		expect(wrapper.emitted('hoverEdge')?.at(-1)).toEqual([1]);
		expect(rows[1]?.classes()).toContain('bg-blue-50');

		await wrapper.get('[data-testid="edge-stroke-list"]').trigger('mouseleave');

		expect(wrapper.emitted('hoverEdge')?.at(-1)).toEqual([null]);
		expect(rows[1]?.classes()).not.toContain('bg-blue-50');
	});

	it('clears the highlight when the menu closes', async () => {
		const wrapper = mount(EdgeStrokeMenu, {
			props: { strokes },
		});
		const trigger = wrapper.get('button[aria-label="Edge strokes"]');

		await trigger.trigger('click');
		await wrapper
			.get('[data-testid="edge-stroke-list"]')
			.findAll('li')[0]
			?.trigger('mouseenter');
		await trigger.trigger('click');

		expect(wrapper.emitted('hoverEdge')?.at(-1)).toEqual([null]);
		expect(wrapper.find('[data-testid="edge-stroke-list"]').exists()).toBe(
			false,
		);
	});
});
