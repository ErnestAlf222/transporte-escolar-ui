<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Menu, User, LogOut } from 'lucide-vue-next'
import Spinner from '@/components/Spinner.vue'

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
    <div class="flex min-h-screen items-center justify-center">
        <form class="glass w-full max-w-sm space-y-4 rounded-card p-8" @submit.prevent="onSubmit">
            <h1 class="text-xl font-semibold text-text-primary">Iniciar sesión</h1>

            <div>
                <label class="block text-sm text-text-secondary">Correo</label>
                <input v-model="correo" type="email" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-text-primary" />
            </div>

            <div>
                <label class="block text-sm text-text-secondary">Contraseña</label>
                <input v-model="password" type="password" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-text-primary" />
            </div>

            <p v-if="error" class="text-sm text-danger">{{ error }}</p>

            <button type="submit" :disabled="cargando"
                class="flex w-full items-center justify-center gap-2 rounded-card bg-accent py-2 font-medium text-bg disabled:opacity-50">
                <Spinner v-if="cargando" />
                {{ cargando ? 'Ingresando...' : 'Ingresar' }}
            </button>
        </form>
    </div>
</template>