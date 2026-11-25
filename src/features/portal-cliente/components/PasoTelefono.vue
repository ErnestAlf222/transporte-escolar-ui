<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import {
    ETIQUETA_TELEFONO,
    TEXTO_SUBTITULO_TELEFONO,
    TEXTO_BOTON_CONTINUAR,
    TEXTO_BOTON_ENTRANDO,
} from '@/features/portal-cliente/constants/portal'
import { LONGITUD_TELEFONO } from '@/shared/constants/telefono'

const telefono = defineModel<string>({ required: true })
defineProps<{ error: string; cargando: boolean }>()
const emit = defineEmits<{ continuar: [] }>()

const contenedor = ref<HTMLElement | null>(null)
// Foco al abrir la pantalla
onMounted(() => contenedor.value?.querySelector('input')?.focus())
</script>

<template>
    <form ref="contenedor" class="space-y-4" novalidate @submit.prevent="emit('continuar')">
        <p class="text-sm text-text-secondary">{{ TEXTO_SUBTITULO_TELEFONO }}</p>
        <CampoTexto id="portal-telefono" v-model="telefono" :etiqueta="ETIQUETA_TELEFONO" tam-etiqueta="sm" type="tel"
            inputmode="tel" autocomplete="tel-national" :maxlength="LONGITUD_TELEFONO + 6" :invalido="!!error" />
        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
        <button type="submit" :disabled="cargando"
            class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 font-medium text-bg hover:opacity-90 disabled:opacity-50">
            <Spinner v-if="cargando" />
            {{ cargando ? TEXTO_BOTON_ENTRANDO : TEXTO_BOTON_CONTINUAR }}
        </button>
    </form>
</template>
