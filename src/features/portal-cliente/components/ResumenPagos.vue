<script setup lang="ts">
import { computed } from 'vue'
import ChipEstado from '@/features/portal-cliente/components/ChipEstado.vue'
import {
    TEXTO_RESUMEN_DEBES,
    TEXTO_RESUMEN_AL_CORRIENTE,
    TEXTO_RESUMEN_AL_CORRIENTE_AYUDA,
    TEXTO_RESUMEN_SOLO_ATRASOS,
    TEXTO_RESUMEN_TOTAL,
    TEXTO_RESUMEN_ATRASOS,
    TEXTO_RESUMEN_FALTA,
    TEXTO_RESUMEN_ABONADO,
    TEXTO_RESUMEN_RECARGO,
    TEXTO_RESUMEN_POR_ALUMNO,
    ETIQUETAS_ESTADO_SEMANA,
    CLASES_CHIP_NEUTRO,
} from '@/features/portal-cliente/constants/portal'
import type { ResumenPagosPortal } from '@/features/portal-cliente/types/portal'
import { formatearMonto } from '@/shared/utils/moneda'
import { rangoSemana } from '@/shared/utils/semana'

const props = defineProps<{ resumen: ResumenPagosPortal; esTutor: boolean }>()

const alCorriente = computed(() => props.resumen.total_adeudo <= 0 && props.resumen.debe_esta_semana <= 0)
const debeSemana = computed(() => props.resumen.debe_esta_semana > 0)
// El detalle por alumno solo hace falta si hay algo que explicar
const alumnosConDetalle = computed(() =>
    props.resumen.alumnos.filter((a) => a.debe_esta_semana > 0 || a.atrasos.length > 0 || a.estado_semana !== 'sin_cobro'),
)

function etiqueta(estado: string) {
    return ETIQUETAS_ESTADO_SEMANA[estado as keyof typeof ETIQUETAS_ESTADO_SEMANA] ?? { texto: estado, clases: CLASES_CHIP_NEUTRO }
}
</script>

<template>
    <div class="space-y-3">
        <div class="glass-plano entra-suave rounded-card p-5 text-center">
            <template v-if="alCorriente">
                <p class="text-xl font-semibold text-mint">{{ TEXTO_RESUMEN_AL_CORRIENTE }}</p>
                <p class="mt-1 text-sm text-text-secondary">{{ TEXTO_RESUMEN_AL_CORRIENTE_AYUDA }}</p>
            </template>
            <template v-else>
                <p class="text-sm text-text-secondary">{{ debeSemana ? TEXTO_RESUMEN_DEBES : TEXTO_RESUMEN_SOLO_ATRASOS }}</p>
                <p class="mt-1 text-3xl font-semibold text-text-primary">
                    {{ formatearMonto(debeSemana ? resumen.debe_esta_semana : resumen.total_adeudo) }}
                </p>
                <p v-if="debeSemana && resumen.total_adeudo > resumen.debe_esta_semana" class="mt-2 text-sm text-text-secondary">
                    {{ TEXTO_RESUMEN_TOTAL }}: <span class="font-medium text-text-primary">{{ formatearMonto(resumen.total_adeudo) }}</span>
                </p>
            </template>
        </div>

        <ul v-if="alumnosConDetalle.length" class="space-y-2" :aria-label="esTutor ? TEXTO_RESUMEN_POR_ALUMNO : undefined">
            <li v-for="(a, i) in alumnosConDetalle" :key="a.id" class="glass-plano entra-suave rounded-card p-4"
                :style="{ '--i': i + 1 }">
                <div class="flex items-center justify-between gap-2">
                    <p v-if="esTutor" class="min-w-0 truncate font-medium text-text-primary">{{ a.nombre }}</p>
                    <ChipEstado v-bind="etiqueta(a.estado_semana)" />
                </div>
                <p v-if="a.debe_esta_semana > 0" class="mt-2 text-sm text-text-secondary">
                    {{ a.estado_semana === 'parcial' ? TEXTO_RESUMEN_FALTA : TEXTO_RESUMEN_DEBES }}
                    <span class="font-medium text-text-primary">{{ formatearMonto(a.debe_esta_semana) }}</span>
                    <template v-if="a.abonado"> · {{ TEXTO_RESUMEN_ABONADO }} {{ formatearMonto(a.abonado) }}</template>
                    <template v-if="a.con_recargo"> · {{ TEXTO_RESUMEN_RECARGO }}</template>
                </p>
                <div v-if="a.atrasos.length" class="mt-3 border-t border-border pt-3">
                    <p class="text-xs font-medium text-text-muted">{{ TEXTO_RESUMEN_ATRASOS }}</p>
                    <ul class="mt-1 space-y-1">
                        <li v-for="t in a.atrasos" :key="t.semana_inicio" class="flex items-center justify-between gap-2 text-sm">
                            <span class="text-text-secondary">{{ rangoSemana(t.semana_inicio) }}</span>
                            <span class="text-right font-medium text-text-primary">
                                {{ formatearMonto(t.falta) }}
                                <span v-if="t.abonado" class="font-normal text-text-secondary">
                                    ({{ TEXTO_RESUMEN_ABONADO }} {{ formatearMonto(t.abonado) }})
                                </span>
                                <span v-if="t.con_recargo" class="font-normal text-sun"> · {{ TEXTO_RESUMEN_RECARGO }}</span>
                            </span>
                        </li>
                    </ul>
                </div>
            </li>
        </ul>
    </div>
</template>
