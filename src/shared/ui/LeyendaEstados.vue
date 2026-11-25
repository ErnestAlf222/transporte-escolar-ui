<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { ESTADO_CICLO, ORDEN_ESTADOS_CICLO, type EstadoCiclo } from '@/shared/constants/estadoCiclo'

// Leyenda de todos los estados del ciclo de pago, con el actual resaltado. En móvil se pliega para no alargar el modal.
defineProps<{ actual: EstadoCiclo }>()

const TEXTO_TITULO = 'Qué significa cada estado'
// 'sin_cobro' no está en el orden de los contadores, pero también es un estado posible
const ESTADOS: EstadoCiclo[] = [...ORDEN_ESTADOS_CICLO, 'sin_cobro']
const abierta = ref(false)
</script>

<template>
    <div class="glass rounded-card p-3">
        <button type="button" :aria-expanded="abierta"
            class="flex w-full items-center justify-between gap-2 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary lg:pointer-events-none"
            @click="abierta = !abierta">
            {{ TEXTO_TITULO }}
            <ChevronDown class="h-4 w-4 transition-transform motion-reduce:transition-none lg:hidden"
                :class="{ 'rotate-180': abierta }" aria-hidden="true" />
        </button>
        <ul class="mt-2 space-y-0.5" :class="abierta ? 'block' : 'hidden lg:block'">
            <li v-for="e in ESTADOS" :key="e" class="flex items-start gap-3 rounded-card px-2 py-1"
                :class="e === actual ? 'bg-panel-2 ring-1 ring-border' : ''" :aria-current="e === actual ? 'true' : undefined">
                <span class="w-32 shrink-0 rounded-card px-2 py-0.5 text-center text-xs font-medium"
                    :class="ESTADO_CICLO[e].clases">
                    {{ ESTADO_CICLO[e].texto }}
                </span>
                <span class="text-xs" :class="e === actual ? 'font-medium text-text-primary' : 'text-text-secondary'">
                    {{ ESTADO_CICLO[e].leyenda }}
                </span>
            </li>
        </ul>
    </div>
</template>
