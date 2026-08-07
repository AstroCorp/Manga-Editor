import { useInfiniteScroll } from '@vueuse/core';
import { computed, ref, watch, type Ref } from 'vue';
import type { ScrollPagedSliceOptions } from '@/types/ui';

const DEFAULT_INITIAL = 6;
const DEFAULT_PAGE_SIZE = 6;
const DEFAULT_DISTANCE = 80;

export const useScrollPagedSlice = <T>(
	items: Ref<readonly T[]>,
	options: ScrollPagedSliceOptions = {},
) => {
	const initial = options.initial ?? DEFAULT_INITIAL;
	const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
	const distance = options.distance ?? DEFAULT_DISTANCE;

	const scrollEl = ref<HTMLElement | null>(null);
	const visibleCount = ref(initial);

	const visibleItems = computed(() => {
		return items.value.slice(0, visibleCount.value);
	});

	const hasMore = computed(() => {
		return visibleCount.value < items.value.length;
	});

	const { isLoading, reset } = useInfiniteScroll(
		scrollEl,
		async () => {
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() => {
					resolve();
				});
			});

			visibleCount.value = Math.min(
				visibleCount.value + pageSize,
				items.value.length,
			);
		},
		{
			distance,
			canLoadMore: () => {
				return visibleCount.value < items.value.length;
			},
		},
	);

	watch(
		items,
		() => {
			visibleCount.value = initial;
			reset();
		},
		{ deep: false },
	);

	return {
		scrollEl,
		visibleItems,
		hasMore,
		isLoadingMore: isLoading,
		visibleCount,
		reset,
	};
};
