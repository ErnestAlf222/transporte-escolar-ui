<script setup lang="ts">
import { useBienvenida } from '@/shared/composables/useBienvenida'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import LoaderVanJuego from '@/shared/ui/LoaderVanJuego.vue'

// Bienvenida a pantalla completa: el loader de la camioneta con el tema vigente (y su mensaje festivo si hay)
const { visible } = useBienvenida()
const { configuracion } = useConfiguracion()
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-bg p-4">
    <LoaderVanJuego :texto="configuracion?.nombre_negocio ?? ''" />
  </div>
</template>
