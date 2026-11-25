<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'
import TarjetaPortal from '@/features/portal-cliente/components/TarjetaPortal.vue'
import { TEXTO_FAMILIA_SIN_ESCUELA } from '@/features/portal-cliente/constants/portal'
import type { AlumnoPortal } from '@/features/portal-cliente/types/portal'
import { inicialesAlumno, nombreCompleto } from '@/shared/utils/nombres'

defineProps<{ alumnos: AlumnoPortal[] }>()
</script>

<template>
    <ul class="space-y-3">
        <li v-for="(a, i) in alumnos" :key="a.id" class="entra-suave" :style="{ '--i': i }">
            <TarjetaPortal class="flex items-center gap-4">
                <img v-if="a.foto_url" :src="a.foto_url" :alt="nombreCompleto(a)" loading="lazy"
                    class="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-accent/40" />
                <span v-else aria-hidden="true"
                    class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-extrabold text-bg">
                    {{ inicialesAlumno(a) }}
                </span>
                <div class="min-w-0 space-y-1.5">
                    <p class="text-base font-bold text-text-primary">{{ nombreCompleto(a) }}</p>
                    <span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1 text-xs font-medium text-text-secondary">
                        <GraduationCap class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span class="truncate">{{ a.escuela?.nombre ?? TEXTO_FAMILIA_SIN_ESCUELA }}</span>
                    </span>
                </div>
            </TarjetaPortal>
        </li>
    </ul>
</template>
