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
import ContenedorPortal from '@/features/portal-cliente/components/ContenedorPortal.vue'
import AvisoErrorPortal from '@/features/portal-cliente/components/AvisoErrorPortal.vue'
import { CreditCard, Receipt, ClipboardList, Users, Store, GraduationCap, HandCoins } from 'lucide-vue-next'
import BotonRelieve from '@/features/portal-cliente/components/BotonRelieve.vue'
import {
    NOMBRE_RUTA_PORTAL_ACCESO,
    TEXTO_SALUDO,
    TEXTO_SALUDO_AYUDA,
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
const { sesion, tarjeta, resumen, reportes, esTutor, variasFallan, recargarTodo } = usePortalInicio()
const titulo = ref<HTMLElement | null>(null)
const reportando = ref(false)

const alumnos = computed(() => sesion.datos.value?.alumnos ?? [])
const resumenVacio = computed(() => (resumen.datos.value?.alumnos.length ?? 0) === 0)
const alumnosResumen = computed(() => resumen.datos.value?.alumnos ?? [])
// Quién puede reportar lo dice el servidor (ciclo.puede_reportar), no la cantidad de alumnos
const puedeReportar = computed(() => alumnosResumen.value.some((a) => a.puede_reportar === true))
// Escuelas de quien entró, sin repetir, para mostrarlas como etiquetas bajo el saludo
const escuelas = computed(() => [...new Set(alumnos.value.map((a) => a.escuela?.nombre).filter((n): n is string => !!n))])

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
    <ContenedorPortal>
        <NavegacionPortal />

        <header class="space-y-3 pt-4 text-center lg:text-left">
            <h1 ref="titulo" tabindex="-1" class="text-3xl font-extrabold leading-tight text-text-primary focus:outline-none sm:text-4xl">
                {{ TEXTO_SALUDO }}<template v-if="sesion.datos.value?.nombre">, {{ sesion.datos.value.nombre }}</template>
            </h1>
            <p class="text-base text-text-secondary">{{ TEXTO_SALUDO_AYUDA }}</p>
            <div class="flex flex-wrap justify-center gap-2 lg:justify-start">
                <span v-if="configuracion?.nombre_negocio"
                    class="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-bold text-accent">
                    <Store class="h-4 w-4" aria-hidden="true" />
                    {{ configuracion.nombre_negocio }}
                </span>
                <span v-for="e in escuelas" :key="e"
                    class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1.5 text-sm font-medium text-text-secondary">
                    <GraduationCap class="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span class="truncate">{{ e }}</span>
                </span>
            </div>
        </header>

        <AvisoErrorPortal v-if="variasFallan" @reintentar="recargarTodo" />

        <!-- Escritorio: izquierda tarjeta y pagos; derecha reportes y familia. En móvil y tablet, una sola columna en ese orden -->
        <div class="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
            <div class="space-y-8">
                <SeccionPortal :titulo="TEXTO_TARJETA_TITULO" :icono="CreditCard" :estado="tarjeta.estado.value" esqueleto="tarjeta"
                    :aviso-general="variasFallan" @reintentar="tarjeta.cargar">
                    <div class="mx-auto max-w-md lg:mx-0">
                        <TarjetaDeposito :numero="tarjeta.datos.value?.tarjeta_deposito ?? ''" />
                    </div>
                </SeccionPortal>

                <BotonRelieve v-if="puedeReportar" class="max-w-md py-4 text-lg md:mx-auto lg:mx-0" @click="reportando = true">
                    <HandCoins class="h-6 w-6" aria-hidden="true" />
                    {{ TEXTO_BOTON_REPORTAR }}
                </BotonRelieve>

                <SeccionPortal :titulo="TEXTO_RESUMEN_TITULO" :icono="Receipt" :estado="resumen.estado.value" :vacio="resumenVacio"
                    :texto-vacio="TEXTO_RESUMEN_VACIO" :icono-vacio="Receipt" :aviso-general="variasFallan"
                    @reintentar="resumen.cargar">
                    <ResumenPagos v-if="resumen.datos.value" :resumen="resumen.datos.value" :es-tutor="esTutor"
                        :reportes="reportes.datos.value ?? []" />
                </SeccionPortal>
            </div>

            <div class="space-y-8">
                <SeccionPortal :titulo="TEXTO_REPORTES_TITULO" :icono="ClipboardList" :estado="reportes.estado.value"
                    :vacio="(reportes.datos.value?.length ?? 0) === 0" :texto-vacio="TEXTO_REPORTES_VACIO"
                    :icono-vacio="ClipboardList" :aviso-general="variasFallan" @reintentar="reportes.cargar">
                    <ListaReportes :reportes="reportes.datos.value ?? []" :es-tutor="esTutor"
                        :semana-actual="resumen.datos.value?.semana_actual" />
                </SeccionPortal>

                <SeccionPortal :titulo="esTutor ? TEXTO_FAMILIA_TITULO_TUTOR : TEXTO_FAMILIA_TITULO_ALUMNO" :icono="Users"
                    :estado="sesion.estado.value" :vacio="alumnos.length === 0" :texto-vacio="TEXTO_FAMILIA_VACIA"
                    :icono-vacio="Users" :aviso-general="variasFallan" @reintentar="sesion.cargar">
                    <FamiliaPortal :alumnos="alumnos" />
                </SeccionPortal>
            </div>
        </div>

        <ReportarPagoModal :abierto="reportando" :alumnos="alumnosResumen" :es-tutor="esTutor" @cerrar="reportando = false"
            @reportado="alReportar" />

        <button type="button"
            class="mx-auto block min-h-11 w-full rounded-2xl border border-border bg-panel py-2 text-sm font-bold text-text-primary hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:w-auto md:px-10"
            @click="salir">
            {{ TEXTO_BOTON_SALIR }}
        </button>
    </ContenedorPortal>
</template>
