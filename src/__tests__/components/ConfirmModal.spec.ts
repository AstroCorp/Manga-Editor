import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmModal from '@/components/ConfirmModal.vue';

describe('ConfirmModal', () => {
	it('emits cancel from the backdrop and confirm from the danger action', async () => {
		const wrapper = mount(ConfirmModal, {
			props: {
				title: 'Delete page',
				message: 'This cannot be undone.',
			},
			attachTo: document.body,
		});
		const title = document.body.querySelector('#confirm-modal-title');
		const confirm = document.body.querySelector(
			'button[data-confirm="danger"]',
		);
		const close = document.body.querySelector('button[aria-label="Close"]');

		expect(title?.textContent).toBe('Delete page');
		expect(confirm?.textContent).toBe('Delete');

		close?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		confirm?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('cancel')).toHaveLength(1);
		expect(wrapper.emitted('confirm')).toHaveLength(1);

		wrapper.unmount();
	});

	it('uses custom action labels', () => {
		const wrapper = mount(ConfirmModal, {
			props: {
				title: 'New project',
				message: 'Replace the current document.',
				confirmLabel: 'Replace',
				cancelLabel: 'Keep',
			},
			attachTo: document.body,
		});

		expect(
			document.body.querySelector('button[data-confirm="danger"]')?.textContent,
		).toBe('Replace');
		expect(document.body.textContent).toContain('Keep');
		wrapper.unmount();
	});
});
