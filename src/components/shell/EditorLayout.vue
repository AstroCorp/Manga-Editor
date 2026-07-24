<script setup lang="ts">
import TopMenu from '@/components/shell/TopMenu.vue';
import EditorSidebar from '@/components/shell/EditorSidebar.vue';
import EditorCanvas from '@/components/EditorCanvas.vue';
</script>

<template>
	<div class="grid h-dvh min-h-dvh grid-rows-[auto_1fr] bg-linear-to-b from-white via-slate-50 to-slate-100 text-slate-900 dark:from-black dark:via-zinc-950 dark:to-black dark:text-slate-100">
		<TopMenu />

		<div class="grid min-h-0 grid-cols-[auto_1fr]">
			<EditorSidebar />

			<main class="relative min-h-0 overflow-hidden">
				<EditorCanvas />
			</main>
		</div>
	</div>
</template>
