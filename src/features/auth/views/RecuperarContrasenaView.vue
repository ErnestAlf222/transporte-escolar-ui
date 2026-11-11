<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { solicitarReset } from '@/features/auth/api/auth'
import {
    AVISO_ENLACE_SIN_CODIGO,
    FORMATO_CORREO,
    TEXTO_AVISO_ENLACE_SIN_CODIGO,
    TEXTO_ERROR_CORREO_FORMATO,
    TEXTO_ERROR_CORREO_VACIO,
    TEXTO_ERROR_DEMASIADOS_INTENTOS,
    TEXTO_ERROR_GENERICO,
} from '@/features/auth/constants/auth'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import { esEstado, mensajeDeError } from '@/shared/utils/errores'
import Spinner from '@/shared/ui/Spinner.vue'
import LoaderVanJuego from '@/shared/ui/LoaderVanJuego.vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'

const route = useRoute()
const router = useRouter()
const { configuracion } = useConfiguracion()

const correo = ref('')
const tocoCorreo = ref(false)
const error = ref('')
const exito = ref('')
const cargando = ref(false)

// Aviso que deja /nueva-contrasena cuando el enlace llegó sin código; se lee una vez y se quita de la URL
const aviso = ref(route.query.aviso === AVISO_ENLACE_SIN_CODIGO ? TEXTO_AVISO_ENLACE_SIN_CODIGO : '')
if (route.query.aviso !== undefined) router.replace({ name: 'recuperar-contrasena' })

const errorCorreo = computed(() => {
    if (correo.value.trim() === '') return TEXTO_ERROR_CORREO_VACIO
    if (!FORMATO_CORREO.test(correo.value.trim())) return TEXTO_ERROR_CORREO_FORMATO
    return ''
})

async function onSubmit() {
    tocoCorreo.value = true
    if (errorCorreo.value) return
    error.value = ''
    cargando.value = true
    try {
        const { mensaje } = await solicitarReset(correo.value.trim())
        exito.value = mensaje
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
                <h2 class="text-xl font-semibold text-text-primary">Recuperar contraseña</h2>

                <p v-if="exito" class="text-sm text-mint">{{ exito }}</p>
                <template v-else>
                    <p class="text-sm text-text-secondary">
                        Escribe tu correo y te enviaremos un enlace para crear una contraseña nueva.
                    </p>
                    <p v-if="aviso" class="text-sm text-sun">{{ aviso }}</p>

                    <CampoTexto id="recuperar-correo" v-model="correo" etiqueta="Correo" tam-etiqueta="sm"
                        inputmode="email" autocomplete="username" :invalido="tocoCorreo && !!errorCorreo"
                        :mensaje="tocoCorreo && errorCorreo ? errorCorreo : undefined" @blur="tocoCorreo = true" />

                    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

                    <button type="submit" :disabled="cargando"
                        class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 font-medium text-bg hover:opacity-90 disabled:opacity-50">
                        <Spinner v-if="cargando" />
                        {{ cargando ? 'Enviando...' : 'Enviar enlace' }}
                    </button>
                </template>

                <RouterLink :to="{ name: 'login' }" class="text-center text-sm text-accent hover:underline">
                    Volver a iniciar sesión
                </RouterLink>
            </form>
        </div>
    </div>
</template>
