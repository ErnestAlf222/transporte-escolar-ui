<script setup lang="ts">
import { ref } from 'vue'
import { Search, X } from 'lucide-vue-next'

const modelo = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    placeholder: string
    // Fondo del campo: 'panel' (bg-panel), 'panel/40' (bg-panel/40) o 'panel-2' (bg-panel-2)
    fondo?: 'panel' | 'panel/40' | 'panel-2'
    // Borde y anillo de color de acento al enfocar
    conFoco?: boolean
    // aria-label del botón de borrar; sin él, el botón no lleva aria-label
    etiquetaLimpiar?: string
    // Tras borrar (botón o Esc) el cursor vuelve al campo, y Esc dentro del campo también borra
    limpiarConEsc?: boolean
  }>(),
  { fondo: 'panel', conFoco: false, etiquetaLimpiar: undefined, limpiarConEsc: false },
)

// Clases completas (no armadas por pedazos) para que Tailwind las detecte
const FONDOS = { panel: 'bg-panel', 'panel/40': 'bg-panel/40', 'panel-2': 'bg-panel-2' }
const CLASES_FOCO = 'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

const campo = ref<HTMLInputElement | null>(null)

function limpiar() {
  modelo.value = ''
  if (props.limpiarConEsc) campo.value?.focus()
}
</script>

<template>
  <div class="relative">
    <Search
      class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
    <input
      ref="campo"
      v-model="modelo"
      type="text"
      :placeholder="placeholder"
      class="w-full rounded-card border border-border py-2 pl-9 pr-8 text-sm text-text-primary"
      :class="[FONDOS[fondo], conFoco ? CLASES_FOCO : '']"
      @keydown.esc="limpiarConEsc && limpiar()" />
    <button
      v-if="modelo"
      type="button"
      :aria-label="etiquetaLimpiar"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
      @click="limpiar">
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
