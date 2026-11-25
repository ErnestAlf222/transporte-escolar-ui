<script setup lang="ts">
import { computed, ref } from 'vue'
import { cambiarCandadoTarifa } from '@/features/pagos/api/pagos'
import type { AlumnoPagoSemana } from '@/features/pagos/types/pago'
import {
    TEXTO_CANDADO,
    TEXTO_CANDADO_ETIQUETA,
    TEXTO_CANDADO_CONFIRMAR,
    TEXTO_CANDADO_CANCELAR,
    TEXTO_CANDADO_ERROR,
    TEXTO_CANDADO_APAGADO_AVISO,
    TEXTO_CANDADO_PUESTO_AVISO,
    TEXTO_CONFIRMAR_APAGAR,
    textoConfirmarEncender,
} from '@/features/pagos/constants/tarifa'
import { mensajeDeError } from '@/shared/utils/errores'
import { lunesSiguiente, textoLunes } from '@/shared/utils/semana'
import { useAviso } from '@/shared/composables/useAviso'
import ModalConfirmacion from '@/shared/ui/ModalConfirmacion.vue'
import Spinner from '@/shared/ui/Spinner.vue'

// Candado de tarifa de la familia: con él, un cambio de cuota, recargo, día o método llega a todos los hermanos.
// Solo aparece en familias con más de un alumno.
const props = defineProps<{ alumno: AlumnoPagoSemana; hermanos: AlumnoPagoSemana[] }>()
const emit = defineEmits<{ cambiado: [] }>()

const { mostrarAviso } = useAviso()
const enviando = ref(false)
const confirmando = ref(false)

const visible = computed(() => props.hermanos.length > 1 && props.alumno.tarifa_unificada !== undefined)
const activo = computed(() => props.alumno.tarifa_unificada === true)
const textoConfirmacion = computed(() =>
    activo.value ? TEXTO_CONFIRMAR_APAGAR : textoConfirmarEncender(props.alumno.alumno, textoLunes(lunesSiguiente())),
)

async function confirmar() {
    if (enviando.value) return
    enviando.value = true
    try {
        await cambiarCandadoTarifa(props.alumno.cliente_id, !activo.value)
        confirmando.value = false
        mostrarAviso(activo.value ? TEXTO_CANDADO_APAGADO_AVISO : TEXTO_CANDADO_PUESTO_AVISO)
        emit('cambiado')
    } catch (e) {
        confirmando.value = false
        mostrarAviso(mensajeDeError(e, TEXTO_CANDADO_ERROR), 'error')
    } finally {
        enviando.value = false
    }
}
</script>

<template>
    <div v-if="visible" class="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span class="text-sm text-text-primary">{{ TEXTO_CANDADO }}</span>
        <button type="button" role="switch" :aria-checked="activo" :aria-label="TEXTO_CANDADO_ETIQUETA"
            :disabled="enviando"
            class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition disabled:cursor-not-allowed disabled:opacity-50"
            :class="activo ? 'bg-accent' : 'bg-panel-2'" @click="confirmando = true">
            <span class="inline-block h-4 w-4 rounded-full bg-text-primary transition-transform motion-reduce:transition-none"
                :class="activo ? 'translate-x-6' : 'translate-x-1'"></span>
        </button>
    </div>

    <ModalConfirmacion :abierto="confirmando" :etiqueta="TEXTO_CANDADO_ETIQUETA" @cerrar="confirmando = false">
        <p class="text-sm text-text-primary">{{ textoConfirmacion }}</p>
        <div class="flex justify-end gap-3">
            <button type="button" :disabled="enviando"
                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2 disabled:opacity-50"
                @click="confirmando = false">
                {{ TEXTO_CANDADO_CANCELAR }}
            </button>
            <button type="button" :disabled="enviando"
                class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
                @click="confirmar">
                <Spinner v-if="enviando" />
                {{ TEXTO_CANDADO_CONFIRMAR }}
            </button>
        </div>
    </ModalConfirmacion>
</template>
