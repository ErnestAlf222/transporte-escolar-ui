<script setup lang="ts">
import { TEXTO_FAMILIA_SIN_ESCUELA } from '@/features/portal-cliente/constants/portal'
import type { AlumnoPortal } from '@/features/portal-cliente/types/portal'
import { inicialesAlumno, nombreCompleto } from '@/shared/utils/nombres'

defineProps<{ alumnos: AlumnoPortal[] }>()
</script>

<template>
    <ul class="space-y-2">
        <li v-for="(a, i) in alumnos" :key="a.id" class="glass-plano entra-suave flex items-center gap-3 rounded-card p-4"
            :style="{ '--i': i }">
            <img v-if="a.foto_url" :src="a.foto_url" :alt="nombreCompleto(a)" loading="lazy"
                class="h-12 w-12 shrink-0 rounded-full object-cover" />
            <span v-else aria-hidden="true"
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-bg">
                {{ inicialesAlumno(a) }}
            </span>
            <div class="min-w-0">
                <p class="truncate font-medium text-text-primary">{{ nombreCompleto(a) }}</p>
                <p class="truncate text-sm text-text-secondary">{{ a.escuela?.nombre ?? TEXTO_FAMILIA_SIN_ESCUELA }}</p>
            </div>
        </li>
    </ul>
</template>
