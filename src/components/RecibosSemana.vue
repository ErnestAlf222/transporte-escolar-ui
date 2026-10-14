<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'
import { Receipt } from 'lucide-vue-next'
import { verRecibos, anularAbono } from '@/api/pagos'
import type { Recibo } from '@/types/pago'
import { formatearMonto } from '@/utils/moneda'
import { textoFechaHora } from '@/utils/fecha'
import { ETIQUETAS_METODO } from '@/utils/pagos'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{
    clienteId: number
    semanaInicio: string // lunes de la semana, AAAA-MM-DD
    version: number // cambia cuando la lista de Pagos se refresca: así los recibos se vuelven a pedir
}>()
const emit = defineEmits<{ anulado: [] }>()

const recibos = ref<Recibo[]>([])
const confirmando = ref<string | null>(null) // lote del recibo que se está por anular
const anulando = ref(false)
const error = ref('')

let solicitud = 0

async function cargar() {
    const mia = ++solicitud
    try {
        const lista = await verRecibos(props.clienteId, props.semanaInicio)
        if (mia === solicitud) recibos.value = lista
    } catch {
        if (mia === solicitud) recibos.value = []
    }
}

watch(() => [props.clienteId, props.semanaInicio, props.version], () => {
    confirmando.value = null
    error.value = ''
    cargar()
}, { immediate: true })

async function anular(lote: string) {
    if (anulando.value) return
    anulando.value = true
    error.value = ''
    try {
        await anularAbono(lote)
        confirmando.value = null
        emit('anulado')
        await cargar()
    } catch (e) {
        error.value =
            axios.isAxiosError(e) && typeof e.response?.data === 'string' && e.response.data.trim()
                ? e.response.data.trim()
                : 'No se pudo anular el recibo'
        if (axios.isAxiosError(e) && e.response?.status === 409) {
            confirmando.value = null
            emit('anulado') // otro administrador ya lo anuló: se refresca para mostrar lo que hay
            await cargar()
        }
    } finally {
        anulando.value = false
    }
}
</script>

<template>
    <div v-if="recibos.length > 0" class="space-y-2 border-t border-border pt-4">
        <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Receipt class="h-3.5 w-3.5" />
            Recibos de esta semana
        </p>

        <div v-for="r in recibos" :key="r.lote" class="glass-plano space-y-2 rounded-card p-3 text-sm">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="font-semibold text-text-primary">{{ formatearMonto(r.monto) }}</p>
                    <p class="text-xs text-text-secondary">
                        {{ ETIQUETAS_METODO[r.metodo] ?? r.metodo }} · {{ textoFechaHora(r.registrado_en) }}
                        <template v-if="r.registrado_por"> · {{ r.registrado_por }}</template>
                    </p>
                </div>
                <button v-if="confirmando !== r.lote" type="button" :disabled="anulando"
                    class="shrink-0 text-xs text-danger hover:underline disabled:opacity-50"
                    @click="confirmando = r.lote">
                    Anular
                </button>
            </div>

            <div v-if="confirmando === r.lote" class="space-y-2 rounded-card border border-danger/30 bg-danger/10 p-3">
                <p class="text-xs text-text-primary">¿Anular este recibo?</p>
                <ul class="space-y-0.5 text-xs text-text-secondary">
                    <li v-for="p in r.partes" :key="p.cliente_id" class="flex justify-between gap-3">
                        <span class="truncate">{{ p.alumno }}</span>
                        <span class="shrink-0">{{ formatearMonto(p.monto) }}</span>
                    </li>
                </ul>
                <p v-if="error" class="text-xs text-danger">{{ error }}</p>
                <div class="flex justify-end gap-2">
                    <button type="button" :disabled="anulando"
                        class="rounded-card border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-panel-2 disabled:opacity-50"
                        @click="confirmando = null">
                        Cancelar
                    </button>
                    <button type="button" :disabled="anulando"
                        class="flex items-center gap-1.5 rounded-card bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                        @click="anular(r.lote)">
                        <Spinner v-if="anulando" />
                        Sí, anular
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>