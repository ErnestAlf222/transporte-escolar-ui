<script setup lang="ts">
import { useBienvenida } from '@/shared/composables/useBienvenida'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import LoaderVanJuego from '@/shared/ui/LoaderVanJuego.vue'

// Bienvenida a pantalla completa: el loader de la camioneta con el tema vigente (y su mensaje festivo si hay)
const { visible, saludo } = useBienvenida()
const { configuracion } = useConfiguracion()
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg p-4">
    <LoaderVanJuego :texto="configuracion?.nombre_negocio ?? ''" />
    <div v-if="saludo" class="text-center">
      <p class="text-lg font-semibold text-text-primary">{{ saludo.titulo }}</p>
      <p v-if="saludo.detalle" class="mt-1 text-sm text-text-secondary">{{ saludo.detalle }}</p>
    </div>
  </div>
</template>
