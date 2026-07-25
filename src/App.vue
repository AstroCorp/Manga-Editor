<script setup lang="ts">
import EditorLayout from '@/components/shell/EditorLayout.vue';
import { useTheme } from '@/composables/useTheme';

// Activa useColorMode al montar la app (clase .dark en <html>).
useTheme();
</script>

<template>
	<EditorLayout />
</template>
