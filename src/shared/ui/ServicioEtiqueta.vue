<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-vue-next'
import { servicioDe, textoServicio } from '@/shared/utils/servicio'

// El servicio que necesita el alumno (ida y vuelta, solo ida o solo vuelta), como texto sutil que se entiende solo
const props = defineProps<{ servicio?: string | null }>()

const valor = computed(() => servicioDe(props.servicio))
const texto = computed(() => textoServicio(props.servicio))
</script>

<template>
    <span class="inline-flex items-center gap-1.5 text-xs text-text-secondary">
        <ArrowRightLeft v-if="valor === 'completo'" class="h-3.5 w-3.5 shrink-0 text-servicio" aria-hidden="true" />
        <ArrowRight v-else-if="valor === 'ida'" class="h-3.5 w-3.5 shrink-0 text-servicio" aria-hidden="true" />
        <ArrowLeft v-else class="h-3.5 w-3.5 shrink-0 text-servicio" aria-hidden="true" />
        {{ texto }}
    </span>
</template>
