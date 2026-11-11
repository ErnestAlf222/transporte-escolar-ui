<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/stores/auth'
import { FORMATO_CORREO } from '@/features/auth/constants/auth'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import Spinner from '@/shared/ui/Spinner.vue'
import LoaderVanJuego from '@/shared/ui/LoaderVanJuego.vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'

const correo = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

// Los avisos se muestran cuando la persona sale de un campo, no mientras escribe
const tocoCorreo = ref(false)
const tocoPassword = ref(false)

const errorCorreo = computed(() => {
    if (correo.value.trim() === '') return 'Escribe tu correo'
    if (!FORMATO_CORREO.test(correo.value.trim())) return 'El correo no parece válido, revisa que tenga @ y dominio'
    return ''
})
const errorPassword = computed(() => (password.value === '' ? 'Escribe tu contraseña' : ''))

const puedeEntrar = computed(() => !errorCorreo.value && !errorPassword.value && !cargando.value)

const auth = useAuthStore()
const router = useRouter()
const { configuracion } = useConfiguracion()

async function onSubmit() {
    tocoCorreo.value = true
    tocoPassword.value = true
    if (errorCorreo.value || errorPassword.value) return
    error.value = ''
    cargando.value = true
    try {
        await auth.login(correo.value, password.value)
        router.push('/')
    } catch {
        error.value = 'Correo o contraseña incorrectos'
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
                <h2 class="text-xl font-semibold text-text-primary">Iniciar sesión</h2>

                <CampoTexto id="login-correo" v-model="correo" etiqueta="Correo" tam-etiqueta="sm" inputmode="email"
                    autocomplete="username" :invalido="tocoCorreo && !!errorCorreo"
                    :mensaje="tocoCorreo && errorCorreo ? errorCorreo : undefined" @blur="tocoCorreo = true" />

                <CampoTexto id="login-password" v-model="password" etiqueta="Contraseña" tam-etiqueta="sm" type="password"
                    autocomplete="current-password" :invalido="tocoPassword && !!errorPassword"
                    :mensaje="tocoPassword && errorPassword ? errorPassword : undefined" @blur="tocoPassword = true" />

                <p v-if="error" class="text-sm text-danger">{{ error }}</p>

                <button type="submit" :disabled="!puedeEntrar"
                    class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 font-medium text-bg hover:opacity-90 disabled:opacity-50">
                    <Spinner v-if="cargando" />
                    {{ cargando ? 'Ingresando...' : 'Ingresar' }}
                </button>

                <RouterLink :to="{ name: 'recuperar-contrasena' }"
                    class="block text-center text-sm text-accent hover:underline">
                    ¿Olvidaste tu contraseña?
                </RouterLink>
            </form>
        </div>
    </div>
</template>