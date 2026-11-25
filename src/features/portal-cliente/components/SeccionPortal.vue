<script setup lang="ts">
import Spinner from '@/shared/ui/Spinner.vue'
import type { EstadoCarga } from '@/features/portal-cliente/composables/useCargaPortal'
import { TEXTO_CARGANDO, TEXTO_ERROR_CARGA, TEXTO_BOTON_REINTENTAR } from '@/features/portal-cliente/constants/portal'

// Envoltorio de cada bloque del inicio: título y los tres estados (cargando, error, vacío) con el mismo cuidado
defineProps<{ titulo: string; estado: EstadoCarga; vacio?: boolean; textoVacio?: string }>()
defineEmits<{ reintentar: [] }>()
</script>

<template>
    <section class="space-y-3">
        <h2 class="text-sm font-semibold text-text-secondary">{{ titulo }}</h2>
        <div v-if="estado === 'cargando'" role="status"
            class="glass-plano flex items-center justify-center gap-2 rounded-card p-6 text-sm text-text-secondary">
            <Spinner />
            {{ TEXTO_CARGANDO }}
        </div>
        <div v-else-if="estado === 'error'" role="alert"
            class="glass-plano space-y-3 rounded-card p-6 text-center text-sm text-text-secondary">
            <p>{{ TEXTO_ERROR_CARGA }}</p>
            <button type="button"
                class="rounded-card border border-border bg-panel px-4 py-2 font-medium text-text-primary hover:bg-panel-2"
                @click="$emit('reintentar')">
                {{ TEXTO_BOTON_REINTENTAR }}
            </button>
        </div>
        <p v-else-if="vacio" class="glass-plano rounded-card p-6 text-center text-sm text-text-secondary">
            {{ textoVacio }}
        </p>
        <slot v-else />
    </section>
</template>
