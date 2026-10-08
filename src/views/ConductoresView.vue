<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Users, Check, Clock } from 'lucide-vue-next'
import { listarConductores, escucharEventosRecorridos } from '@/api/conductores'
import type { ConductorLista } from '@/types/conductor'
import { inicial, textoAlumnos, terminoHoy, textoTermino } from '@/utils/conductores'
import LoaderVan from '@/components/LoaderVan.vue'
import ConductorPerfilModal from '@/components/ConductorPerfilModal.vue'

const route = useRoute()
const router = useRouter()

const conductores = ref<ConductorLista[]>([])
const cargando = ref(true)
const error = ref('')

const conductorIdActivo = computed(() => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
    const numero = Number(id)
    return id !== undefined && Number.isFinite(numero) ? numero : null
})

const conductorActivo = computed(
    () => conductores.value.find((c) => c.id === conductorIdActivo.value) ?? null,
)

function abrirDetalle(id: number) {
    router.push({ name: 'conductor-detalle', params: { id } })
}

function cerrarDetalle() {
    router.push({ name: 'conductores' })
}

function verAlumnos() {
    if (conductorIdActivo.value === null) return
    router.push({ name: 'conductor-alumnos', params: { id: conductorIdActivo.value } })
}

async function cargar(silencioso = false) {
    if (!silencioso) cargando.value = true
    error.value = ''
    try {
        conductores.value = await listarConductores()
    } catch {
        if (!silencioso) error.value = 'No se pudo cargar la lista de conductores'
    } finally {
        cargando.value = false
    }
}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))
const ESPERA_RECONEXION_MS = 3000
let detener: AbortController | null = null

// Mantiene la conexión de tiempo real; si se cae, espera, reconecta y refresca por si se perdió un aviso
async function suscribirEventos() {
    detener = new AbortController()
    const { signal } = detener
    while (!signal.aborted) {
        try {
            await escucharEventosRecorridos(() => cargar(true), signal)
        } catch {
            if (signal.aborted) return
        }
        if (signal.aborted) return
        cargar(true)
        await esperar(ESPERA_RECONEXION_MS)
    }
}

onMounted(() => {
    cargar()
    suscribirEventos()
})

onUnmounted(() => detener?.abort())
</script>

<template>
    <div class="space-y-4">
        <h1 class="text-2xl font-semibold text-text-primary">Conductores</h1>

        <LoaderVan v-if="cargando" />
        <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>
        <p v-else-if="conductores.length === 0" class="text-text-secondary">Aún no hay conductores.</p>

        <div v-else class="grid gap-3 sm:grid-cols-2">
            <article v-for="(c, i) in conductores" :key="c.id" role="button" tabindex="0"
                class="entra-suave glass-plano relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-2xl p-3 pl-5 transition hover:bg-panel-2"
                :class="{ 'opacity-60': c.estatus === 'inactivo' }" :style="{ '--i': i }" @click="abrirDetalle(c.id)"
                @keydown.enter="abrirDetalle(c.id)">
                <span class="absolute inset-y-0 left-0 w-1.5"
                    :class="terminoHoy(c) ? 'bg-mint' : 'bg-accent/50'"></span>

                <div class="relative h-14 w-14 shrink-0">
                    <template v-if="terminoHoy(c)">
                        <span class="pulso absolute inset-0 rounded-full border-2 border-mint"></span>
                        <span class="pulso pulso-b absolute inset-0 rounded-full border-2 border-mint"></span>
                    </template>
                    <img v-if="c.foto_url" :src="c.foto_url" :alt="c.nombre_completo"
                        class="relative h-14 w-14 rounded-full object-cover" />
                    <div v-else
                        class="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-xl font-semibold text-bg">
                        {{ inicial(c.nombre_completo) }}
                    </div>
                </div>

                <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold text-text-primary">{{ c.nombre_completo }}</p>
                    <p class="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
                        <Users class="h-3.5 w-3.5" />
                        {{ textoAlumnos(c.alumnos) }}
                    </p>
                    <p class="mt-0.5 flex items-center gap-1.5 text-xs"
                        :class="terminoHoy(c) ? 'text-mint' : 'text-text-secondary'">
                        <Check v-if="terminoHoy(c)" class="h-3.5 w-3.5" />
                        <Clock v-else class="h-3.5 w-3.5" />
                        {{ textoTermino(c) }}
                    </p>
                </div>
            </article>
        </div>

        <ConductorPerfilModal :conductor="conductorActivo" @close="cerrarDetalle" @ver-alumnos="verAlumnos" />
    </div>
</template>

<style scoped>
.pulso {
    opacity: 0;
    animation: pulso 2.6s ease-out infinite;
}

.pulso-b {
    animation-delay: 1.3s;
}

@keyframes pulso {
    0% {
        transform: scale(1);
        opacity: 0.55;
    }

    100% {
        transform: scale(1.45);
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .pulso {
        animation: none;
    }
}
</style>