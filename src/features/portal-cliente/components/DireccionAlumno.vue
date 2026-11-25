<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { Camera, Home, MapPin } from 'lucide-vue-next'
import BotonRelieve from '@/features/portal-cliente/components/BotonRelieve.vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'
import SelectorImagen from '@/shared/ui/SelectorImagen.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import {
    MAX_CALLE,
    MAX_COLONIA,
    MAX_NUMERO,
    MAX_REFERENCIAS,
    TEXTO_DIRECCION_LUGAR,
    TEXTO_DIRECCION_AYUDA,
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
    <form class="space-y-6" novalidate @submit.prevent="guardar">
        <div class="space-y-1">
            <h3 class="flex items-center gap-2 text-base font-bold text-text-primary">
                <MapPin class="h-5 w-5 text-accent" aria-hidden="true" />
                {{ TEXTO_DIRECCION_LUGAR }}
            </h3>
            <p class="text-sm text-text-secondary">{{ TEXTO_DIRECCION_AYUDA }}</p>
        </div>

        <div class="space-y-5">
            <CampoTexto :id="`calle-${uid}`" v-model="form.calle" :etiqueta="ETIQUETA_CALLE" :maxlength="MAX_CALLE"
                autocomplete="street-address" tam-etiqueta="sm" :invalido="!!errorCalle" :mensaje="errorCalle" />
            <div class="grid grid-cols-2 gap-4">
                <CampoTexto :id="`num-ext-${uid}`" v-model="form.numero_exterior" :etiqueta="ETIQUETA_NUM_EXTERIOR"
                    tam-etiqueta="sm" :maxlength="MAX_NUMERO" />
                <CampoTexto :id="`num-int-${uid}`" v-model="form.numero_interior" :etiqueta="ETIQUETA_NUM_INTERIOR"
                    tam-etiqueta="sm" :maxlength="MAX_NUMERO" />
            </div>
            <CampoTexto :id="`colonia-${uid}`" v-model="form.colonia" :etiqueta="ETIQUETA_COLONIA" :maxlength="MAX_COLONIA"
                tam-etiqueta="sm" :invalido="!!errorColonia" :mensaje="errorColonia" />
            <CampoTexto :id="`referencias-${uid}`" v-model="form.direccion_referencias" :etiqueta="ETIQUETA_REFERENCIAS"
                tam-etiqueta="sm" :maxlength="MAX_REFERENCIAS" />
            <div v-if="direccion.codigo_postal" class="rounded-2xl bg-panel-2 px-4 py-3">
                <p class="text-xs font-bold uppercase tracking-wide text-text-muted">{{ ETIQUETA_CODIGO_POSTAL }}</p>
                <p class="text-base font-bold text-text-primary">{{ direccion.codigo_postal }}</p>
                <p class="text-xs text-text-secondary">{{ TEXTO_CP_AYUDA }}</p>
            </div>
        </div>

        <p v-if="error" role="alert" class="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{{ error }}</p>
        <BotonRelieve tipo="submit" :deshabilitado="guardando">
            <Spinner v-if="guardando" />
            {{ guardando ? TEXTO_GUARDANDO : TEXTO_GUARDAR_DIRECCION }}
        </BotonRelieve>

        <div class="space-y-3 rounded-2xl border border-dashed border-border p-4">
            <div class="space-y-1">
                <p class="flex items-center gap-2 text-base font-bold text-text-primary">
                    <Home class="h-5 w-5 text-accent" aria-hidden="true" />
                    {{ TEXTO_FOTO_DOMICILIO }}
                </p>
                <p class="text-sm text-text-secondary">{{ TEXTO_FOTO_DOMICILIO_AYUDA }}</p>
            </div>
            <img v-if="direccion.foto_domicilio_url" :src="direccion.foto_domicilio_url" :alt="TEXTO_FOTO_DOMICILIO" loading="lazy"
                class="max-h-56 w-full rounded-2xl border border-border object-cover" />
            <SelectorImagen :deshabilitado="subiendoFoto"
                clases="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-panel px-4 py-3 text-sm font-bold text-text-primary shadow-[0_3px_0_0_var(--color-border)] transition-[transform,box-shadow] duration-100 hover:bg-panel-2 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:translate-y-0"
                @elegida="emit('fotoElegida', $event)" @error="emit('errorFoto', $event)">
                <Spinner v-if="subiendoFoto" />
                <Camera v-else class="h-5 w-5" />
                {{ subiendoFoto ? TEXTO_SUBIENDO : direccion.foto_domicilio_url ? TEXTO_CAMBIAR_FOTO_DOMICILIO : TEXTO_AGREGAR_FOTO_DOMICILIO }}
            </SelectorImagen>
        </div>
    </form>
</template>
