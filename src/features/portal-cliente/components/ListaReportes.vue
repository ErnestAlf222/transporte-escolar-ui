<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import ChipEstado from '@/features/portal-cliente/components/ChipEstado.vue'
import {
    ETIQUETAS_METODO_PORTAL,
    TEXTO_REPORTES_MENSAJE_ADMIN,
    TEXTO_REPORTES_FALTA,
    TEXTO_REPORTES_ESTA_SEMANA,
    TEXTO_REPORTES_METODO,
    TEXTO_REPORTES_REPORTADO,
    TEXTO_REPORTES_VER_DETALLE,
    TEXTO_RESUMEN_ABONADO,
} from '@/features/portal-cliente/constants/portal'
import type { ReportePortal } from '@/features/portal-cliente/types/portal'
import { ESTADO_CICLO } from '@/shared/constants/estadoCiclo'
import { estadoDeReportePortal } from '@/shared/utils/estadoCiclo'
import { formatearMonto } from '@/shared/utils/moneda'
import { rangoSemana, soloFecha } from '@/shared/utils/semana'
import { textoFechaHora } from '@/shared/utils/fecha'

// Línea de tiempo vertical de los reportes de pago: lo más reciente arriba, la semana actual resaltada.
// Cada punto se despliega con su detalle; solo una semana abierta a la vez.
const props = defineProps<{ reportes: ReportePortal[]; esTutor: boolean; semanaActual?: string }>()

const abierto = ref<number | null>(null)

// El estado de la semana lo da el servidor (ciclo); sin él, se traduce el estado viejo del reporte
const estadoDe = (r: ReportePortal) => estadoDeReportePortal(r.estado, r.ciclo?.estado)
const esActual = (r: ReportePortal) =>
    !!props.semanaActual && soloFecha(r.semana_inicio) === soloFecha(props.semanaActual)
const faltaDe = (r: ReportePortal) => r.falta ?? r.ciclo?.saldo ?? 0
const alternar = (id: number) => (abierto.value = abierto.value === id ? null : id)
</script>

<template>
    <ol class="relative ml-3 space-y-4 border-l-2 border-border pl-6">
        <li v-for="(r, i) in reportes" :key="r.pago_id" class="entra-suave relative" :style="{ '--i': Math.min(i, 6) }">
            <span aria-hidden="true"
                class="absolute -left-[2.1rem] top-5 h-4 w-4 rounded-full ring-4 ring-bg"
                :class="ESTADO_CICLO[estadoDe(r)].barra"></span>
            <div class="rounded-3xl border bg-panel transition"
                :class="esActual(r) ? 'border-accent/60 shadow-lg shadow-black/20' : 'border-border'">
                <button type="button" :aria-expanded="abierto === r.pago_id" :aria-label="TEXTO_REPORTES_VER_DETALLE"
                    class="flex min-h-11 w-full items-center justify-between gap-3 rounded-3xl p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    @click="alternar(r.pago_id)">
                    <span class="min-w-0 space-y-1">
                        <span v-if="esActual(r)"
                            class="inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-accent">
                            {{ TEXTO_REPORTES_ESTA_SEMANA }}
                        </span>
                        <span v-if="esTutor" class="block truncate text-base font-bold text-text-primary">{{ r.alumno }}</span>
                        <span class="block text-sm text-text-secondary">{{ rangoSemana(soloFecha(r.semana_inicio)) }}</span>
                        <span v-if="faltaDe(r) > 0" class="block text-sm text-text-secondary">
                            {{ TEXTO_REPORTES_FALTA }}: <span class="font-bold text-text-primary">{{ formatearMonto(faltaDe(r)) }}</span>
                        </span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2">
                        <ChipEstado :estado="estadoDe(r)" />
                        <ChevronDown class="h-4 w-4 text-text-muted transition-transform duration-150 motion-reduce:transition-none"
                            :class="{ 'rotate-180': abierto === r.pago_id }" aria-hidden="true" />
                    </span>
                </button>

                <div v-if="abierto === r.pago_id" class="space-y-3 border-t border-border px-4 pb-4 pt-3">
                    <dl class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <dt class="text-xs text-text-muted">{{ TEXTO_REPORTES_METODO }}</dt>
                            <dd class="font-bold text-text-primary">{{ ETIQUETAS_METODO_PORTAL[r.metodo] ?? r.metodo }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-text-muted">{{ TEXTO_REPORTES_REPORTADO }}</dt>
                            <dd class="font-bold text-text-primary">{{ textoFechaHora(r.reportado_en) }}</dd>
                        </div>
                        <div v-if="r.abonado">
                            <dt class="text-xs text-text-muted">{{ TEXTO_RESUMEN_ABONADO }}</dt>
                            <dd class="font-bold text-text-primary">{{ formatearMonto(r.abonado) }}</dd>
                        </div>
                        <div v-if="faltaDe(r) > 0">
                            <dt class="text-xs text-text-muted">{{ TEXTO_REPORTES_FALTA }}</dt>
                            <dd class="font-bold text-text-primary">{{ formatearMonto(faltaDe(r)) }}</dd>
                        </div>
                    </dl>
                    <p v-if="r.mensaje" class="rounded-2xl px-4 py-3 text-sm"
                        :class="estadoDe(r) === 'rechazada' ? 'bg-danger/10 text-danger' : 'bg-panel-2 text-text-secondary'">
                        <span class="font-bold">{{ TEXTO_REPORTES_MENSAJE_ADMIN }}:</span> {{ r.mensaje }}
                    </p>
                </div>
            </div>
        </li>
    </ol>
</template>
