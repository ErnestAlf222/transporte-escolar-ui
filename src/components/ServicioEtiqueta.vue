<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-vue-next'
import { servicioDe, tituloServicio } from '@/utils/servicio'

const props = defineProps<{ servicio?: string | null }>()

const valor = computed(() => servicioDe(props.servicio))
const titulo = computed(() => tituloServicio(props.servicio))
</script>

<template>
    <span
        class="inline-flex items-center gap-1.5 rounded-full border border-servicio/30 bg-servicio/15 px-2.5 py-1 text-xs font-medium text-servicio">
        <ArrowRightLeft v-if="valor === 'completo'" class="h-3.5 w-3.5" />
        <ArrowRight v-else-if="valor === 'ida'" class="h-3.5 w-3.5" />
        <ArrowLeft v-else class="h-3.5 w-3.5" />
        {{ titulo }}
    </span>
</template>