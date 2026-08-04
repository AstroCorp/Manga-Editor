import { describe, it, expect, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { usePageContentReset } from '@/features/content-reset/usePageContentReset';

describe('usePageContentReset', () => {
	it('discards selection and reapplies on epoch bump', async () => {
		const contentResetEpoch = ref(0);
		const applyReset = vi.fn(async () => undefined);
		const discardSelection = vi.fn();
		const scope = effectScope();

		scope.run(() => {
			usePageContentReset({
				contentResetEpoch,
				applyReset,
				discardSelection,
			});
		});

		contentResetEpoch.value = 1;
		await nextTick();

		expect(discardSelection).toHaveBeenCalledOnce();
		expect(applyReset).toHaveBeenCalledOnce();

		scope.stop();
	});
});
