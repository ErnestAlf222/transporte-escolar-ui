<script setup lang="ts">
import { computed } from 'vue'
import type { AlumnoPagoSemana, FamiliaPago } from '@/features/pagos/types/pago'
import {
    ETIQUETAS_METODO,
    METODO_DIGITAL,
    accionDe,
    estaAtenuado,
    estadoDe,
    etiquetaDe,
    saldoDe,
} from '@/features/pagos/utils/pagos'
import { formatearMonto } from '@/shared/utils/moneda'
import BotonDinero from '@/features/pagos/components/BotonDinero.vue'

// Una fila por familia. En móvil es una tarjeta (total arriba, hermanos debajo); en escritorio ocupa todo el ancho
// con columnas: familia, hermanos con su estado y su acción, total y la burbuja de dinero.
const props = defineProps<{ familia: FamiliaPago; puedeResolver: boolean }>()
const emit = defineEmits<{ abrir: [id: number]; dinero: [id: number] }>()

const variosAlumnos = computed(() => props.familia.alumnos.length > 1)
const titulo = computed(() => props.familia.tutor || props.familia.alumnos.map((a) => a.alumno).join(', '))
const familiaConRecargo = computed(() => props.familia.alumnos.some((a) => a.con_recargo && !estaAtenuado(a)))
const primero = computed(() => props.familia.alumnos[0]!)

function faltaDe(a: AlumnoPagoSemana): number {
    return estadoDe(a) === 'parcial' ? saldoDe(a) : 0
}
</script>

<template>
    <div class="glass-plano relative rounded-card p-4 lg:flex lg:items-center lg:gap-6 lg:px-6">
        <!-- Familia: en móvil solo con varios hermanos; en escritorio siempre -->
        <div :class="variosAlumnos ? 'mb-1 flex' : 'hidden'"
            class="items-start justify-between gap-3 lg:mb-0 lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:items-start lg:justify-center lg:gap-0 xl:w-72">
            <div class="min-w-0">
                <p class="truncate font-semibold text-text-primary">{{ titulo }}</p>
                <p class="text-xs text-text-secondary">
                    {{ familia.alumnos.length === 1 ? '1 alumno' : `${familia.alumnos.length} alumnos` }}
                </p>
            </div>
            <div v-if="variosAlumnos" class="flex shrink-0 items-start gap-3 lg:hidden">
                <p v-if="familia.totalFamilia > 0" class="text-right text-sm font-semibold text-text-primary">
                    Falta {{ formatearMonto(familia.totalFamilia) }}
                    <span v-if="familiaConRecargo" class="block text-xs font-normal text-sun">con recargo</span>
                </p>
                <BotonDinero v-if="puedeResolver" class="-mt-1" @click="emit('dinero', primero.cliente_id)" />
            </div>
        </div>

        <ul class="divide-y divide-border/40 lg:min-w-0 lg:flex-1">
            <li v-for="a in familia.alumnos" :key="a.cliente_id" role="button" tabindex="0"
                class="flex cursor-pointer items-center justify-between gap-3 rounded-card py-2 transition hover:bg-panel-2"
                :class="{ 'opacity-60': estaAtenuado(a), 'px-2': variosAlumnos }" @click="emit('abrir', a.cliente_id)"
                @keydown.enter="emit('abrir', a.cliente_id)">
                <div class="min-w-0">
                    <p class="truncate font-semibold text-text-primary">{{ a.alumno }}</p>
                    <p class="text-xs text-text-secondary">
                        <span :class="{ 'font-medium text-accent': a.metodo_semana === METODO_DIGITAL }">
                            {{ ETIQUETAS_METODO[a.metodo_semana] ?? a.metodo_semana }}
                        </span>
                        <span v-if="a.sin_cuota" class="text-sun"> · Cuota sin configurar</span>
                        <span v-if="!variosAlumnos && a.con_recargo && !estaAtenuado(a) && estadoDe(a) !== 'pagada'"
                            class="text-sun"> · con recargo</span>
                    </p>
                </div>
                <div class="flex shrink-0 flex-col items-end gap-1 lg:flex-row lg:items-center lg:gap-4">
                    <p v-if="faltaDe(a) > 0" class="text-xs text-text-secondary lg:order-1">Falta {{ formatearMonto(faltaDe(a)) }}</p>
                    <span class="rounded-card px-2 py-1 text-xs font-medium lg:order-2" :class="etiquetaDe(a).clases">
                        {{ etiquetaDe(a).texto }}
                    </span>
                    <button v-if="puedeResolver && accionDe(a)" type="button"
                        class="rounded-card bg-accent px-3 py-1 text-xs font-medium text-bg hover:opacity-90 lg:order-3 lg:min-w-28"
                        @click.stop="emit('abrir', a.cliente_id)">
                        {{ accionDe(a)!.texto }}
                    </button>
                </div>
            </li>
        </ul>

        <!-- Escritorio: total y burbuja en sus propias columnas -->
        <div class="hidden lg:block lg:w-40 lg:shrink-0 lg:text-right">
            <template v-if="familia.totalFamilia > 0">
                <p class="text-xs text-text-secondary">Falta</p>
                <p class="text-lg font-semibold text-text-primary">{{ formatearMonto(familia.totalFamilia) }}</p>
                <p v-if="familiaConRecargo" class="text-xs text-sun">con recargo</p>
            </template>
        </div>
        <div v-if="puedeResolver" class="hidden lg:block">
            <BotonDinero @click="emit('dinero', primero.cliente_id)" />
        </div>
        <!-- Móvil con un solo alumno: la burbuja flota en la esquina para no cambiar la tarjeta -->
        <BotonDinero v-if="puedeResolver && !variosAlumnos" compacto class="absolute -right-2 -top-3 lg:hidden"
            @click="emit('dinero', primero.cliente_id)" />
    </div>
</template>
