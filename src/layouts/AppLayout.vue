<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Menu, User, LogOut } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const menuAbierto = ref(false)

const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Clientes', to: '/clientes' },
    { label: 'Prospectos', to: '/prospectos' },
    { label: 'Pagos', to: '/pagos' },
    { label: 'Asistencias', to: '/asistencias' },
    { label: 'Conductores', to: '/conductores' },
]

function cerrarMenu() {
    menuAbierto.value = false
}

function onLogout() {
    auth.logout()
    router.push('/login')
}
</script>

<template>
    <div class="flex min-h-screen overflow-hidden">
        <div v-if="menuAbierto" class="fixed inset-0 z-30 bg-black/75 sm:hidden" @click="cerrarMenu" />

        <aside
            class="glass fixed inset-y-0 left-0 z-40 overflow-hidden transition-all duration-300 sm:static sm:z-auto sm:translate-x-0"
            :class="menuAbierto ? 'w-72 translate-x-0 sm:w-56' : 'w-72 -translate-x-full sm:w-0'">
            <div class="w-72 p-4 sm:w-56">
                <div class="mb-6 flex flex-col items-start gap-2">
                    <div
                        class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-panel-2 text-text-secondary">
                        <User class="h-10 w-10" />
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-text-primary">Transporte Escolar</p>
                        <p class="text-xs text-text-secondary">Rol: {{ auth.rol }}</p>
                    </div>
                </div>
                <nav class="space-y-1">
                    <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" @click="cerrarMenu"
                        class="block rounded-card px-3 py-2 text-sm text-text-secondary hover:bg-panel-2"
                        :active-class="item.to === '/' ? '' : '!bg-accent !text-bg !font-semibold'"
                        :exact-active-class="item.to === '/' ? '!bg-accent !text-bg !font-semibold' : ''">
                        {{ item.label }}
                    </RouterLink>
                </nav>
            </div>
        </aside>

        <div class="flex min-w-0 flex-1 flex-col">
            <header class="glass flex items-center justify-between px-6 py-4">
                <button class="text-text-primary" @click="menuAbierto = !menuAbierto">
                    <Menu class="h-6 w-6" />
                </button>
                <button
                    class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                    @click="onLogout">
                    <LogOut class="h-4 w-4" />
                    <span v-if="!menuAbierto" class="sm:hidden">Cerrar sesión</span>
                    <span class="hidden sm:inline">Cerrar sesión</span>
                </button>
            </header>

            <main class="mx-auto w-full max-w-6xl flex-1 p-6" @click="menuAbierto && cerrarMenu()">
                <RouterView />
            </main>
        </div>
    </div>
</template>