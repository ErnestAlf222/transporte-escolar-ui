<script setup lang="ts">
import { useNavegacionStore } from '@/stores/navegacion'
import LoaderVan from '@/components/LoaderVan.vue'

const navegacion = useNavegacionStore()
</script>

<template>
  <LoaderVan v-if="navegacion.cargandoPantalla" />
  <router-view />
</template>

<style scoped></style>