<script setup lang="ts">
import {
    NOMBRE_RUTA_PORTAL_INICIO,
} from '@/features/portal-cliente/constants/portal'
import {
    NOMBRE_RUTA_PORTAL_PERFIL,
    TEXTO_NAV_INICIO,
    TEXTO_NAV_PERFIL,
    TEXTO_NAV_ETIQUETA,
} from '@/features/portal-cliente/constants/perfil'

const ENLACES = [
    { nombre: NOMBRE_RUTA_PORTAL_INICIO, texto: TEXTO_NAV_INICIO },
    { nombre: NOMBRE_RUTA_PORTAL_PERFIL, texto: TEXTO_NAV_PERFIL },
]
</script>

<template>
    <nav :aria-label="TEXTO_NAV_ETIQUETA" class="glass-plano mx-auto flex w-full max-w-md gap-1 rounded-full p-1 lg:mx-0">
        <RouterLink v-for="e in ENLACES" :key="e.nombre" :to="{ name: e.nombre }"
            class="flex min-h-11 flex-1 items-center justify-center rounded-full text-center text-sm font-bold text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
            active-class="!bg-accent !text-bg">
            {{ e.texto }}
        </RouterLink>
    </nav>
</template>
