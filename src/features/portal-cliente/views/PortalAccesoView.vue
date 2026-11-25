<script setup lang="ts">
import { usePortalAcceso } from '@/features/portal-cliente/composables/usePortalAcceso'
import PasoTelefono from '@/features/portal-cliente/components/PasoTelefono.vue'
import PasoCodigo from '@/features/portal-cliente/components/PasoCodigo.vue'
import { TEXTO_TITULO_ACCESO } from '@/features/portal-cliente/constants/portal'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import LoaderVan from '@/shared/ui/LoaderVan.vue'

const { configuracion } = useConfiguracion()
const { paso, telefono, codigo, error, aviso, cargando, espera, continuarConTelefono, verificar, reenviar, cambiarNumero } =
    usePortalAcceso()
</script>

<template>
    <div class="flex min-h-screen items-center justify-center p-4">
        <div class="glass w-full max-w-md space-y-6 rounded-card p-8">
            <header class="text-center">
                <LoaderVan variante="inline" class="mb-4" />
                <h1 class="text-xl font-semibold text-text-primary">{{ configuracion?.nombre_negocio }}</h1>
                <p class="text-sm font-medium text-accent">{{ TEXTO_TITULO_ACCESO }}</p>
            </header>

            <PasoTelefono v-if="paso === 'telefono'" v-model="telefono" :error="error" :cargando="cargando"
                @continuar="continuarConTelefono" />
            <PasoCodigo v-else v-model="codigo" :aviso="aviso" :error="error" :cargando="cargando" :espera="espera"
                @verificar="verificar" @reenviar="reenviar" @cambiar-numero="cambiarNumero" />
        </div>
    </div>
</template>
