<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from 'lucide-vue-next'
import type { EstadoCarga } from '@/features/portal-cliente/composables/useCargaPortal'
import { TEXTO_CARGANDO, TEXTO_ERROR_CARGA, TEXTO_BOTON_REINTENTAR } from '@/features/portal-cliente/constants/portal'

// Envoltorio de cada bloque: título con su icono y los tres estados (cargando con esqueleto, error, vacío) con el mismo cuidado.
// avisoGeneral: otro aviso de la pantalla ya cuenta que hay un problema, así que aquí el error no se repite.
withDefaults(
    defineProps<{
        titulo: string
        icono?: Component
        estado: EstadoCarga
        vacio?: boolean
        textoVacio?: string
        iconoVacio?: Component
        esqueleto?: 'tarjeta' | 'lista'
        avisoGeneral?: boolean
    }>(),
    { icono: undefined, vacio: false, textoVacio: '', iconoVacio: () => Inbox, esqueleto: 'lista', avisoGeneral: false },
)
defineEmits<{ reintentar: [] }>()
</script>

<template>
    <section v-if="!(estado === 'error' && avisoGeneral)" class="space-y-4">
        <h2 class="flex items-center gap-2.5 text-lg font-bold text-text-primary">
            <span v-if="icono" aria-hidden="true"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <component :is="icono" class="h-5 w-5" />
            </span>
            {{ titulo }}
        </h2>
        <div v-if="estado === 'cargando'" role="status" :aria-label="TEXTO_CARGANDO" class="animate-pulse motion-reduce:animate-none">
            <div v-if="esqueleto === 'tarjeta'" class="aspect-[1.6/1] max-w-md rounded-3xl bg-text-muted/20"></div>
            <div v-else class="space-y-3">
                <div v-for="n in 2" :key="n" class="space-y-3 rounded-3xl border border-border bg-panel p-5">
                    <div class="h-4 w-2/5 rounded-full bg-text-muted/20"></div>
                    <div class="h-3 w-4/5 rounded-full bg-text-muted/20"></div>
                </div>
            </div>
        </div>
        <div v-else-if="estado === 'error'" role="alert"
            class="space-y-4 rounded-3xl border border-border bg-panel p-6 text-center text-sm text-text-secondary">
            <p>{{ TEXTO_ERROR_CARGA }}</p>
            <button type="button"
                class="min-h-11 rounded-2xl border border-border bg-panel px-5 py-2 font-bold text-text-primary hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                @click="$emit('reintentar')">
                {{ TEXTO_BOTON_REINTENTAR }}
            </button>
        </div>
        <div v-else-if="vacio" class="flex flex-col items-center gap-3 rounded-3xl border border-border bg-panel p-8 text-center">
            <span aria-hidden="true" class="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
                <component :is="iconoVacio" class="h-7 w-7" />
            </span>
            <p class="text-sm text-text-secondary">{{ textoVacio }}</p>
        </div>
        <slot v-else />
    </section>
</template>
