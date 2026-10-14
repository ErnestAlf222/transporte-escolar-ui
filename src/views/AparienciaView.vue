<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Save, RotateCcw } from 'lucide-vue-next'
import { actualizarConfiguracion } from '@/api/configuracion'
import { useConfiguracion, aplicarConfiguracion } from '@/composables/useConfiguracion'
import Spinner from '@/components/Spinner.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'
import SelectorColor from '@/components/SelectorColor.vue'

const { configuracion } = useConfiguracion()

// Colores listos para elegir de un toque; el cuadro libre permite cualquier otro
const COLORES = ['#ff5c7a', '#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444']

const color = ref('')
const fuente = ref('')
const nombre = ref('')
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
            nombre.value.trim() !== configuracion.value.nombre_negocio),
)

// Al salir sin guardar, el sistema vuelve al color y la letra guardados: la prueba no se queda aplicada
onUnmounted(() => {
    if (configuracion.value) aplicarConfiguracion(configuracion.value)
})

// Vista previa en vivo: se ve el cambio antes de guardar
watch([color, fuente], () => aplicarConfiguracion({ color_acento: color.value, fuente: fuente.value }))

async function guardar(payload: { color_acento?: string; fuente?: string; nombre_negocio?: string }) {
    guardando.value = true
    mensaje.value = ''
    error.value = ''
    try {
        configuracion.value = await actualizarConfiguracion(payload)
        mensaje.value = 'Cambios guardados'
    } catch {
        error.value = 'No se pudieron guardar los cambios'
    } finally {
        guardando.value = false
    }
}

function restablecer() {
    color.value = ''
    guardar({ color_acento: '' })
}

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
                @click="guardar({ color_acento: color, fuente, nombre_negocio: nombre.trim() })">
                <Spinner v-if="guardando" />
                <Save v-else class="h-4 w-4" />
                Guardar
            </button>
        </div>
    </div>
</template>