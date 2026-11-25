<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
import { TEXTO_DINERO_ABRIR } from '@/features/pagos/constants/dinero'

// La burbuja de billetera (el mismo botón redondo que tenía Clientes): abre el dinero de la familia
defineProps<{ deshabilitado?: boolean; compacto?: boolean }>()
</script>

<template>
    <button type="button" :aria-label="TEXTO_DINERO_ABRIR" :title="TEXTO_DINERO_ABRIR" :disabled="deshabilitado"
        class="grid shrink-0 place-items-center rounded-full bg-accent text-bg shadow-lg shadow-black/40 transition hover:opacity-90 active:scale-95 disabled:opacity-50"
        :class="compacto ? 'h-8 w-8' : 'h-10 w-10'">
        <Wallet class="h-5 w-5" aria-hidden="true" />
    </button>
</template>
