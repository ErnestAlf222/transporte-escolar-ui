<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmarReset } from '@/features/auth/api/auth'
import {
    AVISO_ENLACE_SIN_CODIGO,
    ESPERA_REDIRIGIR_LOGIN_MS,
    LONGITUD_MINIMA_CONTRASENA,
    TEXTO_ERROR_CONFIRMACION_VACIA,
    TEXTO_ERROR_CONTRASENA_CORTA,
    TEXTO_ERROR_CONTRASENA_DISTINTA,
    TEXTO_ERROR_DEMASIADOS_INTENTOS,
    TEXTO_ERROR_GENERICO,
    TEXTO_EXITO_RESPALDO,
} from '@/features/auth/constants/auth'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import { useCamposTocados } from '@/shared/composables/useCamposTocados'
import { esEstado, mensajeDeError } from '@/shared/utils/errores'
import Spinner from '@/shared/ui/Spinner.vue'
import LoaderVanJuego from '@/shared/ui/LoaderVanJuego.vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'

const route = useRoute()
const router = useRouter()
const { configuracion } = useConfiguracion()

// El código llega en la URL del correo: se guarda solo en memoria y se quita de la URL al instante
// (replace, no push) para que no quede en el historial ni a la vista
const consulta = route.query.token
const token = (Array.isArray(consulta) ? consulta[0] : consulta) ?? ''
if (!token) {
    router.replace({ name: 'recuperar-contrasena', query: { aviso: AVISO_ENLACE_SIN_CODIGO } })
} else {
    router.replace({ name: 'nueva-contrasena' })
}

const password = ref('')
const confirmacion = ref('')
const { tocado, tocarTodos } = useCamposTocados(['password', 'confirmacion'] as const)
const error = ref('')
const exito = ref('')
const cargando = ref(false)

const errorPassword = computed(() =>
    password.value.length < LONGITUD_MINIMA_CONTRASENA ? TEXTO_ERROR_CONTRASENA_CORTA : '',
)
const errorConfirmacion = computed(() => {
    if (confirmacion.value === '') return TEXTO_ERROR_CONFIRMACION_VACIA
    return confirmacion.value !== password.value ? TEXTO_ERROR_CONTRASENA_DISTINTA : ''
})

let temporizador: ReturnType<typeof setTimeout> | undefined
onUnmounted(() => clearTimeout(temporizador))

async function onSubmit() {
    tocarTodos()
    if (errorPassword.value || errorConfirmacion.value) return
    error.value = ''
    cargando.value = true
    try {
        const { mensaje } = await confirmarReset(token, password.value)
        exito.value = mensaje || TEXTO_EXITO_RESPALDO
        temporizador = setTimeout(() => router.push({ name: 'login' }), ESPERA_REDIRIGIR_LOGIN_MS)
    } catch (e) {
        error.value = esEstado(e, 429) ? TEXTO_ERROR_DEMASIADOS_INTENTOS : mensajeDeError(e, TEXTO_ERROR_GENERICO)
    } finally {
        cargando.value = false
    }
}
</script>

<template>
    <div class="flex min-h-screen items-center justify-center p-4">
        <div class="glass grid w-full max-w-4xl overflow-hidden rounded-card lg:grid-cols-2">
            <section class="flex flex-col items-center justify-center gap-6 bg-accent/10 p-8 text-center lg:p-12">
                <h1 class="text-2xl font-semibold text-text-primary lg:text-3xl">
                    {{ configuracion?.nombre_negocio }}
                </h1>
                <LoaderVanJuego :texto="configuracion?.nombre_negocio ?? ''" />
            </section>

            <form class="flex flex-col justify-center space-y-4 p-8 lg:p-12" novalidate @submit.prevent="onSubmit">
                <h2 class="text-xl font-semibold text-text-primary">Nueva contraseña</h2>

                <p v-if="exito" class="text-sm text-mint">{{ exito }}</p>
                <template v-else>
                    <CampoTexto id="nueva-password" v-model="password" etiqueta="Contraseña nueva" tam-etiqueta="sm"
                        type="password" autocomplete="new-password" :invalido="tocado.password && !!errorPassword"
                        :mensaje="tocado.password && errorPassword ? errorPassword : undefined"
                        @blur="tocado.password = true" />

                    <CampoTexto id="nueva-confirmacion" v-model="confirmacion" etiqueta="Repite la contraseña"
                        tam-etiqueta="sm" type="password" autocomplete="new-password"
                        :invalido="tocado.confirmacion && !!errorConfirmacion"
                        :mensaje="tocado.confirmacion && errorConfirmacion ? errorConfirmacion : undefined"
                        @blur="tocado.confirmacion = true" />

                    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

                    <button type="submit" :disabled="cargando"
                        class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 font-medium text-bg hover:opacity-90 disabled:opacity-50">
                        <Spinner v-if="cargando" />
                        {{ cargando ? 'Guardando...' : 'Cambiar contraseña' }}
                    </button>
                </template>

                <RouterLink :to="{ name: 'login' }" class="text-center text-sm text-accent hover:underline">
                    Ir a iniciar sesión
                </RouterLink>
            </form>
        </div>
    </div>
</template>
