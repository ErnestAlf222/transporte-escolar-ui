<script setup lang="ts">
import { computed } from 'vue'
import { CreditCard, Copy } from 'lucide-vue-next'
import BotonRelieve from '@/features/portal-cliente/components/BotonRelieve.vue'
import { useAviso } from '@/shared/composables/useAviso'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import { agruparTarjeta, digitosTarjeta, copiarTexto } from '@/shared/utils/tarjeta'
import {
    TEXTO_TARJETA_AYUDA,
    TEXTO_TARJETA_VACIA_TITULO,
    TEXTO_TARJETA_VACIA_AYUDA,
    TEXTO_TARJETA_COPIADA,
    TEXTO_TARJETA_NO_COPIADA,
    TEXTO_COPIAR_NUMERO,
} from '@/features/portal-cliente/constants/portal'

const props = defineProps<{ numero: string }>()

const { mostrarAviso } = useAviso()
const { configuracion } = useConfiguracion()
const digitos = computed(() => digitosTarjeta(props.numero))
const grupos = computed(() => agruparTarjeta(props.numero).split(' '))

// Tocar la tarjeta o el botón copia el número sin espacios
async function copiar() {
    if (await copiarTexto(digitos.value)) mostrarAviso(TEXTO_TARJETA_COPIADA(digitos.value.length))
    else mostrarAviso(TEXTO_TARJETA_NO_COPIADA, 'error')
}
</script>

<template>
    <div v-if="digitos" class="space-y-4">
        <!-- Aspecto de tarjeta bancaria (proporción 1,6:1): el acento y una variante más oscura del mismo acento -->
        <button type="button" :aria-label="`${TEXTO_TARJETA_AYUDA}: ${grupos.join(' ')}`"
            class="entra-suave relative flex aspect-[1.6/1] w-full flex-col justify-between overflow-hidden rounded-3xl bg-linear-to-br from-accent to-[color-mix(in_srgb,var(--color-accent)_55%,var(--color-van-tinta))] p-5 text-left text-van shadow-[0_18px_36px_-18px_color-mix(in_srgb,var(--color-accent)_70%,var(--color-van-tinta))] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 sm:p-7"
            @click="copiar">
            <span aria-hidden="true" class="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-van/10"></span>
            <span aria-hidden="true" class="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-van/10"></span>
            <span class="relative flex items-center justify-between gap-3">
                <span class="truncate text-base font-bold">{{ configuracion?.nombre_negocio }}</span>
                <CreditCard class="h-7 w-7 shrink-0" aria-hidden="true" />
            </span>
            <span aria-hidden="true" class="relative block h-8 w-11 rounded-lg bg-sun/90"></span>
            <span class="relative flex flex-wrap gap-x-4 gap-y-1 font-mono text-xl font-bold tracking-widest sm:text-2xl">
                <span v-for="(g, i) in grupos" :key="i">{{ g }}</span>
            </span>
            <span class="relative block text-xs font-medium opacity-90">{{ TEXTO_TARJETA_AYUDA }}</span>
        </button>

        <BotonRelieve variante="suave" @click="copiar">
            <Copy class="h-5 w-5" aria-hidden="true" />
            {{ TEXTO_COPIAR_NUMERO }}
        </BotonRelieve>
    </div>
    <div v-else class="flex flex-col items-center gap-3 rounded-3xl border border-border bg-panel p-8 text-center">
        <span aria-hidden="true" class="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
            <CreditCard class="h-7 w-7" />
        </span>
        <p class="font-bold text-text-primary">{{ TEXTO_TARJETA_VACIA_TITULO }}</p>
        <p class="text-sm text-text-secondary">{{ TEXTO_TARJETA_VACIA_AYUDA }}</p>
    </div>
</template>
