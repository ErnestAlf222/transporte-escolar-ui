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
            class="flex-1 rounded-full py-2 text-center text-sm font-medium text-text-secondary hover:text-text-primary"
            active-class="!bg-accent !text-bg">
            {{ e.texto }}
        </RouterLink>
    </nav>
</template>
