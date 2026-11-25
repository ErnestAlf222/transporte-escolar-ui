<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { Camera } from 'lucide-vue-next'
import CampoTexto from '@/shared/ui/CampoTexto.vue'
import SelectorImagen from '@/shared/ui/SelectorImagen.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import {
    MAX_CALLE,
    MAX_COLONIA,
    MAX_NUMERO,
    MAX_REFERENCIAS,
    TEXTO_DIRECCION_TITULO,
    ETIQUETA_CALLE,
    ETIQUETA_NUM_EXTERIOR,
    ETIQUETA_NUM_INTERIOR,
    ETIQUETA_COLONIA,
    ETIQUETA_REFERENCIAS,
    ETIQUETA_CODIGO_POSTAL,
    TEXTO_CP_AYUDA,
    TEXTO_ERROR_CALLE,
    TEXTO_ERROR_COLONIA,
    TEXTO_GUARDAR_DIRECCION,
    TEXTO_GUARDANDO,
    TEXTO_FOTO_DOMICILIO,
    TEXTO_FOTO_DOMICILIO_AYUDA,
    TEXTO_CAMBIAR_FOTO_DOMICILIO,
    TEXTO_AGREGAR_FOTO_DOMICILIO,
    TEXTO_SUBIENDO,
} from '@/features/portal-cliente/constants/perfil'
import type { DireccionPortal, CambiosDireccion } from '@/features/portal-cliente/types/perfil'

const props = defineProps<{ uid: number; direccion: DireccionPortal; guardando: boolean; subiendoFoto: boolean; error: string }>()
const emit = defineEmits<{
    guardar: [cambios: CambiosDireccion]
    fotoElegida: [archivo: File]
    errorFoto: [mensaje: string]
}>()

const form = reactive({ calle: '', numero_exterior: '', numero_interior: '', colonia: '', direccion_referencias: '' })
const intento = ref(false)

function cargarDesdeServidor() {
    form.calle = props.direccion.calle
    form.numero_exterior = props.direccion.numero_exterior ?? ''
    form.numero_interior = props.direccion.numero_interior ?? ''
    form.colonia = props.direccion.colonia
    form.direccion_referencias = props.direccion.direccion_referencias ?? ''
}
watch(() => props.direccion, cargarDesdeServidor, { immediate: true })

const errorCalle = computed(() => (intento.value && !form.calle.trim() ? TEXTO_ERROR_CALLE : ''))
const errorColonia = computed(() => (intento.value && !form.colonia.trim() ? TEXTO_ERROR_COLONIA : ''))

function guardar() {
    intento.value = true
    if (!form.calle.trim() || !form.colonia.trim()) return
    emit('guardar', {
        calle: form.calle.trim(),
        numero_exterior: form.numero_exterior.trim(),
        numero_interior: form.numero_interior.trim(),
        colonia: form.colonia.trim(),
        direccion_referencias: form.direccion_referencias.trim(),
    })
}
</script>

<template>
    <form class="space-y-3" novalidate @submit.prevent="guardar">
        <h3 class="text-sm font-semibold text-text-secondary">{{ TEXTO_DIRECCION_TITULO }}</h3>
        <CampoTexto :id="`calle-${uid}`" v-model="form.calle" :etiqueta="ETIQUETA_CALLE" :maxlength="MAX_CALLE"
            autocomplete="street-address" :invalido="!!errorCalle" :mensaje="errorCalle" />
        <div class="grid grid-cols-2 gap-3">
            <CampoTexto :id="`num-ext-${uid}`" v-model="form.numero_exterior" :etiqueta="ETIQUETA_NUM_EXTERIOR" :maxlength="MAX_NUMERO" />
            <CampoTexto :id="`num-int-${uid}`" v-model="form.numero_interior" :etiqueta="ETIQUETA_NUM_INTERIOR" :maxlength="MAX_NUMERO" />
        </div>
        <CampoTexto :id="`colonia-${uid}`" v-model="form.colonia" :etiqueta="ETIQUETA_COLONIA" :maxlength="MAX_COLONIA"
            :invalido="!!errorColonia" :mensaje="errorColonia" />
        <CampoTexto :id="`referencias-${uid}`" v-model="form.direccion_referencias" :etiqueta="ETIQUETA_REFERENCIAS"
            :maxlength="MAX_REFERENCIAS" />
        <div v-if="direccion.codigo_postal">
            <p class="text-xs text-text-secondary">{{ ETIQUETA_CODIGO_POSTAL }}</p>
            <p class="text-sm text-text-primary">{{ direccion.codigo_postal }}</p>
            <p class="text-xs text-text-muted">{{ TEXTO_CP_AYUDA }}</p>
        </div>
        <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
        <button type="submit" :disabled="guardando"
            class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50">
            <Spinner v-if="guardando" />
            {{ guardando ? TEXTO_GUARDANDO : TEXTO_GUARDAR_DIRECCION }}
        </button>

        <div class="space-y-2 border-t border-border pt-3">
            <p class="text-sm font-semibold text-text-secondary">{{ TEXTO_FOTO_DOMICILIO }}</p>
            <p class="text-xs text-text-muted">{{ TEXTO_FOTO_DOMICILIO_AYUDA }}</p>
            <img v-if="direccion.foto_domicilio_url" :src="direccion.foto_domicilio_url" :alt="TEXTO_FOTO_DOMICILIO" loading="lazy"
                class="max-h-48 w-full rounded-card border border-border object-cover" />
            <SelectorImagen :deshabilitado="subiendoFoto"
                clases="flex w-full items-center justify-center gap-2 rounded-card border border-border bg-panel py-2 text-sm font-medium text-text-primary hover:bg-panel-2 disabled:opacity-50"
                @elegida="emit('fotoElegida', $event)" @error="emit('errorFoto', $event)">
                <Spinner v-if="subiendoFoto" />
                <Camera v-else class="h-4 w-4" />
                {{ subiendoFoto ? TEXTO_SUBIENDO : direccion.foto_domicilio_url ? TEXTO_CAMBIAR_FOTO_DOMICILIO : TEXTO_AGREGAR_FOTO_DOMICILIO }}
            </SelectorImagen>
        </div>
    </form>
</template>
