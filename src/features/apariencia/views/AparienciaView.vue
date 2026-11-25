<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Save, RotateCcw } from 'lucide-vue-next'
import { actualizarConfiguracion } from '@/shared/api/configuracion'
import type { ActualizarConfiguracionPayload } from '@/shared/types/configuracion'
import { useConfiguracion, aplicarConfiguracion } from '@/shared/composables/useConfiguracion'
import { MESES_CORTOS, TEMAS_DISPONIBLES, TEMA_NORMAL } from '@/shared/constants/temasLoader'
import { mensajeDeError } from '@/shared/utils/errores'
import { useAuthStore } from '@/features/auth'
import LoaderVan from '@/shared/ui/LoaderVan.vue'
import Spinner from '@/shared/ui/Spinner.vue'
import DropdownSelect from '@/shared/ui/DropdownSelect.vue'
import SelectorColor from '@/features/apariencia/components/SelectorColor.vue'
import DatosPagoSeccion from '@/features/apariencia/components/DatosPagoSeccion.vue'
import { TEXTOS_TEMPORADAS } from '@/features/apariencia/constants/apariencia'

const { configuracion } = useConfiguracion()
const auth = useAuthStore()

// Colores listos para elegir de un toque; el cuadro libre permite cualquier otro
const COLORES = ['#ff5c7a', '#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444']

const color = ref('')
const fuente = ref('')
const nombre = ref('')
const temaLoader = ref(TEMA_NORMAL)
const guardando = ref(false)
const mensaje = ref('')
const error = ref('')

// Lo guardado hoy: la pantalla parte de ahí y avisa si hay cambios sin guardar
watch(
    configuracion,
    (c) => {
        if (!c) return
        color.value = c.color_acento
        fuente.value = c.fuente
        nombre.value = c.nombre_negocio
        temaLoader.value = c.tema_loader ?? TEMA_NORMAL
    },
    { immediate: true },
)

const nombreValido = computed(() => nombre.value.trim().length > 0 && nombre.value.trim().length <= 60)

const hayCambios = computed(
    () =>
        !!configuracion.value &&
        nombreValido.value &&
        (color.value !== configuracion.value.color_acento ||
            fuente.value !== configuracion.value.fuente ||
            nombre.value.trim() !== configuracion.value.nombre_negocio ||
            temaLoader.value !== (configuracion.value.tema_loader ?? TEMA_NORMAL)),
)

// Al salir sin guardar, el sistema vuelve al color y la letra guardados: la prueba no se queda aplicada
onUnmounted(() => {
    if (configuracion.value) aplicarConfiguracion(configuracion.value)
})

// Vista previa en vivo: se ve el cambio antes de guardar
watch([color, fuente], () => aplicarConfiguracion({ color_acento: color.value, fuente: fuente.value }))

async function guardar(payload: ActualizarConfiguracionPayload) {
    guardando.value = true
    mensaje.value = ''
    error.value = ''
    try {
        configuracion.value = await actualizarConfiguracion(payload)
        mensaje.value = 'Cambios guardados'
    } catch (e) {
        error.value = mensajeDeError(e, TEXTOS_TEMPORADAS.errorGuardar)
    } finally {
        guardando.value = false
    }
}

function restablecer() {
    color.value = ''
    guardar({ color_acento: '' })
}

// "Normal" y luego los temas disponibles, en orden de calendario
const opcionesTema = [
    {
        id: TEMA_NORMAL,
        nombre: TEXTOS_TEMPORADAS.normal,
        descripcion: TEXTOS_TEMPORADAS.normalDescripcion,
        mes: TEXTOS_TEMPORADAS.normalMes,
    },
    ...TEMAS_DISPONIBLES.map((t) => ({ id: t.id, nombre: t.nombre, descripcion: t.descripcion, mes: MESES_CORTOS[t.mes - 1]! })),
]

const temaElegido = computed(() => opcionesTema.find((t) => t.id === temaLoader.value) ?? opcionesTema[0]!)

// Las letras vienen de la API, así la lista vive en un solo lugar
const opcionesFuente = computed(() =>
    (configuracion.value?.fuentes_disponibles ?? []).map((f) => ({ value: f, label: f })),
)
</script>

<template>
    <h1 class="text-2xl font-semibold">Apariencia</h1>

    <div v-if="configuracion" class="mt-6 max-w-xl space-y-6 lg:max-w-5xl">
        <div class="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
            <div class="space-y-6">
                <div class="glass space-y-3 rounded-card p-4">
                    <label class="block text-sm font-medium text-text-primary" for="nombre-negocio">Nombre del
                        negocio</label>
                    <p class="text-xs text-text-secondary">Se ve en el menú y en la pestaña del navegador.</p>
                    <input id="nombre-negocio" v-model="nombre" type="text" maxlength="60"
                        class="w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                </div>

                <div class="glass space-y-3 rounded-card p-4">
                    <p class="text-sm font-medium text-text-primary">Color principal</p>
                    <p class="text-xs text-text-secondary">Botones, menú y filtros del sistema.</p>
                    <div class="flex flex-wrap items-center gap-2">
                        <button v-for="c in COLORES" :key="c" type="button" :aria-label="`Color ${c}`"
                            class="h-9 w-9 rounded-full border-2 transition"
                            :class="color.toLowerCase() === c ? 'border-text-primary' : 'border-transparent'"
                            :style="{ backgroundColor: c }" @click="color = c" />
                    </div>
                    <SelectorColor v-model="color" />
                </div>
            </div>

            <div class="space-y-6">
                <div class="glass relative z-10 space-y-3 rounded-card p-4">
                    <p class="text-sm font-medium text-text-primary">Tipo de letra</p>
                    <DropdownSelect v-model="fuente" :opciones="opcionesFuente" :columnas="2" />
                </div>

                <div class="glass space-y-3 rounded-card p-4">
                    <p class="text-sm font-medium text-text-primary">Vista previa</p>
                    <div class="flex flex-wrap items-center gap-2">
                        <button type="button" class="rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg">
                            Botón
                        </button>
                        <span
                            class="rounded-card bg-accent/15 px-2 py-1 text-xs font-medium text-accent">Etiqueta</span>
                        <span
                            class="rounded-card border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-text-primary">
                            Filtro activo
                        </span>
                    </div>
                    <p class="text-sm text-text-secondary">Así se ven los textos con la letra elegida.</p>
                </div>
            </div>
        </div>

        <div class="glass space-y-3 rounded-card p-4">
            <p class="text-sm font-medium text-text-primary">{{ TEXTOS_TEMPORADAS.titulo }}</p>
            <p class="text-xs text-text-secondary">{{ TEXTOS_TEMPORADAS.ayuda }}</p>
            <div class="flex flex-col items-center gap-2 rounded-card bg-panel-2 px-4 pb-3 pt-4">
                <LoaderVan variante="escena" :tema="temaLoader" />
                <p class="text-sm font-medium text-text-primary">{{ temaElegido.nombre }}</p>
                <p class="text-xs text-text-secondary">{{ temaElegido.descripcion }}</p>
            </div>
            <div role="radiogroup" :aria-label="TEXTOS_TEMPORADAS.titulo"
                class="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-5">
                <button v-for="t in opcionesTema" :key="t.id" type="button" role="radio"
                    :aria-checked="temaLoader === t.id"
                    class="flex flex-col items-center gap-0.5 rounded-card border px-1 pb-2 pt-8 text-center text-xs font-medium transition"
                    :class="temaLoader === t.id ? 'border-accent bg-accent/15 text-accent' : 'border-border text-text-secondary hover:bg-panel-2'"
                    @click="temaLoader = t.id">
                    <LoaderVan variante="compacto" :tema="t.id" />
                    {{ t.nombre }}
                    <span class="text-[11px] font-normal opacity-80">{{ t.mes }}</span>
                </button>
            </div>
        </div>

        <DatosPagoSeccion :puede-editar="auth.rol === 'admin'" />

        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <p v-else-if="mensaje" class="text-sm text-mint">{{ mensaje }}</p>

        <div class="flex flex-wrap items-center justify-between gap-3">
            <button type="button" :disabled="guardando"
                class="flex items-center gap-2 rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2 disabled:opacity-50"
                @click="restablecer">
                <RotateCcw class="h-4 w-4" />
                Color original
            </button>
            <button type="button" :disabled="!hayCambios || guardando"
                class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                @click="guardar({ color_acento: color, fuente, nombre_negocio: nombre.trim(), tema_loader: temaLoader })">
                <Spinner v-if="guardando" />
                <Save v-else class="h-4 w-4" />
                Guardar
            </button>
        </div>
    </div>
</template>