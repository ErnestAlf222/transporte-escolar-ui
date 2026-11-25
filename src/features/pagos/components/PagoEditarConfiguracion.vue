<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Save, SlidersHorizontal } from 'lucide-vue-next'
import { configurarCliente } from '@/features/clientes'
import type { ConfigurarClientePayload } from '@/features/clientes'
import { mensajeDeEstado } from '@/shared/utils/errores'
import { parseMonto } from '@/shared/utils/moneda'
import { lunesSiguiente, soloFecha, textoLunes } from '@/shared/utils/semana'
import { useAviso } from '@/shared/composables/useAviso'
import type { MetodoPago } from '@/shared/types/pago'
import type { AlumnoPagoSemana } from '@/features/pagos/types/pago'
import {
    TEXTO_GUARDADO_METODO,
    TEXTO_GUARDADO_SIMPLE,
    textoGuardadoTodos,
    textoGuardadoUno,
} from '@/features/pagos/constants/tarifa'
import SelectorDiaMetodo from '@/shared/ui/SelectorDiaMetodo.vue'
import Spinner from '@/shared/ui/Spinner.vue'

// Cuota, recargo, día límite y método de un alumno (PATCH /clientes/{id}/configuracion). A quién llega el cambio
// lo decide el candado de tarifa de la familia: con candado, a todos los hermanos; sin candado, solo a este alumno.
// `abierta`: el formulario se muestra de entrada y no se puede ocultar (en el panel de dinero)
const props = defineProps<{ alumno: AlumnoPagoSemana; hermanos: AlumnoPagoSemana[]; abierta?: boolean }>()
const emit = defineEmits<{ guardado: [] }>()

interface Formulario {
    cuota: string
    recargo: string
    dia: number
    metodo: MetodoPago
}

function desdeAlumno(a: AlumnoPagoSemana): Formulario {
    return {
        cuota: String(a.monto_cuota),
        recargo: String(a.monto_recargo),
        dia: a.dia_limite_pago,
        metodo: a.metodo_pago as MetodoPago,
    }
}

const { mostrarAviso } = useAviso()
const abierto = ref(props.abierta ?? false)
const form = ref<Formulario>(desdeAlumno(props.alumno))
const original = ref<Formulario>({ ...form.value })
const enviando = ref(false)
const error = ref('')

// Al abrir a otro alumno, o si la configuración cambió por fuera (otro admin, el candado), el formulario parte de lo vigente
watch(
    () => [props.alumno.cliente_id, props.alumno.monto_cuota, props.alumno.monto_recargo, props.alumno.dia_limite_pago, props.alumno.metodo_pago],
    () => {
        form.value = desdeAlumno(props.alumno)
        original.value = { ...form.value }
    },
)
watch(() => props.alumno.cliente_id, () => {
    abierto.value = props.abierta ?? false
    error.value = ''
})

const cambiaMontos = computed(
    () =>
        form.value.cuota.trim() !== original.value.cuota.trim() ||
        form.value.recargo.trim() !== original.value.recargo.trim(),
)
const cambiaDia = computed(() => form.value.dia !== original.value.dia)
const cambiaMetodo = computed(() => form.value.metodo !== original.value.metodo)
const puedeGuardar = computed(() => !enviando.value && (cambiaMontos.value || cambiaDia.value || cambiaMetodo.value))
// Con candado puesto (y más de un hermano) el cambio llega a todos
const conCandado = computed(() => props.hermanos.length > 1 && props.alumno.tarifa_unificada === true)

async function guardar() {
    if (!puedeGuardar.value) return
    const cuota = parseMonto(form.value.cuota)
    const recargo = parseMonto(form.value.recargo)
    if (cuota === null || recargo === null) {
        error.value = 'Escribe montos válidos: de 0 a 100,000'
        return
    }
    // Solo se manda lo que cambió; el candado decide a quién llega
    const payload: ConfigurarClientePayload = {}
    if (form.value.cuota.trim() !== original.value.cuota.trim()) payload.monto_cuota = cuota
    if (form.value.recargo.trim() !== original.value.recargo.trim()) payload.monto_recargo = recargo
    if (cambiaDia.value) payload.dia_limite_pago = form.value.dia
    if (cambiaMetodo.value) payload.metodo_pago = form.value.metodo

    const avisoTarifa = cambiaMontos.value || cambiaDia.value
    const avisoMetodo = cambiaMetodo.value
    enviando.value = true
    error.value = ''
    try {
        const respuesta = await configurarCliente(props.alumno.cliente_id, payload)
        original.value = { ...form.value }
        const lunes = textoLunes(soloFecha(respuesta.aplica_desde || lunesSiguiente()))
        const partes: string[] = []
        if (avisoTarifa) partes.push(conCandado.value ? textoGuardadoTodos(lunes) : textoGuardadoUno(props.alumno.alumno, lunes))
        if (avisoMetodo) partes.push(TEXTO_GUARDADO_METODO)
        mostrarAviso(partes.join(' ') || TEXTO_GUARDADO_SIMPLE)
        emit('guardado')
    } catch (e) {
        error.value = mensajeDeEstado(e, 400, 'No se pudo guardar la configuración')
    } finally {
        enviando.value = false
    }
}

const clasesCampo =
    'mt-1 w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
</script>

<template>
    <div class="border-t border-border pt-4">
        <button v-if="!abierta" type="button" :aria-expanded="abierto"
            class="flex items-center gap-2 text-sm font-medium text-accent hover:opacity-80" @click="abierto = !abierto">
            <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
            {{ abierto ? 'Ocultar la configuración' : 'Editar cuota, recargo, día y método' }}
        </button>

        <form v-if="abierto" class="mt-3 space-y-4" @submit.prevent="guardar">
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs text-text-secondary" for="editar-cuota">Cuota semanal</label>
                    <input id="editar-cuota" v-model="form.cuota" type="text" inputmode="decimal" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary" for="editar-recargo">Recargo por atraso</label>
                    <input id="editar-recargo" v-model="form.recargo" type="text" inputmode="decimal" :class="clasesCampo" />
                </div>
            </div>

            <p v-if="cambiaMontos" class="text-xs text-sun">
                El cambio de monto afecta a todas las semanas que aún no están confirmadas.
            </p>

            <SelectorDiaMetodo v-model:dia="form.dia" v-model:metodo="form.metodo" />

            <p v-if="error" class="text-sm text-danger">{{ error }}</p>

            <div class="flex justify-end">
                <button type="submit" :disabled="!puedeGuardar"
                    class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                    <Spinner v-if="enviando" />
                    <Save v-else class="h-4 w-4" />
                    Guardar
                </button>
            </div>
        </form>
    </div>
</template>
