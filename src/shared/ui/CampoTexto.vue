<script setup lang="ts">
// Campo de formulario con etiqueta, borde de error y mensaje. Reproduce el de Login, Familias y
// Casos especiales. El padre decide cuándo hay error (normalmente `tocado && error`):
// - `invalido` pinta el borde y el anillo de error.
// - `mensaje`, si trae texto, se muestra debajo en rojo.
// - `@blur` avisa que el campo perdió el foco (para marcarlo como tocado).
const modelo = defineModel<string>({ required: true })

withDefaults(
  defineProps<{
    id: string
    etiqueta: string
    // Tamaño del texto de la etiqueta: 'sm' (Login) o 'xs' (formularios internos)
    tamEtiqueta?: 'sm' | 'xs'
    type?: string
    inputmode?: 'text' | 'decimal' | 'numeric' | 'email' | 'tel'
    autocomplete?: string
    maxlength?: number
    placeholder?: string
    invalido?: boolean
    mensaje?: string
  }>(),
  {
    tamEtiqueta: 'xs',
    type: 'text',
    inputmode: undefined,
    autocomplete: undefined,
    maxlength: undefined,
    placeholder: undefined,
    invalido: false,
    mensaje: undefined,
  },
)

const emit = defineEmits<{ blur: [] }>()

// Clases completas (no armadas por pedazos) para que Tailwind las detecte
const CLASES_BASE =
  'mt-1 w-full rounded-card border bg-panel/40 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1'
const CLASES_ERROR = 'border-danger focus:border-danger focus:ring-danger'
const CLASES_NORMAL = 'border-border focus:border-accent focus:ring-accent'
const ETIQUETAS = { sm: 'block text-sm text-text-secondary', xs: 'block text-xs text-text-secondary' }
</script>

<template>
  <div>
    <label :class="ETIQUETAS[tamEtiqueta]" :for="id">{{ etiqueta }}</label>
    <input
      :id="id"
      v-model="modelo"
      :type="type"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :class="[CLASES_BASE, invalido ? CLASES_ERROR : CLASES_NORMAL]"
      @blur="emit('blur')" />
    <p v-if="mensaje" class="mt-1 text-xs text-danger">{{ mensaje }}</p>
  </div>
</template>
