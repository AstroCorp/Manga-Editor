<script setup lang="ts">
import { computed, ref } from 'vue';
import { Icon } from '@iconify/vue';
import ConfigPanel from '@/components/sidebar/ConfigPanel.vue';
import LayoutsPanel from '@/components/sidebar/LayoutsPanel.vue';
import { SIDEBAR_TAB } from '@/lib/editor/editorEnums';
import type { SidebarTab, SidebarTabDef } from '@/types/sidebar';

const tabs: SidebarTabDef[] = [
	{
		id: SIDEBAR_TAB.Config,
		label: 'Config',
		icon: 'fluent:settings-24-regular',
		panel: ConfigPanel,
	},
	{
		id: SIDEBAR_TAB.Layouts,
		label: 'Layouts',
		icon: 'fluent:grid-24-regular',
		panel: LayoutsPanel,
	},
];

const activeTab = ref<SidebarTab | null>(SIDEBAR_TAB.Config);

const activeTabDef = computed(() => {
	return tabs.find((tab) => tab.id === activeTab.value) ?? null;
});

const panelTitle = computed(() => {
	return activeTabDef.value?.label ?? '';
});

const selectTab = (tab: SidebarTab) => {
	activeTab.value = activeTab.value === tab ? null : tab;
};

const closePanel = () => {
	activeTab.value = null;
};
</script>

<template>
	<div class="relative z-20 flex h-full min-h-0 shrink-0">
		<nav
			class="flex h-full w-18 shrink-0 flex-col items-stretch gap-1 border-r border-slate-200/80 bg-slate-50/90 px-1.5 py-3 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/90"
			role="tablist"
			aria-label="Sidebar tabs"
		>
			<button
				v-for="tab in tabs"
				:key="tab.id"
				type="button"
				role="tab"
				class="flex flex-col items-center gap-1 rounded-lg border border-transparent bg-white px-1 py-2.5 text-slate-500 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 aria-selected:border-blue-600 aria-selected:bg-blue-50 aria-selected:text-blue-600 aria-selected:shadow-sm aria-selected:ring-1 aria-selected:ring-blue-600/40 dark:bg-zinc-950 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400 dark:aria-selected:border-blue-500 dark:aria-selected:bg-blue-950 dark:aria-selected:text-blue-400 dark:aria-selected:ring-blue-500/40"
				:aria-selected="activeTab === tab.id"
				aria-controls="sidebar-panel"
				@click="selectTab(tab.id)"
			>
				<Icon :icon="tab.icon" class="size-6" />
				<span class="text-xs font-medium leading-snug">{{
					tab.label
				}}</span>
			</button>
		</nav>

		<aside
			v-if="activeTabDef"
			id="sidebar-panel"
			class="relative flex h-full w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/95"
			role="tabpanel"
			:aria-label="panelTitle"
		>
			<header
				class="shrink-0 border-b border-slate-200/60 px-4 pt-5 pb-3.5 dark:border-zinc-800/60"
			>
				<h2
					class="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
				>
					{{ panelTitle }}
				</h2>
			</header>

			<div class="min-h-0 flex-1 overflow-y-auto">
				<component :is="activeTabDef.panel" />
			</div>

			<button
				type="button"
				class="absolute top-1/2 right-0 z-30 flex h-14 w-4 -translate-y-1/2 translate-x-full items-center justify-center rounded-r-md border border-l-0 border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-400 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
				aria-label="Close sidebar panel"
				title="Close panel"
				@click="closePanel"
			>
				<Icon icon="fluent:chevron-left-24-regular" class="size-3.5" />
			</button>
		</aside>
	</div>
</template>
