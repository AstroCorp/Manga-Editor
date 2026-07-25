<script setup lang="ts">
import ThemeToggle from '@/components/shell/ThemeToggle.vue';
import GuideToggle from '@/components/toolbar/GuideToggle.vue';
import PageActions from '@/components/toolbar/PageActions.vue';
</script>

<template>
	<header
		class="relative z-30 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/90"
	>
		<div class="flex items-center gap-3">
			<p
				class="text-lg font-semibold tracking-wide text-blue-600 dark:text-blue-400"
			>
				Manga Editor
			</p>
			<ThemeToggle />
		</div>
		<div class="flex items-center gap-2">
			<GuideToggle />
			<PageActions />
		</div>
	</header>
</template>
