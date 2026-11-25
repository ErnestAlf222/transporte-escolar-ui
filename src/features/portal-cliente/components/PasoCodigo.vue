<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import {
    LONGITUD_CODIGO,
    TEXTO_TITULO_CODIGO,
    TEXTO_EXPLICA_CODIGO,
    ETIQUETA_CODIGO,
    TEXTO_BOTON_VERIFICAR,
    TEXTO_BOTON_REENVIAR,
    TEXTO_ESPERA_REENVIO,
    TEXTO_CAMBIAR_NUMERO,
    TEXTO_BOTON_ENTRANDO,
} from '@/features/portal-cliente/constants/portal'

const codigo = defineModel<string>({ required: true })
defineProps<{ aviso: string; error: string; cargando: boolean; espera: number }>()
const emit = defineEmits<{ verificar: []; reenviar: []; cambiarNumero: [] }>()

const contenedor = ref<HTMLElement | null>(null)
// Foco al abrir la pantalla
onMounted(() => contenedor.value?.querySelector('input')?.focus())

// Acepta pegar un código con espacios o guiones: se quedan solo los dígitos
function alPegar(e: ClipboardEvent) {
    const texto = e.clipboardData?.getData('text') ?? ''
    codigo.value = texto.replace(/\D/g, '').slice(0, LONGITUD_CODIGO)
    e.preventDefault()
}
</script>

<template>
    <form ref="contenedor" class="space-y-4" novalidate @submit.prevent="emit('verificar')">
        <div>
            <h3 class="text-lg font-semibold text-text-primary">{{ TEXTO_TITULO_CODIGO }}</h3>
            <p class="text-sm text-text-secondary">{{ TEXTO_EXPLICA_CODIGO }}</p>
            <p v-if="aviso" class="mt-2 text-xs text-text-secondary">{{ aviso }}</p>
        </div>
        <div @paste="alPegar">
            <CampoTexto id="portal-codigo" v-model="codigo" :etiqueta="ETIQUETA_CODIGO" tam-etiqueta="sm"
                inputmode="numeric" autocomplete="one-time-code" :maxlength="LONGITUD_CODIGO" :invalido="!!error" />
        </div>
        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
        <button type="submit" :disabled="cargando"
            class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 font-medium text-bg hover:opacity-90 disabled:opacity-50">
            <Spinner v-if="cargando" />
            {{ cargando ? TEXTO_BOTON_ENTRANDO : TEXTO_BOTON_VERIFICAR }}
        </button>
        <div class="flex items-center justify-between text-sm">
            <button type="button" :disabled="espera > 0 || cargando"
                class="text-accent hover:underline disabled:text-text-secondary disabled:no-underline"
                @click="emit('reenviar')">
                {{ espera > 0 ? `${TEXTO_ESPERA_REENVIO} ${espera} s` : TEXTO_BOTON_REENVIAR }}
            </button>
            <button type="button" class="text-text-secondary hover:text-text-primary" @click="emit('cambiarNumero')">
                {{ TEXTO_CAMBIAR_NUMERO }}
            </button>
        </div>
    </form>
</template>
