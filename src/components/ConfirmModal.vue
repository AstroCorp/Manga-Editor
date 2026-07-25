<script setup lang="ts">
defineProps<{
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
}>();

defineEmits<{
	confirm: [];
	cancel: [];
}>();
</script>

<template>
	<Teleport to="body">
		<div
			class="fixed inset-0 z-1000 grid place-items-center"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-modal-title"
		>
			<button
				type="button"
				class="absolute inset-0 border-0 bg-slate-900/45 p-0"
				aria-label="Close"
				@click="$emit('cancel')"
			/>
			<div
				class="relative z-1 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/20 dark:border-zinc-800 dark:bg-zinc-950"
			>
				<h2
					id="confirm-modal-title"
					class="m-0 mb-2 text-base font-semibold text-slate-900 dark:text-slate-100"
				>
					{{ title }}
				</h2>
				<p
					class="mb-5 text-sm leading-[1.55] text-slate-500 dark:text-slate-400"
				>
					{{ message }}
				</p>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600 focus-visible:border-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-400"
						@click="$emit('cancel')"
					>
						{{ cancelLabel ?? 'Cancel' }}
					</button>
					<button
						type="button"
						data-confirm="danger"
						class="inline-flex items-center justify-center gap-1 rounded-md border border-red-600/40 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:border-red-600 hover:bg-red-600/90 focus-visible:ring-red-600/40 dark:border-red-500/40 dark:bg-red-500"
						@click="$emit('confirm')"
					>
						{{ confirmLabel ?? 'Delete' }}
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>
