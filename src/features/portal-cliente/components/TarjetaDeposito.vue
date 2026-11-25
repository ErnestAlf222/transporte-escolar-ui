<script setup lang="ts">
import { computed } from 'vue'
import { CreditCard } from 'lucide-vue-next'
import { useAviso } from '@/shared/composables/useAviso'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import { agruparTarjeta, digitosTarjeta, copiarTexto } from '@/shared/utils/tarjeta'
import {
    TEXTO_TARJETA_AYUDA,
    TEXTO_TARJETA_VACIA_TITULO,
    TEXTO_TARJETA_VACIA_AYUDA,
    TEXTO_TARJETA_COPIADA,
    TEXTO_TARJETA_NO_COPIADA,
} from '@/features/portal-cliente/constants/portal'

const props = defineProps<{ numero: string }>()

const { mostrarAviso } = useAviso()
const { configuracion } = useConfiguracion()
const digitos = computed(() => digitosTarjeta(props.numero))
const agrupado = computed(() => agruparTarjeta(props.numero))

// Cualquier parte de la tarjeta copia el número sin espacios
async function copiar() {
    if (await copiarTexto(digitos.value)) mostrarAviso(TEXTO_TARJETA_COPIADA(digitos.value.length))
    else mostrarAviso(TEXTO_TARJETA_NO_COPIADA, 'error')
}
</script>

<template>
    <button v-if="digitos" type="button" :aria-label="`${TEXTO_TARJETA_AYUDA}: ${agrupado}`"
        class="entra-suave relative block w-full overflow-hidden rounded-card bg-linear-to-br from-accent to-servicio p-5 text-left text-van shadow-lg transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        @click="copiar">
        <span aria-hidden="true" class="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-van/10"></span>
        <span aria-hidden="true" class="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-van/10"></span>
        <span class="relative flex items-center justify-between">
            <span class="text-sm font-medium opacity-90">{{ configuracion?.nombre_negocio }}</span>
            <CreditCard class="h-6 w-6 opacity-90" />
        </span>
        <span aria-hidden="true" class="relative mt-6 block h-7 w-10 rounded-md bg-sun/90"></span>
        <span class="relative mt-5 block font-mono text-xl font-semibold tracking-widest sm:text-2xl">{{ agrupado }}</span>
        <span class="relative mt-5 block text-xs opacity-90">{{ TEXTO_TARJETA_AYUDA }}</span>
    </button>
    <div v-else class="glass-plano rounded-card p-6 text-center">
        <CreditCard class="mx-auto h-8 w-8 text-text-muted" />
        <p class="mt-2 font-medium text-text-primary">{{ TEXTO_TARJETA_VACIA_TITULO }}</p>
        <p class="mt-1 text-sm text-text-secondary">{{ TEXTO_TARJETA_VACIA_AYUDA }}</p>
    </div>
</template>
