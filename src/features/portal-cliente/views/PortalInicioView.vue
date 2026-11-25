<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/features/portal-cliente/stores/portal'
import { usePortalInicio } from '@/features/portal-cliente/composables/usePortalInicio'
import SeccionPortal from '@/features/portal-cliente/components/SeccionPortal.vue'
import TarjetaDeposito from '@/features/portal-cliente/components/TarjetaDeposito.vue'
import ResumenPagos from '@/features/portal-cliente/components/ResumenPagos.vue'
import ListaReportes from '@/features/portal-cliente/components/ListaReportes.vue'
import FamiliaPortal from '@/features/portal-cliente/components/FamiliaPortal.vue'
import NavegacionPortal from '@/features/portal-cliente/components/NavegacionPortal.vue'
import ReportarPagoModal from '@/features/portal-cliente/components/ReportarPagoModal.vue'
import {
    NOMBRE_RUTA_PORTAL_ACCESO,
    TEXTO_SALUDO,
    TEXTO_BOTON_SALIR,
    TEXTO_TARJETA_TITULO,
    TEXTO_RESUMEN_TITULO,
    TEXTO_RESUMEN_VACIO,
    TEXTO_REPORTES_TITULO,
    TEXTO_REPORTES_VACIO,
    TEXTO_FAMILIA_TITULO_TUTOR,
    TEXTO_FAMILIA_TITULO_ALUMNO,
    TEXTO_FAMILIA_VACIA,
} from '@/features/portal-cliente/constants/portal'
import { TEXTO_BOTON_REPORTAR } from '@/features/portal-cliente/constants/perfil'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'

const router = useRouter()
const portal = usePortalStore()
const { configuracion } = useConfiguracion()
const { sesion, tarjeta, resumen, reportes, esTutor } = usePortalInicio()
const titulo = ref<HTMLElement | null>(null)
const reportando = ref(false)

const alumnos = computed(() => sesion.datos.value?.alumnos ?? [])
const resumenVacio = computed(() => (resumen.datos.value?.alumnos.length ?? 0) === 0)
const alumnosResumen = computed(() => resumen.datos.value?.alumnos ?? [])
const puedeReportar = computed(() => alumnosResumen.value.length > 0)

function alReportar() {
    resumen.cargar()
    reportes.cargar()
}

onMounted(() => titulo.value?.focus())

function salir() {
    portal.cerrarSesion()
    router.push({ name: NOMBRE_RUTA_PORTAL_ACCESO })
}
</script>

<template>
    <div class="mx-auto min-h-screen w-full max-w-md space-y-6 p-4 pb-10">
        <NavegacionPortal />

        <header class="pt-4 text-center">
            <p class="text-sm font-medium text-accent">{{ configuracion?.nombre_negocio }}</p>
            <h1 ref="titulo" tabindex="-1" class="mt-1 text-xl font-semibold text-text-primary focus:outline-none">
                {{ TEXTO_SALUDO }}<template v-if="sesion.datos.value?.nombre">, {{ sesion.datos.value.nombre }}</template>
            </h1>
        </header>

        <SeccionPortal :titulo="TEXTO_TARJETA_TITULO" :estado="tarjeta.estado.value" @reintentar="tarjeta.cargar">
            <TarjetaDeposito :numero="tarjeta.datos.value?.tarjeta_deposito ?? ''" />
        </SeccionPortal>

        <button v-if="puedeReportar" type="button"
            class="w-full rounded-card bg-accent py-3 font-medium text-bg hover:opacity-90" @click="reportando = true">
            {{ TEXTO_BOTON_REPORTAR }}
        </button>

        <SeccionPortal :titulo="TEXTO_RESUMEN_TITULO" :estado="resumen.estado.value" :vacio="resumenVacio"
            :texto-vacio="TEXTO_RESUMEN_VACIO" @reintentar="resumen.cargar">
            <ResumenPagos v-if="resumen.datos.value" :resumen="resumen.datos.value" :es-tutor="esTutor" />
        </SeccionPortal>

        <SeccionPortal :titulo="TEXTO_REPORTES_TITULO" :estado="reportes.estado.value"
            :vacio="(reportes.datos.value?.length ?? 0) === 0" :texto-vacio="TEXTO_REPORTES_VACIO"
            @reintentar="reportes.cargar">
            <ListaReportes :reportes="reportes.datos.value ?? []" :es-tutor="esTutor" />
        </SeccionPortal>

        <SeccionPortal :titulo="esTutor ? TEXTO_FAMILIA_TITULO_TUTOR : TEXTO_FAMILIA_TITULO_ALUMNO"
            :estado="sesion.estado.value" :vacio="alumnos.length === 0" :texto-vacio="TEXTO_FAMILIA_VACIA"
            @reintentar="sesion.cargar">
            <FamiliaPortal :alumnos="alumnos" />
        </SeccionPortal>

        <ReportarPagoModal :abierto="reportando" :alumnos="alumnosResumen" :es-tutor="esTutor" @cerrar="reportando = false"
            @reportado="alReportar" />

        <button type="button"
            class="w-full rounded-card border border-border bg-panel py-2 text-sm font-medium text-text-primary hover:bg-panel-2"
            @click="salir">
            {{ TEXTO_BOTON_SALIR }}
        </button>
    </div>
</template>
