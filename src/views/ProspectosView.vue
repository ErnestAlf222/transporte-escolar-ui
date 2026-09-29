<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listarProspectos } from '@/api/prospectos'
import { listarEscuelas } from '@/api/escuelas'
import type { ProspectoListItem, EstatusProspecto } from '@/types/prospecto'
import DropdownSelect from '@/components/DropdownSelect.vue'
import Spinner from '@/components/Spinner.vue'
import SinResultados from '@/components/SinResultados.vue'
import ProspectoDetalleModal from '@/components/ProspectoDetalleModal.vue'
import { Search, X } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import { telefonoInternacional } from '@/utils/telefono'

const route = useRoute()
const router = useRouter()

// Escuela va primero: es el filtro de primer nivel del negocio, tal como se definió desde
// la planeación original (cada escuela se gestiona como su propio universo de prospectos)
const opcionesEscuela = ref([{ value: '', label: 'Todas las escuelas' }])
const opcionesEstatus = [
    { value: '', label: 'Todos' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'convertido', label: 'Convertidos' },
]

const prospectos = ref<ProspectoListItem[]>([])
const cargando = ref(true)
const error = ref('')
const filtroEscuela = ref('')
const filtroEstatus = ref<EstatusProspecto | ''>('')
const busqueda = ref('')

const prospectoIdActivo = computed(() => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
    const numero = Number(id)
    return id !== undefined && Number.isFinite(numero) ? numero : null
})

function abrirDetalle(id: number) {
    router.push({ name: 'prospecto-detalle', params: { id } })
}

function cerrarDetalle() {
    router.push({ name: 'prospectos' })
}

const prospectosFiltrados = computed(() => {
    const termino = busqueda.value.trim().toLowerCase()
    if (!termino) return prospectos.value

    return prospectos.value.filter((p) => {
        const texto = `${p.nombre_alumno} ${p.apellido_paterno_alumno ?? ''} ${p.apellido_materno_alumno ?? ''} ${p.nombre_tutor} ${p.telefono_tutor}`.toLowerCase()
        return texto.includes(termino)
    })
})

function iniciales(p: ProspectoListItem): string {
    return `${p.nombre_alumno[0] ?? ''}${p.apellido_paterno_alumno?.[0] ?? ''}`.toUpperCase()
}

async function cargarEscuelas() {
    const escuelas = await listarEscuelas()
    opcionesEscuela.value = [
        { value: '', label: 'Todas las escuelas' },
        ...escuelas.map((e) => ({
            value: String(e.id),
            label: e.turno ? `${e.nombre} (${e.turno})` : e.nombre,
        })),
    ]
}

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        prospectos.value = await listarProspectos({
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
            estatus: filtroEstatus.value || undefined,
        })
    } catch {
        error.value = 'No se pudo cargar el listado de prospectos'
    } finally {
        cargando.value = false
    }
}

function alConvertido() {
    cargar()
}

onMounted(() => {
    cargar()
    cargarEscuelas()
})
</script>

<template>
    <div>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-text-primary">Prospectos</h1>
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <div class="flex gap-3">
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" @update:model-value="cargar" />
                    <DropdownSelect v-model="filtroEstatus" :opciones="opcionesEstatus" @update:model-value="cargar" />
                </div>
                <div class="relative w-full sm:w-80 sm:flex-none">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                    <input v-model="busqueda" type="text" placeholder="Buscar por alumno, tutor o teléfono"
                        class="w-full rounded-card border border-border bg-panel py-2 pl-9 pr-8 text-sm text-text-primary" />
                    <button v-if="busqueda" type="button" @click="busqueda = ''"
                        class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                        <X class="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>

        <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
            <Spinner />
            Cargando...
        </div>
        <p v-else-if="error" class="text-danger">{{ error }}</p>
        <p v-else-if="prospectos.length === 0" class="text-text-secondary">No hay prospectos en esta categoría.</p>

        <Transition v-else enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" mode="out-in">
            <SinResultados v-if="prospectosFiltrados.length === 0" key="vacio"
                :mensaje="`No encontramos coincidencias para &quot;${busqueda}&quot;`" />

            <div v-else key="lista" class="flex flex-col gap-3">
                <div v-for="prospecto in prospectosFiltrados" :key="prospecto.id"
                    class="glass flex cursor-pointer flex-col gap-3 rounded-card p-4 transition hover:bg-panel-2 sm:flex-row sm:items-center sm:gap-4"
                    @click="abrirDetalle(prospecto.id)">
                    <div class="flex items-start justify-between gap-3 sm:contents">
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-panel-2 text-base font-semibold text-accent">
                                {{ iniciales(prospecto) }}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold text-text-primary">
                                    {{ prospecto.nombre_alumno }} {{ prospecto.apellido_paterno_alumno }} {{
                                        prospecto.apellido_materno_alumno }}
                                </p>
                                <p class="text-sm text-text-secondary">Tutor: {{ prospecto.nombre_tutor }}</p>
                                <p v-if="prospecto.nombre_escuela" class="text-xs text-text-secondary">
                                    {{ prospecto.nombre_escuela }}
                                </p>
                            </div>
                        </div>

                        <span class="shrink-0 rounded-card px-2 py-1 text-xs font-medium"
                            :class="prospecto.estatus === 'pendiente' ? 'bg-sun/15 text-sun' : 'bg-mint/15 text-mint'">
                            {{ prospecto.estatus === 'pendiente' ? 'Pendiente' : 'Convertido' }}
                        </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        <p class="text-sm text-text-secondary">{{ prospecto.telefono_tutor }}</p>
                        <div class="flex items-center gap-3">
                            <a :href="`https://wa.me/${telefonoInternacional(prospecto.telefono_tutor)}`"
                                target="_blank" rel="noopener" title="Abrir WhatsApp" @click.stop>
                                <WhatsappIcon class="h-5 w-5" />
                            </a>
                            <a :href="`https://t.me/+${telefonoInternacional(prospecto.telefono_tutor)}`"
                                target="_blank" rel="noopener" title="Abrir Telegram" @click.stop>
                                <TelegramIcon class="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </Transition>

        <ProspectoDetalleModal :prospecto-id="prospectoIdActivo" @close="cerrarDetalle" @convertido="alConvertido" />
    </div>
</template>