<script setup lang="ts">
import EditorLayout from '@/components/shell/EditorLayout.vue';
import { useTheme } from '@/composables/useTheme';
import { useMangaStore } from '@/stores/manga';

// Activa useColorMode al montar la app (clase .dark en <html>).
useTheme();

const mangaStore = useMangaStore();

void mangaStore.initialize();
</script>

<template>
	<EditorLayout v-if="mangaStore.isHydrated" />
	<main
		v-else
		class="grid min-h-screen place-items-center"
		aria-live="polite"
		aria-busy="true"
	>
		<p>Cargando editor…</p>
	</main>
</template>
