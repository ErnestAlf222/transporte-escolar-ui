<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { AlumnoPagoSemana } from '@/features/pagos/types/pago'
import { estadoDe, saldoDe } from '@/features/pagos/utils/pagos'
import {
    TEXTO_DINERO_TITULO,
    TEXTO_DINERO_CERRAR,
    TEXTO_DINERO_FALTA,
    TEXTO_DINERO_AL_CORRIENTE,
    TEXTO_DINERO_ALUMNOS,
} from '@/features/pagos/constants/dinero'
import { formatearMonto } from '@/shared/utils/moneda'
import { soloFecha } from '@/shared/utils/semana'
import ModalBase from '@/shared/ui/ModalBase.vue'
import { TAMANO_MODAL } from '@/shared/constants/modal'
import CandadoTarifa from '@/features/pagos/components/CandadoTarifa.vue'
import PagoEditarConfiguracion from '@/features/pagos/components/PagoEditarConfiguracion.vue'
import RecibosSemana from '@/features/pagos/components/RecibosSemana.vue'

// El dinero de la familia en un solo lugar: tarifa (cuota, recargo, día y método), candado, total y recibos.
// No tiene lógica propia: junta los componentes que ya existen.
const props = defineProps<{
    alumno: AlumnoPagoSemana | null
    hermanos: AlumnoPagoSemana[] // quienes comparten tutor esa semana, incluido el alumno
    semanaInicio: string
}>()
const emit = defineEmits<{ cerrar: []; cambiado: []; elegir: [id: number] }>()

// Los recibos se vuelven a pedir cada vez que se refrescan los datos
const refrescos = ref(0)
watch(() => props.alumno, () => refrescos.value++)

const totalFamilia = computed(() => {
    const a = props.alumno
    if (!a) return 0
    if (a.total_familia !== undefined) return a.total_familia
    return props.hermanos.reduce((suma, h) => (estadoDe(h) === 'pagada' || h.archivado ? suma : suma + saldoDe(h)), 0)
})
const nombres = computed(() => props.hermanos.map((h) => h.alumno).join(', '))
</script>

<template>
    <ModalBase :abierto="!!alumno" @cerrar="emit('cerrar')">
        <div v-if="alumno" role="dialog" :aria-label="TEXTO_DINERO_TITULO"
            class="glass relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-card p-5 sm:p-6"
            :class="TAMANO_MODAL.ancho">
            <div class="mb-4 flex shrink-0 items-start justify-between gap-3">
                <div class="min-w-0">
                    <h2 class="text-lg font-semibold text-text-primary">{{ TEXTO_DINERO_TITULO }}</h2>
                    <p class="truncate text-xs text-text-secondary">{{ alumno.tutor || nombres }}</p>
                </div>
                <button class="shrink-0 text-text-secondary hover:text-text-primary" :aria-label="TEXTO_DINERO_CERRAR"
                    @click="emit('cerrar')">
                    <X class="h-5 w-5" />
                </button>
            </div>

            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain scroll-fino pr-1 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
                <!-- Izquierda: total, candado y recibos. Derecha: tarifa y método -->
                <div class="space-y-4">
                <div class="flex items-center justify-between gap-3 rounded-card bg-panel-2 p-3">
                    <p class="text-sm font-semibold text-text-primary">
                        {{ totalFamilia > 0 ? TEXTO_DINERO_FALTA : TEXTO_DINERO_AL_CORRIENTE }}
                    </p>
                    <p v-if="totalFamilia > 0" class="text-xl font-bold text-accent">{{ formatearMonto(totalFamilia) }}</p>
                </div>

                <div v-if="hermanos.length > 1" class="space-y-1">
                    <p class="text-xs text-text-secondary">{{ TEXTO_DINERO_ALUMNOS }}</p>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="h in hermanos" :key="h.cliente_id" type="button"
                            class="rounded-card border px-3 py-1.5 text-sm transition"
                            :class="h.cliente_id === alumno.cliente_id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                            @click="emit('elegir', h.cliente_id)">
                            {{ h.alumno }}
                        </button>
                    </div>
                </div>

                <CandadoTarifa :alumno="alumno" :hermanos="hermanos" @cambiado="emit('cambiado')" />

                <RecibosSemana :cliente-id="alumno.cliente_id" :semana-inicio="soloFecha(semanaInicio)"
                    :version="refrescos" @anulado="emit('cambiado')" />
                </div>

                <PagoEditarConfiguracion :key="alumno.cliente_id" :alumno="alumno" :hermanos="hermanos" abierta
                    @guardado="emit('cambiado')" />
            </div>
        </div>
    </ModalBase>
</template>
