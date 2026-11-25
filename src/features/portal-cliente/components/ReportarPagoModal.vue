<script setup lang="ts">
import { watch } from 'vue'
import { Check, CircleAlert, Camera } from 'lucide-vue-next'
import ModalBase from '@/shared/ui/ModalBase.vue'
import SelectorImagen from '@/shared/ui/SelectorImagen.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import { useReportarPago } from '@/features/portal-cliente/composables/useReportarPago'
import {
    MAX_NOTA_PAGO,
    TEXTO_REPORTAR_TITULO,
    TEXTO_REPORTAR_ALUMNOS,
    TEXTO_REPORTAR_METODO,
    TEXTO_METODO_TARJETA,
    TEXTO_METODO_EFECTIVO,
    TEXTO_REPORTAR_CAPTURA,
    TEXTO_REPORTAR_ELEGIR_CAPTURA,
    TEXTO_REPORTAR_CAMBIAR_CAPTURA,
    TEXTO_REPORTAR_CAPTURA_AYUDA,
    TEXTO_REPORTAR_NOTA,
    TEXTO_REPORTAR_FECHA_FIJA,
    TEXTO_REPORTAR_ENVIAR,
    TEXTO_REPORTAR_AVANCE,
    TEXTO_REPORTAR_CERRAR,
    TEXTO_REPORTAR_LISTO,
    TEXTO_REPORTAR_FALLOS,
    TEXTO_REPORTAR_REINTENTAR,
    TEXTO_ESTADO_ENVIADO,
} from '@/features/portal-cliente/constants/perfil'
import type { AlumnoResumenPortal } from '@/features/portal-cliente/types/portal'

const props = defineProps<{ abierto: boolean; alumnos: AlumnoResumenPortal[]; esTutor: boolean }>()
const emit = defineEmits<{ cerrar: []; reportado: [] }>()

const f = useReportarPago(() => props.alumnos, () => emit('reportado'))

// Cada vez que se abre, el formulario empieza limpio
watch(() => props.abierto, (abierto) => abierto && f.reiniciar(), { immediate: true })

function cerrar() {
    if (!f.enviando.value) emit('cerrar')
}

const CLASES_METODO = 'flex-1 rounded-card border px-3 py-2 text-sm font-medium disabled:opacity-50'
const CLASES_METODO_ON = 'border-accent bg-accent/10 text-text-primary'
const CLASES_METODO_OFF = 'border-border bg-panel text-text-secondary hover:bg-panel-2'
</script>

<template>
    <ModalBase :abierto="abierto" @cerrar="cerrar">
        <form class="glass max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-card bg-panel p-5" novalidate
            @submit.prevent="f.enviar">
            <h2 class="text-lg font-semibold text-text-primary">{{ TEXTO_REPORTAR_TITULO }}</h2>

            <template v-if="f.terminado.value">
                <div role="status" class="flex items-start gap-2 rounded-card bg-mint/10 p-4 text-sm text-mint">
                    <Check class="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{{ TEXTO_REPORTAR_LISTO }}</p>
                </div>
                <button type="button" class="w-full rounded-card bg-accent py-2 font-medium text-bg hover:opacity-90"
                    @click="emit('cerrar')">
                    {{ TEXTO_REPORTAR_CERRAR }}
                </button>
            </template>

            <template v-else>
                <fieldset v-if="esTutor" class="space-y-2" :disabled="f.enviando.value">
                    <legend class="text-sm font-medium text-text-secondary">{{ TEXTO_REPORTAR_ALUMNOS }}</legend>
                    <label v-for="a in f.elegibles.value" :key="a.id"
                        class="flex items-center gap-3 rounded-card border border-border bg-panel-2 px-3 py-2 text-sm text-text-primary">
                        <input v-model="f.seleccion.value" type="checkbox" :value="a.id"
                            :disabled="f.estados.value[a.id]?.estado === 'ok'" class="h-4 w-4 accent-accent" />
                        <span class="min-w-0 flex-1 truncate">{{ a.nombre }}</span>
                        <Check v-if="f.estados.value[a.id]?.estado === 'ok'" class="h-4 w-4 text-mint" />
                        <Spinner v-else-if="f.estados.value[a.id]?.estado === 'enviando'" />
                    </label>
                    <p v-for="a in f.elegibles.value.filter((x) => f.estados.value[x.id]?.estado === 'error')" :key="a.id"
                        role="alert" class="flex items-start gap-1.5 text-xs text-danger">
                        <CircleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{{ a.nombre }}: {{ f.estados.value[a.id]?.error }}</span>
                    </p>
                </fieldset>
                <p v-else-if="f.estados.value[alumnos[0]?.id ?? 0]?.error" role="alert" class="text-sm text-danger">
                    {{ f.estados.value[alumnos[0]!.id]?.error }}
                </p>

                <fieldset class="space-y-2" :disabled="f.enviando.value">
                    <legend class="text-sm font-medium text-text-secondary">{{ TEXTO_REPORTAR_METODO }}</legend>
                    <div class="flex gap-2">
                        <button type="button" :class="[CLASES_METODO, f.metodo.value === 'digital' ? CLASES_METODO_ON : CLASES_METODO_OFF]"
                            :aria-pressed="f.metodo.value === 'digital'" @click="f.metodo.value = 'digital'">
                            {{ TEXTO_METODO_TARJETA }}
                        </button>
                        <button type="button" :class="[CLASES_METODO, f.metodo.value === 'efectivo' ? CLASES_METODO_ON : CLASES_METODO_OFF]"
                            :aria-pressed="f.metodo.value === 'efectivo'" @click="f.metodo.value = 'efectivo'">
                            {{ TEXTO_METODO_EFECTIVO }}
                        </button>
                    </div>
                </fieldset>

                <div v-if="f.metodo.value === 'digital'" class="space-y-2">
                    <p class="text-sm font-medium text-text-secondary">{{ TEXTO_REPORTAR_CAPTURA }}</p>
                    <img v-if="f.urlPrevia.value" :src="f.urlPrevia.value" :alt="TEXTO_REPORTAR_CAPTURA"
                        class="max-h-64 w-full rounded-card border border-border object-contain" />
                    <p v-else class="text-xs text-text-muted">{{ TEXTO_REPORTAR_CAPTURA_AYUDA }}</p>
                    <SelectorImagen :deshabilitado="f.enviando.value"
                        clases="flex w-full items-center justify-center gap-2 rounded-card border border-border bg-panel-2 py-2 text-sm font-medium text-text-primary hover:bg-panel disabled:opacity-50"
                        @elegida="f.ponerCaptura" @error="f.errorCaptura.value = $event">
                        <Camera class="h-4 w-4" />
                        {{ f.urlPrevia.value ? TEXTO_REPORTAR_CAMBIAR_CAPTURA : TEXTO_REPORTAR_ELEGIR_CAPTURA }}
                    </SelectorImagen>
                    <p v-if="f.errorCaptura.value" role="alert" class="text-xs text-danger">{{ f.errorCaptura.value }}</p>
                </div>

                <label class="block text-sm font-medium text-text-secondary">
                    {{ TEXTO_REPORTAR_NOTA }}
                    <textarea v-model="f.nota.value" rows="2" :maxlength="MAX_NOTA_PAGO" :disabled="f.enviando.value"
                        class="mt-1 w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"></textarea>
                </label>

                <p class="rounded-card bg-panel-2 px-3 py-2 text-xs text-text-secondary">{{ TEXTO_REPORTAR_FECHA_FIJA }}</p>

                <p v-if="f.error.value" role="alert" class="text-sm text-danger">{{ f.error.value }}</p>
                <p v-if="f.hayFallos.value && !f.enviando.value" role="alert" class="text-sm text-danger">
                    {{ TEXTO_REPORTAR_FALLOS }}
                </p>

                <div class="flex gap-2">
                    <button type="button" :disabled="f.enviando.value"
                        class="flex-1 rounded-card border border-border bg-panel py-2 text-sm font-medium text-text-primary hover:bg-panel-2 disabled:opacity-50"
                        @click="cerrar">
                        {{ TEXTO_REPORTAR_CERRAR }}
                    </button>
                    <button type="submit" :disabled="f.enviando.value || (f.metodo.value === 'digital' && !f.captura.value)"
                        class="flex flex-1 items-center justify-center gap-2 rounded-card bg-accent py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50">
                        <Spinner v-if="f.enviando.value" />
                        {{ f.enviando.value ? TEXTO_REPORTAR_AVANCE(f.hechos.value + 1, f.seleccion.value.length)
                            : f.hayFallos.value ? TEXTO_REPORTAR_REINTENTAR : TEXTO_REPORTAR_ENVIAR }}
                    </button>
                </div>
                <p v-if="f.hechos.value > 0 && !f.terminado.value" class="text-xs text-text-secondary">
                    {{ TEXTO_ESTADO_ENVIADO }}: {{ f.hechos.value }}
                </p>
            </template>
        </form>
    </ModalBase>
</template>
