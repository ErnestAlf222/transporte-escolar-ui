<script setup lang="ts">
import { ref, computed } from 'vue'
import { Banknote } from 'lucide-vue-next'
import axios from 'axios'
import { recibiMenos } from '@/features/pagos/api/pagos'
import { esEstadoConTexto, mensajeDeError } from '@/shared/utils/errores'
import { MAX_MENSAJE } from '@/shared/constants/pagos'
import { formatearMonto, parseMonto } from '@/shared/utils/moneda'
import { nuevoIdentificador } from '@/shared/utils/identificador'
import Spinner from '@/shared/ui/Spinner.vue'

// "Recibí menos": llegó menos de lo que reportó el cliente. Queda como abono y la semana pasa a parcial
const props = defineProps<{ pagoId: number; saldo: number }>()
const emit = defineEmits<{ registrado: []; conflicto: []; cancelar: [] }>()

const monto = ref('')
const mensaje = ref('')
const enviando = ref(false)
const error = ref('')
// Un identificador por intento: el doble toque no registra dos veces, pero un intento nuevo sí es otro
let lote = nuevoIdentificador()

const montoNumero = computed(() => {
    const n = parseMonto(monto.value)
    return n !== null && n > 0 ? n : null
})
const montoMal = computed(() => monto.value.trim() !== '' && (montoNumero.value === null || montoNumero.value >= props.saldo))

async function registrar() {
    if (enviando.value) return
    if (montoNumero.value === null) {
        error.value = 'Escribe cuánto llegó (mayor a cero)'
        return
    }
    if (montoNumero.value >= props.saldo) {
        error.value = 'Ese monto cubre todo lo que falta: usa Confirmar'
        return
    }
    enviando.value = true
    error.value = ''
    try {
        await recibiMenos(props.pagoId, { lote, monto: montoNumero.value, mensaje: mensaje.value.trim() || undefined })
        emit('registrado')
    } catch (e) {
        if (esEstadoConTexto(e, 409, 'ya se registró')) {
            emit('registrado') // doble toque: el primer envío ya quedó guardado
        } else {
            error.value = mensajeDeError(e, 'No se pudo registrar lo recibido')
            if (axios.isAxiosError(e) && e.response) lote = nuevoIdentificador() // el servidor lo rechazó: el siguiente es otro intento
            if (axios.isAxiosError(e) && e.response?.status === 409) emit('conflicto') // otro admin ya lo resolvió
        }
    } finally {
        enviando.value = false
    }
}

const clasesCampo =
    'w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'
</script>

<template>
    <div class="space-y-3 rounded-card border border-border p-4">
        <p class="text-sm text-text-secondary">
            Falta {{ formatearMonto(saldo) }}. Escribe cuánto llegó: el resto queda pendiente y el cliente podrá reportarlo de nuevo.
        </p>
        <div>
            <label class="block text-xs text-text-secondary" for="menos-monto">¿Cuánto llegó?</label>
            <div class="relative mt-1">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-secondary">$</span>
                <input id="menos-monto" v-model="monto" type="text" inputmode="decimal" autocomplete="off"
                    :class="[clasesCampo, 'pl-7', montoMal ? 'border-danger' : '']" />
            </div>
        </div>
        <div>
            <label class="block text-xs text-text-secondary" for="menos-mensaje">Mensaje para el cliente (opcional)</label>
            <textarea id="menos-mensaje" v-model="mensaje" rows="2" :maxlength="MAX_MENSAJE"
                placeholder="Ej. Llegó menos de lo que reportaste" :class="[clasesCampo, 'mt-1 resize-none']"></textarea>
        </div>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <div class="flex justify-end gap-3">
            <button type="button" :disabled="enviando"
                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2 disabled:opacity-50"
                @click="emit('cancelar')">
                Cancelar
            </button>
            <button type="button" :disabled="enviando || montoNumero === null"
                class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                @click="registrar">
                <Spinner v-if="enviando" />
                <Banknote v-else class="h-4 w-4" />
                Registrar lo recibido
            </button>
        </div>
    </div>
</template>
