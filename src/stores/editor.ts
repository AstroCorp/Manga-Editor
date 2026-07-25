import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useEditorStore = defineStore('editor', () => {
	const showGridGuides = ref(true);

	const toggleGridGuides = () => {
		showGridGuides.value = !showGridGuides.value;
	};

	return {
		showGridGuides,
		toggleGridGuides,
	};
});
