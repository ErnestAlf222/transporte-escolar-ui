<script setup lang="ts">
import { DIAS_LIMITE_PAGO, METODOS_PAGO } from '@/shared/constants/pagos'
import type { MetodoPago } from '@/shared/types/pago'

// Día límite (solo lunes a viernes) y método de pago
defineProps<{ deshabilitado?: boolean }>()
const dia = defineModel<number>('dia', { required: true })
const metodo = defineModel<MetodoPago>('metodo')
</script>

<template>
    <div>
        <p class="text-xs text-text-secondary">Día límite de pago</p>
        <div class="mt-1 grid grid-cols-5 gap-1.5">
            <button v-for="d in DIAS_LIMITE_PAGO" :key="d.valor" type="button" :disabled="deshabilitado"
                class="rounded-card border py-2 text-xs transition disabled:cursor-default"
                :class="dia === d.valor ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                @click="dia = d.valor">
                {{ d.etiqueta }}
            </button>
        </div>
    </div>

    <div>
        <p class="text-xs text-text-secondary">Método de pago</p>
        <div class="mt-1 grid grid-cols-2 gap-2">
            <button v-for="m in METODOS_PAGO" :key="m.valor" type="button" :disabled="deshabilitado"
                class="rounded-card border py-2 text-sm transition disabled:cursor-default"
                :class="metodo === m.valor ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                @click="metodo = m.valor">
                {{ m.etiqueta }}
            </button>
        </div>
    </div>
</template>
