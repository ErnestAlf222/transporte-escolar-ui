<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const correo = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

const auth = useAuthStore()
const router = useRouter()

async function onSubmit() {
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
    <div class="flex min-h-screen items-center justify-center bg-slate-950">
        <form class="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-8"
            @submit.prevent="onSubmit">
            <h1 class="text-xl font-semibold text-white">Iniciar sesión</h1>

            <div>
                <label class="block text-sm text-slate-400">Correo</label>
                <input v-model="correo" type="email" required
                    class="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white" />
            </div>

            <div>
                <label class="block text-sm text-slate-400">Contraseña</label>
                <input v-model="password" type="password" required
                    class="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white" />
            </div>

            <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

            <button type="submit" :disabled="cargando"
                class="w-full rounded-md bg-indigo-600 py-2 font-medium text-white disabled:opacity-50">
                {{ cargando ? 'Ingresando...' : 'Ingresar' }}
            </button>
        </form>
    </div>
</template>