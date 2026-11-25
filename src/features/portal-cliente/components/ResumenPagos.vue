<script setup lang="ts">
import { computed, ref } from 'vue'
import { CircleCheck, ChevronDown } from 'lucide-vue-next'
import ChipEstado from '@/features/portal-cliente/components/ChipEstado.vue'
import TarjetaPortal from '@/features/portal-cliente/components/TarjetaPortal.vue'
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
    TEXTO_RESUMEN_VER_DETALLE,
    TEXTO_RESUMEN_OCULTAR_DETALLE,
    TEXTO_AYUDA_PARCIAL,
    TEXTO_AYUDA_RECHAZADA,
    TEXTO_AYUDA_POR_VERIFICAR,
    TEXTO_REPORTES_MENSAJE_ADMIN,
} from '@/features/portal-cliente/constants/portal'
import type { AlumnoResumenPortal, ReportePortal, ResumenPagosPortal } from '@/features/portal-cliente/types/portal'
import type { EstadoCiclo } from '@/shared/constants/estadoCiclo'
import { estadoDeSemanaPortal } from '@/shared/utils/estadoCiclo'
import { formatearMonto } from '@/shared/utils/moneda'
import { rangoSemana, soloFecha } from '@/shared/utils/semana'

const props = defineProps<{ resumen: ResumenPagosPortal; esTutor: boolean; reportes?: ReportePortal[] }>()

const alCorriente = computed(() => props.resumen.total_adeudo <= 0 && props.resumen.debe_esta_semana <= 0)
const debeSemana = computed(() => props.resumen.debe_esta_semana > 0)
const detalleAbierto = ref(false)
// El detalle por alumno solo hace falta si hay algo que explicar
const alumnosConDetalle = computed(() =>
    props.resumen.alumnos.filter((a) => a.debe_esta_semana > 0 || a.atrasos.length > 0 || a.estado_semana !== 'sin_cobro'),
)

const estadoDe = (a: AlumnoResumenPortal) => estadoDeSemanaPortal(a.estado_semana, a.estado)

const AYUDA_POR_ESTADO: Partial<Record<EstadoCiclo, string>> = {
    parcial: TEXTO_AYUDA_PARCIAL,
    rechazada: TEXTO_AYUDA_RECHAZADA,
    por_verificar: TEXTO_AYUDA_POR_VERIFICAR,
}

// Lo que escribió la administración al rechazar el reporte de esta semana de ese alumno
function mensajeRechazo(a: AlumnoResumenPortal): string {
    if (estadoDe(a) !== 'rechazada') return ''
    return (props.reportes ?? []).find((r) => r.alumno_id === a.id && soloFecha(r.semana_inicio) === soloFecha(props.resumen.semana_actual) && r.mensaje)?.mensaje ?? ''
}
</script>

<template>
    <div class="space-y-4">
        <TarjetaPortal class="entra-suave text-center">
            <template v-if="alCorriente">
                <span aria-hidden="true" class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-mint/15 text-mint">
                    <CircleCheck class="h-10 w-10" />
                </span>
                <p class="mt-4 text-2xl font-extrabold text-mint">{{ TEXTO_RESUMEN_AL_CORRIENTE }}</p>
                <p class="mt-1 text-sm text-text-secondary">{{ TEXTO_RESUMEN_AL_CORRIENTE_AYUDA }}</p>
            </template>
            <template v-else>
                <p class="text-sm font-medium text-text-secondary">{{ debeSemana ? TEXTO_RESUMEN_DEBES : TEXTO_RESUMEN_SOLO_ATRASOS }}</p>
                <p class="mt-2 text-5xl font-extrabold tracking-tight text-text-primary">
                    {{ formatearMonto(debeSemana ? resumen.debe_esta_semana : resumen.total_adeudo) }}
                </p>
                <p v-if="debeSemana && resumen.total_adeudo > resumen.debe_esta_semana" class="mt-3 text-sm text-text-secondary">
                    {{ TEXTO_RESUMEN_TOTAL }}: <span class="font-bold text-text-primary">{{ formatearMonto(resumen.total_adeudo) }}</span>
                </p>
            </template>
        </TarjetaPortal>

        <div v-if="alumnosConDetalle.length">
            <button type="button" :aria-expanded="detalleAbierto"
                class="mx-auto flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                @click="detalleAbierto = !detalleAbierto">
                {{ detalleAbierto ? TEXTO_RESUMEN_OCULTAR_DETALLE : TEXTO_RESUMEN_VER_DETALLE }}
                <ChevronDown class="h-4 w-4 transition-transform duration-150 motion-reduce:transition-none"
                    :class="{ 'rotate-180': detalleAbierto }" aria-hidden="true" />
            </button>

            <ul v-if="detalleAbierto" class="mt-3 space-y-3" :aria-label="esTutor ? TEXTO_RESUMEN_POR_ALUMNO : undefined">
                <li v-for="(a, i) in alumnosConDetalle" :key="a.id" class="entra-suave" :style="{ '--i': i }">
                    <TarjetaPortal class="space-y-3">
                        <div class="flex items-center justify-between gap-3">
                            <p v-if="esTutor" class="min-w-0 truncate text-base font-bold text-text-primary">{{ a.nombre }}</p>
                            <ChipEstado :estado="estadoDe(a)" />
                        </div>
                        <p v-if="a.debe_esta_semana > 0" class="text-sm text-text-secondary">
                            {{ estadoDe(a) === 'parcial' ? TEXTO_RESUMEN_FALTA : TEXTO_RESUMEN_DEBES }}
                            <span class="font-bold text-text-primary">{{ formatearMonto(a.debe_esta_semana) }}</span>
                            <template v-if="a.abonado"> · {{ TEXTO_RESUMEN_ABONADO }} {{ formatearMonto(a.abonado) }}</template>
                            <template v-if="a.con_recargo"> · {{ TEXTO_RESUMEN_RECARGO }}</template>
                        </p>
                        <p v-if="mensajeRechazo(a)" class="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                            <span class="font-bold">{{ TEXTO_REPORTES_MENSAJE_ADMIN }}:</span> {{ mensajeRechazo(a) }}
                        </p>
                        <p v-if="AYUDA_POR_ESTADO[estadoDe(a)]" class="text-sm text-text-secondary">{{ AYUDA_POR_ESTADO[estadoDe(a)] }}</p>
                        <div v-if="a.atrasos.length" class="border-t border-border pt-3">
                            <p class="text-xs font-bold uppercase tracking-wide text-text-muted">{{ TEXTO_RESUMEN_ATRASOS }}</p>
                            <ul class="mt-2 space-y-2">
                                <li v-for="t in a.atrasos" :key="t.semana_inicio" class="flex items-center justify-between gap-2 text-sm">
                                    <span class="text-text-secondary">{{ rangoSemana(t.semana_inicio) }}</span>
                                    <span class="text-right font-bold text-text-primary">
                                        {{ formatearMonto(t.falta) }}
                                        <span v-if="t.abonado" class="font-normal text-text-secondary">
                                            ({{ TEXTO_RESUMEN_ABONADO }} {{ formatearMonto(t.abonado) }})
                                        </span>
                                        <span v-if="t.con_recargo" class="font-normal text-sun"> · {{ TEXTO_RESUMEN_RECARGO }}</span>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </TarjetaPortal>
                </li>
            </ul>
        </div>
    </div>
</template>
