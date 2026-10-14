<script setup lang="ts">
import { onMounted } from 'vue'
import { useNavegacionStore } from '@/stores/navegacion'
import { useConfiguracion } from '@/composables/useConfiguracion'
import LoaderVan from '@/components/LoaderVan.vue'

const navegacion = useNavegacionStore()
const { cargar } = useConfiguracion()

onMounted(cargar)
</script>

<template>
  <LoaderVan v-if="navegacion.cargandoPantalla" />
  <router-view />
</template>

<style scoped></style>