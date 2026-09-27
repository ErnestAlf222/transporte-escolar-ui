<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function onLogout() {
    auth.logout()
    router.push('/login')
}
</script>

<template>
    <div class="min-h-screen bg-slate-950 p-8 text-white">
        <div class="flex items-center justify-between">
            <h1 class="text-2xl font-semibold">Dashboard</h1>
            <button class="rounded-md bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700" @click="onLogout">
                Cerrar sesión
            </button>
        </div>
        <p class="mt-4 text-slate-400">Rol: {{ auth.rol }}</p>
    </div>
</template>