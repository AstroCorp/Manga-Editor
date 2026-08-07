import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useScrollPagedSlice } from '@/composables/ui/useScrollPagedSlice';

vi.mock('@vueuse/core', () => {
	return {
		useEventListener: vi.fn(),
		useIntersectionObserver: vi.fn(),
		useInfiniteScroll: (
			_el: unknown,
			onLoadMore: () => void | Promise<void>,
			options?: { canLoadMore?: () => boolean },
		) => {
			const isLoading = ref(false);

			return {
				reset: vi.fn(),
				isLoading,
				_trigger: async () => {
					if (options?.canLoadMore && !options.canLoadMore()) {
						return;
					}

					isLoading.value = true;
					await onLoadMore();
					isLoading.value = false;
				},
			};
		},
	};
});

describe('useScrollPagedSlice', () => {
	it('shows the first 6 items and loads more on scroll', async () => {
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			cb(0);

			return 0;
		});

		const items = ref(
			Array.from({ length: 20 }, (_, index) => {
				return { id: index };
			}),
		);
		const slice = useScrollPagedSlice(items, { initial: 6, pageSize: 6 });

		expect(slice.visibleItems.value).toHaveLength(6);
		expect(slice.hasMore.value).toBe(true);

		slice.visibleCount.value = Math.min(
			slice.visibleCount.value + 6,
			items.value.length,
		);
		await nextTick();

		expect(slice.visibleItems.value).toHaveLength(12);

		vi.unstubAllGlobals();
	});

	it('resets the window when the source list is replaced', async () => {
		const items = ref([1, 2, 3, 4, 5, 6, 7, 8]);
		const slice = useScrollPagedSlice(items, { initial: 6, pageSize: 6 });

		slice.visibleCount.value = 8;
		expect(slice.visibleItems.value).toHaveLength(8);

		items.value = [10, 20, 30];
		await nextTick();

		expect(slice.visibleCount.value).toBe(6);
		expect(slice.visibleItems.value).toEqual([10, 20, 30]);
		expect(slice.hasMore.value).toBe(false);
	});

	it('with loadWhenNarrow false waits for layout before loadMore', async () => {
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			cb(0);

			return 0;
		});

		const items = ref(
			Array.from({ length: 20 }, (_, index) => {
				return { id: index };
			}),
		);
		const slice = useScrollPagedSlice(items, {
			initial: 6,
			pageSize: 6,
			loadWhenNarrow: false,
			waitForLayoutReady: true,
		});

		expect(slice.visibleItems.value).toHaveLength(6);
		expect(slice.layoutReady.value).toBe(false);
		expect(await slice.loadMore()).toBe(false);
		expect(slice.visibleItems.value).toHaveLength(6);

		slice.notifyLayoutReady();
		expect(await slice.loadMore()).toBe(true);
		expect(slice.visibleItems.value).toHaveLength(12);
		expect(slice.layoutReady.value).toBe(false);

		vi.unstubAllGlobals();
	});
});
