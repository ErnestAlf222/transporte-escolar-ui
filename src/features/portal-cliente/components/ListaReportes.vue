<script setup lang="ts">
import ChipEstado from '@/features/portal-cliente/components/ChipEstado.vue'
import {
    ETIQUETAS_ESTADO_REPORTE,
    ETIQUETAS_METODO_PORTAL,
    CLASES_CHIP_NEUTRO,
    TEXTO_REPORTES_MENSAJE_ADMIN,
    TEXTO_REPORTES_FALTA,
    TEXTO_REPORTES_SEMANA,
    TEXTO_RESUMEN_ABONADO,
} from '@/features/portal-cliente/constants/portal'
import type { ReportePortal } from '@/features/portal-cliente/types/portal'
import { formatearMonto } from '@/shared/utils/moneda'
import { rangoSemana } from '@/shared/utils/semana'
import { textoFechaHora } from '@/shared/utils/fecha'

defineProps<{ reportes: ReportePortal[]; esTutor: boolean }>()

function etiqueta(estado: string) {
    return ETIQUETAS_ESTADO_REPORTE[estado as keyof typeof ETIQUETAS_ESTADO_REPORTE] ?? { texto: estado, clases: CLASES_CHIP_NEUTRO }
}
</script>

<template>
    <ul class="space-y-2">
        <li v-for="(r, i) in reportes" :key="r.pago_id" class="glass-plano entra-suave rounded-card p-4"
            :style="{ '--i': Math.min(i, 6) }">
            <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                    <p v-if="esTutor" class="truncate font-medium text-text-primary">{{ r.alumno }}</p>
                    <p class="text-sm text-text-secondary">{{ TEXTO_REPORTES_SEMANA }} {{ rangoSemana(r.semana_inicio) }}</p>
                </div>
                <ChipEstado v-bind="etiqueta(r.estado)" />
            </div>
            <p class="mt-1 text-xs text-text-muted">
                {{ ETIQUETAS_METODO_PORTAL[r.metodo] ?? r.metodo }} · {{ textoFechaHora(r.reportado_en) }}
            </p>
            <p v-if="r.falta" class="mt-2 text-sm text-text-secondary">
                {{ TEXTO_REPORTES_FALTA }}: <span class="font-medium text-text-primary">{{ formatearMonto(r.falta) }}</span>
                <template v-if="r.abonado"> · {{ TEXTO_RESUMEN_ABONADO }} {{ formatearMonto(r.abonado) }}</template>
            </p>
            <p v-if="r.mensaje" class="mt-2 rounded-card px-3 py-2 text-sm"
                :class="r.estado === 'rechazado' ? 'bg-danger/10 text-danger' : 'bg-panel-2 text-text-secondary'">
                <span class="font-medium">{{ TEXTO_REPORTES_MENSAJE_ADMIN }}:</span> {{ r.mensaje }}
            </p>
        </li>
    </ul>
</template>
