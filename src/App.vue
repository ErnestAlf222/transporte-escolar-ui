<script setup lang="ts">
import { onMounted } from 'vue'
import { useNavegacionStore } from '@/shared/stores/navegacion'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import LoaderVan from '@/shared/ui/LoaderVan.vue'

const navegacion = useNavegacionStore()
const { cargar } = useConfiguracion()

onMounted(cargar)
</script>

<template>
  <LoaderVan v-if="navegacion.cargandoPantalla" />
  <router-view />
</template>

<style scoped></style>