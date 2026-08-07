import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TextColorToolbar from '@/features/text-color/components/TextColorToolbar.vue';

const baseProps = {
	colors: ['#112233'],
	strokeColors: ['#000000'],
	bold: false,
	italic: false,
	underline: false,
	linethrough: false,
	fontSize: 24 as number | null,
	dominantFontSize: 24,
	fontFamily: 'Arial' as string | null,
	dominantFontFamily: 'Arial',
	strokeWidth: 0 as number | null,
	dominantStrokeWidth: 0,
	lineHeight: 1.16 as number | null,
	dominantLineHeight: 1.16,
	textAlign: 'left' as const,
	hasBox: false,
	boxFill: '#ffffff',
	boxStroke: '#000000',
	boxStrokeWidth: 2,
	boxCornerRadius: 8,
	boxPadding: 12,
	boxWidth: 224,
	boxHeight: 48,
	boxVerticalAlign: 'middle' as const,
	left: 100,
	top: 50,
	placement: 'above' as const,
};

describe('TextColorToolbar', () => {
	it('emits setFontSize from spinner buttons', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper
			.get('button[aria-label="Increase font size"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([25]);

		await wrapper
			.get('button[aria-label="Decrease font size"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([23]);
	});

	it('emits setFontSize from the number input value', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Font size"]');

		await input.setValue('36');
		await input.trigger('input');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([36]);
	});

	it('ignores out-of-range font size while typing', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Font size"]');

		await input.setValue('3');
		await input.trigger('input');

		expect(wrapper.emitted('setFontSize')).toBeUndefined();
	});

	it('emits format toggles and color changes', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				bold: true,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Bold"]').trigger('click');
		await wrapper.get('button[aria-label="Italic"]').trigger('click');
		await wrapper.get('button[aria-label="Underline"]').trigger('click');
		await wrapper.get('button[aria-label="Strikethrough"]').trigger('click');
		await wrapper.get('input[aria-label="Text color"]').setValue('#ff0000');
		await wrapper.get('input[aria-label="Text color"]').trigger('input');

		expect(wrapper.emitted('toggleBold')).toHaveLength(1);
		expect(wrapper.emitted('toggleItalic')).toHaveLength(1);
		expect(wrapper.emitted('toggleUnderline')).toHaveLength(1);
		expect(wrapper.emitted('toggleLinethrough')).toHaveLength(1);
		expect(wrapper.emitted('setColor')?.at(-1)).toEqual(['#ff0000']);
		expect(wrapper.get('button[aria-label="Bold"]').attributes('aria-pressed')).toBe(
			'true',
		);
	});

	it('commits font size on blur and Enter', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Font size"]');

		await input.setValue('40');
		await input.trigger('change');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([40]);

		await input.setValue('42');
		await input.trigger('keydown', { key: 'Enter' });

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([42]);
	});

	it('reverts the draft when committing mix without a new value', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				fontSize: null,
				dominantFontSize: 18,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Font size (mixed)"]');

		await input.setValue('mix');
		await input.trigger('blur');

		expect((input.element as HTMLInputElement).value).toBe('mix');
		expect(wrapper.emitted('setFontSize')).toBeUndefined();
	});

	it('clamps font size nudges to min and max', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				fontSize: 9,
				dominantFontSize: 9,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper
			.get('button[aria-label="Decrease font size"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([8]);

		await wrapper.setProps({ fontSize: 199, dominantFontSize: 199 });
		await wrapper
			.get('button[aria-label="Increase font size"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([200]);
	});

	it('renders a multi-color swatch background', () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				colors: ['#ff0000', '#00ff00'],
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const swatch = wrapper.get('span[aria-hidden="true"]');

		expect(swatch.attributes('style')).toContain('conic-gradient');
	});

	it('places the toolbar below without the above translate class', () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				placement: 'below',
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.get('[role="toolbar"]').classes()).not.toContain(
			'-translate-y-full',
		);
	});

	it('shows mix and nudges from the dominant font size', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				fontSize: null,
				dominantFontSize: 18,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Font size (mixed)"]');

		expect((input.element as HTMLInputElement).value).toBe('mix');

		await wrapper
			.get('button[aria-label="Increase font size"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setFontSize')?.at(-1)).toEqual([19]);
	});

	it('replaces mix with the dominant size on focus', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				fontSize: null,
				dominantFontSize: 22,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Font size (mixed)"]');

		await input.trigger('focus');

		expect((input.element as HTMLInputElement).value).toBe('22');
	});

	it('hides when position is missing', () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				left: null,
				top: null,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.find('[role="toolbar"]').exists()).toBe(false);
	});

	it('emits stroke color and stroke width changes', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const strokeInput = wrapper.get('input[aria-label="Stroke color"]');
		const strokeEl = strokeInput.element as HTMLInputElement;

		strokeEl.value = '#00ff00';
		await strokeInput.trigger('input');
		await wrapper
			.get('button[aria-label="Increase stroke width"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setStrokeColor')?.at(-1)).toEqual(['#00ff00']);
		expect(wrapper.emitted('setStrokeWidth')?.at(-1)).toEqual([1]);
	});

	it('emits deleteText from the delete button', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Delete text"]').trigger('click');

		expect(wrapper.emitted('deleteText')).toHaveLength(1);
	});

	it('emits setTextAlign from the custom align menu', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Text align"]').trigger('click');

		const justifyRight = wrapper.findAll('ul[role="listbox"] button').find((node) => {
			return node.text().includes('Justify right');
		});

		expect(justifyRight).toBeTruthy();
		await justifyRight!.trigger('click');

		expect(wrapper.emitted('setTextAlign')?.at(-1)).toEqual(['justify-right']);
	});

	it('opens the align menu when clicking the trigger', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(false);

		await wrapper.get('button[aria-label="Text align"]').trigger('click');

		expect(wrapper.find('ul[role="listbox"]').exists()).toBe(true);
	});

	it('emits alignToPage from the page align select', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper.get('button[aria-label="Align to page"]').trigger('click');

		const center = wrapper.findAll('ul[role="listbox"] button').find((node) => {
			return node.text().trim() === 'Center';
		});

		expect(center).toBeTruthy();
		await center!.trigger('click');

		expect(wrapper.emitted('alignToPage')?.at(-1)).toEqual(['middle-center']);
	});

	it('shows mix for stroke width and nudges from dominant', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				strokeWidth: null,
				dominantStrokeWidth: 3,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Stroke width (mixed)"]');

		expect((input.element as HTMLInputElement).value).toBe('mix');

		await wrapper
			.get('button[aria-label="Increase stroke width"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setStrokeWidth')?.at(-1)).toEqual([4]);
	});

	it('emits setLineHeight from spinner buttons', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		await wrapper
			.get('button[aria-label="Increase line height"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setLineHeight')?.at(-1)).toEqual([1.26]);

		await wrapper
			.get('button[aria-label="Decrease line height"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setLineHeight')?.at(-1)).toEqual([1.06]);
	});

	it('shows mix for line height and nudges from dominant', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				lineHeight: null,
				dominantLineHeight: 1.5,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		const input = wrapper.get('input[aria-label="Line height (mixed)"]');

		expect((input.element as HTMLInputElement).value).toBe('mix');

		await wrapper
			.get('button[aria-label="Increase line height"]')
			.trigger('pointerdown');

		expect(wrapper.emitted('setLineHeight')?.at(-1)).toEqual([1.6]);
	});

	it('emits box style updates when hasBox is true', async () => {
		const wrapper = mount(TextColorToolbar, {
			props: {
				...baseProps,
				hasBox: true,
			},
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.get('[aria-label="Box format"]').exists()).toBe(true);
		expect(wrapper.get('[aria-label="Text format"]').exists()).toBe(true);

		await wrapper.get('input[aria-label="Box fill"]').setValue('#ff0000');
		expect(wrapper.emitted('setBoxFill')?.at(-1)).toEqual(['#ff0000']);

		await wrapper.get('input[aria-label="Corner radius"]').setValue('20');
		await wrapper.get('input[aria-label="Corner radius"]').trigger('change');

		expect(wrapper.emitted('setBoxCornerRadius')?.at(-1)).toEqual([20]);
	});

	it('hides the box toolbar when hasBox is false', () => {
		const wrapper = mount(TextColorToolbar, {
			props: baseProps,
			global: {
				stubs: {
					Icon: true,
				},
			},
		});

		expect(wrapper.find('[aria-label="Box format"]').exists()).toBe(false);
		expect(wrapper.get('[aria-label="Text format"]').exists()).toBe(true);
	});
});
