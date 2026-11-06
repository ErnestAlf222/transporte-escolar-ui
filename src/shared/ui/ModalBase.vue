<script setup lang="ts">
// Cascarón de los modales de detalle (Cliente, Pago, Prospecto). Reproduce el original:
// - Va en el body (Teleport). Una sola capa `fixed inset-0 z-50` con el fondo negro, que centra la tarjeta.
// - Clic en el fondo (no en la tarjeta) emite `cerrar`.
// - Esc emite `cerrar` solo si el foco está dentro (la capa lleva tabindex -1, así que un clic dentro la
//   enfoca). No se mueve el foco al abrir ni al cerrar.
// - No bloquea el scroll del fondo.
// - Fondo: aparece/desaparece con un fundido; la tarjeta (el elemento raíz del slot) entra con `appear`
//   desde `opacity-0 scale-95`.
// La tarjeta va en el slot y debe ser UN solo elemento. El padre decide cuándo `abierto`.
defineProps<{ abierto: boolean }>()

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
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div
        v-if="abierto"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="emit('cerrar')"
        @keydown="alTeclaEsc"
        tabindex="-1">
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95">
          <slot />
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
