<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'
import type { EstadoCarga } from '@/features/portal-cliente/composables/useCargaPortal'
import { TEXTO_CARGANDO, TEXTO_ERROR_CARGA, TEXTO_BOTON_REINTENTAR } from '@/features/portal-cliente/constants/portal'

// Envoltorio de cada bloque: título y los tres estados (cargando con esqueleto, error, vacío) con el mismo cuidado.
// avisoGeneral: otro aviso de la pantalla ya cuenta que hay un problema, así que aquí el error no se repite.
withDefaults(
    defineProps<{
        titulo: string
        estado: EstadoCarga
        vacio?: boolean
        textoVacio?: string
        iconoVacio?: Component
        esqueleto?: 'tarjeta' | 'lista'
        avisoGeneral?: boolean
    }>(),
    { vacio: false, textoVacio: '', iconoVacio: () => Inbox, esqueleto: 'lista', avisoGeneral: false },
)
defineEmits<{ reintentar: [] }>()
</script>

<template>
    <section v-if="!(estado === 'error' && avisoGeneral)" class="space-y-3">
        <h2 class="text-sm font-semibold text-text-secondary">{{ titulo }}</h2>
        <div v-if="estado === 'cargando'" role="status" :aria-label="TEXTO_CARGANDO" class="animate-pulse motion-reduce:animate-none">
            <div v-if="esqueleto === 'tarjeta'" class="aspect-video max-w-md rounded-card bg-text-muted/20"></div>
            <div v-else class="space-y-2">
                <div v-for="n in 2" :key="n" class="glass-plano space-y-3 rounded-card p-4">
                    <div class="h-4 w-2/5 rounded-card bg-text-muted/20"></div>
                    <div class="h-3 w-4/5 rounded-card bg-text-muted/20"></div>
                </div>
            </div>
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
        <div v-else-if="vacio" class="glass-plano flex flex-col items-center gap-2 rounded-card p-6 text-center">
            <component :is="iconoVacio" class="h-8 w-8 text-text-muted" aria-hidden="true" />
            <p class="text-sm text-text-secondary">{{ textoVacio }}</p>
        </div>
        <slot v-else />
    </section>
</template>
