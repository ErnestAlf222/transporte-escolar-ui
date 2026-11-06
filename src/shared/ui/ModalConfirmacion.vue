<script setup lang="ts">
// Diálogo de confirmación centrado, con fondo difuminado. Se comporta como los originales de
// Familias y Casos especiales:
// - Va en el body (Teleport). Fondo z-40, contenedor z-50.
// - Clic en el fondo emite `cerrar`.
// - Esc emite `cerrar` solo si el foco está dentro del diálogo (el diálogo lleva tabindex -1,
//   así que un clic dentro lo enfoca). No se mueve el foco al abrir ni al cerrar.
// - No bloquea el scroll del fondo.
// El contenido (textos y botones) va en el slot; el padre decide cuándo cerrar.
withDefaults(
  defineProps<{
    // Muestra el fondo difuminado y, si `listo`, el diálogo
    abierto: boolean
    // Condición extra para mostrar el diálogo (el fondo solo depende de `abierto`)
    listo?: boolean
    // aria-label del diálogo
    etiqueta: string
  }>(),
  { listo: true },
)

const emit = defineEmits<{ cerrar: [] }>()

function alTeclaEsc(evento: KeyboardEvent) {
  if (evento.key === 'Escape') emit('cerrar')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0">
      <div
        v-if="abierto"
        class="fixed inset-0 z-40 bg-black/40 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
        @click="emit('cerrar')"></div>
    </Transition>

    <div class="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
      <Transition
        enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0 scale-50"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-50">
        <div
          v-if="abierto && listo"
          role="dialog"
          :aria-label="etiqueta"
          tabindex="-1"
          class="pointer-events-auto w-full max-w-md space-y-4 rounded-card border border-border bg-panel p-5 shadow-xl shadow-black/40"
          @keydown="alTeclaEsc">
          <slot />
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
