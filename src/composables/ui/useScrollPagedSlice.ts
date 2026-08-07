import { useInfiniteScroll } from '@vueuse/core';
import { computed, ref, watch, type Ref } from 'vue';
import { useNearBottomLoad } from '@/composables/ui/useNearBottomLoad';
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
	/**
	 * true (default): VueUse InfiniteScroll (también rellena si no hay overflow).
	 * false: sentinel/scroll masonry-safe vía `useNearBottomLoad`.
	 */
	const loadWhenNarrow = options.loadWhenNarrow ?? true;
	const waitForLayoutReady = options.waitForLayoutReady ?? false;

	const visibleCount = ref(initial);

	const visibleItems = computed(() => {
		return items.value.slice(0, visibleCount.value);
	});

	const hasMore = computed(() => {
		return visibleCount.value < items.value.length;
	});

	const bumpVisible = async () => {
		await new Promise<void>((resolve) => {
			requestAnimationFrame(() => {
				resolve();
			});
		});

		const before = visibleCount.value;

		visibleCount.value = Math.min(
			visibleCount.value + pageSize,
			items.value.length,
		);

		return visibleCount.value > before;
	};

	if (loadWhenNarrow) {
		const scrollEl = ref<HTMLElement | null>(null);
		const { isLoading, reset } = useInfiniteScroll(
			scrollEl,
			async () => {
				await bumpVisible();
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
			reset: () => {
				visibleCount.value = initial;
				reset();
			},
		};
	}

	const isLoadingMore = ref(false);

	const {
		scrollEl,
		sentinelEl,
		layoutReady,
		notifyLayoutReady,
		suspendUntilLayoutReady,
	} = useNearBottomLoad({
		distance,
		waitForLayoutReady,
		canLoadMore: () => {
			return (
				!isLoadingMore.value &&
				visibleCount.value < items.value.length
			);
		},
		onLoadMore: () => {
			isLoadingMore.value = true;
			void bumpVisible().finally(() => {
				isLoadingMore.value = false;
			});
		},
	});

	const loadMore = async () => {
		if (
			isLoadingMore.value ||
			!layoutReady.value ||
			visibleCount.value >= items.value.length
		) {
			return false;
		}

		isLoadingMore.value = true;

		if (waitForLayoutReady) {
			suspendUntilLayoutReady();
		}

		try {
			return await bumpVisible();
		} finally {
			isLoadingMore.value = false;
		}
	};

	watch(
		items,
		() => {
			visibleCount.value = initial;
			suspendUntilLayoutReady();
		},
		{ deep: false },
	);

	return {
		scrollEl,
		sentinelEl,
		visibleItems,
		hasMore,
		isLoadingMore,
		visibleCount,
		layoutReady,
		loadMore,
		notifyLayoutReady,
		reset: () => {
			visibleCount.value = initial;
			suspendUntilLayoutReady();
		},
	};
};
