<script setup lang="ts">
import { Check, CircleAlert } from 'lucide-vue-next'
import { useAviso } from '@/shared/composables/useAviso'

// Aviso breve en la parte baja de la pantalla; se oculta solo
const { aviso } = useAviso()
</script>

<template>
  <Transition enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-2 motion-reduce:translate-y-0" enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in motion-reduce:transition-none" leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div v-if="aviso" :key="aviso.texto" :role="aviso.tipo === 'error' ? 'alert' : 'status'"
      class="glass pointer-events-none fixed inset-x-4 bottom-20 z-[60] mx-auto flex max-w-sm items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm text-text-primary">
      <CircleAlert v-if="aviso.tipo === 'error'" class="h-4 w-4 shrink-0 text-danger" />
      <Check v-else class="h-4 w-4 shrink-0 text-mint" />
      {{ aviso.texto }}
    </div>
  </Transition>
</template>
