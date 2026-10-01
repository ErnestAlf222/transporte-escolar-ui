<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { listarClientes } from '@/api/clientes'
import { listarEscuelas } from '@/api/escuelas'
import type { ClienteListItem, EstatusCliente } from '@/types/cliente'
import DropdownSelect from '@/components/DropdownSelect.vue'
import Spinner from '@/components/Spinner.vue'
import SinResultados from '@/components/SinResultados.vue'
import ClienteDetalleModal from '@/components/ClienteDetalleModal.vue'
import { Search, X } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import { telefonoInternacional } from '@/utils/telefono'

const opcionesEstatus = [
    { value: 'activo', label: 'Activos' },
    { value: 'archivado', label: 'Archivados' },
]

const opcionesEscuela = ref([{ value: '', label: 'Todas las escuelas' }])

const clientes = ref<ClienteListItem[]>([])
const cargando = ref(true)
const error = ref('')
const filtroEstatus = ref<EstatusCliente>('activo')
const filtroEscuela = ref('')
const busqueda = ref('')

const clientesFiltrados = computed(() => {
    const termino = busqueda.value.trim().toLowerCase()
    if (!termino) return clientes.value

    return clientes.value.filter((c) => {
        const texto = `${c.nombre_alumno} ${c.apellido_paterno_alumno} ${c.apellido_materno_alumno} ${c.nombre_tutor} ${c.telefono_tutor}`.toLowerCase()
        return texto.includes(termino)
    })
})

interface Familia {
    clave: string
    nombre_tutor: string
    telefono_tutor: string
    alumnos: ClienteListItem[]
}

// Una fila por tutor con sus alumnos; quien no tiene tutor va solo.
// El backend ordena por nombre de alumno, así que alumnos[0] es el primero alfabéticamente.
const familias = computed<Familia[]>(() => {
    const mapa = new Map<string, Familia>()
    for (const c of clientesFiltrados.value) {
        const clave = c.tutor_id ? `t-${c.tutor_id}` : `c-${c.id}`
        let familia = mapa.get(clave)
        if (!familia) {
            familia = { clave, nombre_tutor: c.nombre_tutor, telefono_tutor: c.telefono_tutor, alumnos: [] }
            mapa.set(clave, familia)
        }
        familia.alumnos.push(c)
    }
    return [...mapa.values()]
})

// Índice alfabético tipo Contactos: por la primera letra del primer alumno de cada familia
const clientesAgrupados = computed(() => {
    const grupos: Record<string, Familia[]> = {}
    for (const familia of familias.value) {
        const letra = (familia.alumnos[0]!.nombre_alumno.trim()[0] ?? '#').toUpperCase()
        if (!grupos[letra]) grupos[letra] = []
        grupos[letra].push(familia)
    }
    return grupos
})

const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function irALetra(letra: string) {
    if (!clientesAgrupados.value[letra]) return
    document.getElementById(`letra-${letra}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

const route = useRoute()
const router = useRouter()

// El detalle/edición se maneja por URL, no por variable local — así el navegador recuerda
// el historial y "regresar" desde editar te devuelve exacto al cliente que estabas viendo
const clienteIdActivo = computed(() => {
    const id = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
    const numero = Number(id)
    return id !== undefined && Number.isFinite(numero) ? numero : null
})

const modoEdicion = computed(() => route.name === 'cliente-editar')

function abrirDetalle(id: number) {
    router.push({ name: 'cliente-detalle', params: { id } })
}

function cerrarDetalle() {
    router.push({ name: 'clientes' })
}

function abrirEdicion() {
    if (clienteIdActivo.value !== null) {
        router.push({ name: 'cliente-editar', params: { id: clienteIdActivo.value } })
    }
}

function cancelarEdicion() {
    router.back()
}

function alGuardar() {
    recargarSilencioso()
    router.back()
}

function iniciales(cliente: ClienteListItem): string {
    return `${cliente.nombre_alumno[0] ?? ''}${cliente.apellido_paterno_alumno[0] ?? ''}`.toUpperCase()
}

function nombreAlumno(c: ClienteListItem): string {
    return [c.nombre_alumno, c.apellido_paterno_alumno, c.apellido_materno_alumno]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ')
}

function textoTutorFamilia(f: Familia): string {
    return f.nombre_tutor ? `Tutor: ${f.nombre_tutor}` : 'Registro del propio alumno'
}

// Si todos van a la misma escuela sale una vez; si no, se listan separadas por un punto
function textoEscuelas(f: Familia): string {
    const nombres = new Set(f.alumnos.map((a) => a.nombre_escuela).filter(Boolean))
    return [...nombres].join(' · ')
}

function textoPago(f: Familia): string {
    const metodos = new Set(f.alumnos.map((a) => a.metodo_pago))
    if (metodos.size > 1) return 'Pago mixto'
    return f.alumnos[0]!.metodo_pago === 'digital' ? 'Pago digital' : 'Pago en efectivo'
}

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        clientes.value = await listarClientes({
            estatus: filtroEstatus.value,
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
        })
    } catch {
        error.value = 'No se pudo cargar el listado de clientes'
    } finally {
        cargando.value = false
    }
}
// Refresca el listado sin spinner ni parpadeo (al guardar una edición)
async function recargarSilencioso() {
    try {
        clientes.value = await listarClientes({
            estatus: filtroEstatus.value,
            escuela_id: filtroEscuela.value ? Number(filtroEscuela.value) : undefined,
        })
    } catch {
        // Se conserva el listado actual
    }
}

onMounted(() => {
    cargar()
    cargarEscuelas()
})
</script>

<template>
    <div>
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 class="text-2xl font-semibold text-text-primary">Clientes</h1>
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
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
                <div class="flex gap-3">
                    <DropdownSelect v-model="filtroEscuela" :opciones="opcionesEscuela" @update:model-value="cargar" />
                    <DropdownSelect v-model="filtroEstatus" :opciones="opcionesEstatus" @update:model-value="cargar" />
                </div>
            </div>
        </div>

        <div v-if="cargando" class="flex items-center gap-2 text-text-secondary">
            <Spinner />
            Cargando...
        </div>
        <p v-else-if="error" class="text-danger">{{ error }}</p>
        <p v-else-if="clientes.length === 0" class="text-text-secondary">No hay clientes en esta categoría.</p>

        <Transition v-else enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" mode="out-in">
            <SinResultados v-if="clientesFiltrados.length === 0" key="vacio"
                :mensaje="`No encontramos coincidencias para &quot;${busqueda}&quot;`" />

            <div v-else key="lista" class="flex gap-3">
                <nav class="sticky top-0 -ml-2 flex shrink-0 flex-col items-center gap-0.5 self-start py-1 sm:ml-0">
                    <button v-for="letra in alfabeto" :key="letra" type="button" :disabled="!clientesAgrupados[letra]"
                        class="text-base font-semibold leading-tight sm:text-sm"
                        :class="clientesAgrupados[letra] ? 'text-accent hover:opacity-70' : 'text-text-secondary/30 cursor-default'"
                        @click="irALetra(letra)">
                        {{ letra }}
                    </button>
                </nav>

                <div class="flex flex-1 flex-col gap-3">
                    <template v-for="letra in Object.keys(clientesAgrupados).sort()" :key="letra">
                        <p :id="`letra-${letra}`"
                            class="scroll-mt-4 text-xs font-semibold uppercase text-text-secondary">
                            {{ letra }}
                        </p>
                        <div v-for="familia in clientesAgrupados[letra]" :key="familia.clave"
                            class="glass flex cursor-pointer flex-col gap-3 rounded-card p-4 transition hover:bg-panel-2 sm:flex-row sm:items-center sm:gap-4"
                            @click="abrirDetalle(familia.alumnos[0]!.id)">
                            <div class="flex items-start justify-between gap-3 sm:contents">
                                <div class="flex items-center gap-3">
                                    <div
                                        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-panel-2 text-base font-semibold text-accent">
                                        {{ iniciales(familia.alumnos[0]!) }}
                                    </div>

                                    <div class="min-w-0 flex-1">
                                        <p class="font-semibold text-text-primary">
                                            {{ nombreAlumno(familia.alumnos[0]!) }}
                                            <span v-if="familia.alumnos.length > 1"
                                                class="ml-1 rounded-card bg-accent/15 px-2 py-0.5 align-middle text-xs font-medium text-accent">
                                                +{{ familia.alumnos.length - 1 }}
                                            </span>
                                        </p>
                                        <p class="text-sm text-text-secondary">{{ textoTutorFamilia(familia) }}</p>
                                        <p v-if="textoEscuelas(familia)" class="text-xs text-text-secondary">
                                            {{ textoEscuelas(familia) }}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    class="shrink-0 rounded-card bg-accent/15 px-2 py-1 text-xs font-medium text-accent">
                                    {{ textoPago(familia) }}
                                </span>
                            </div>

                            <div class="flex flex-wrap items-center gap-3">
                                <p class="text-sm text-text-secondary">{{ familia.telefono_tutor }}</p>

                                <div class="flex items-center gap-3">
                                    <a :href="`https://wa.me/${telefonoInternacional(familia.telefono_tutor)}`"
                                        target="_blank" rel="noopener" class="hover:opacity-80" title="Abrir WhatsApp"
                                        @click.stop>
                                        <WhatsappIcon class="h-5 w-5" />
                                    </a>
                                    <a :href="`https://t.me/+${telefonoInternacional(familia.telefono_tutor)}`"
                                        target="_blank" rel="noopener" class="hover:opacity-80" title="Abrir Telegram"
                                        @click.stop>
                                        <TelegramIcon class="h-5 w-5" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </Transition>

        <!-- Modal de detalle del cliente -->
        <ClienteDetalleModal :cliente-id="clienteIdActivo" :modo-edicion="modoEdicion" @close="cerrarDetalle"
            @editar="abrirEdicion" @cancelar-edicion="cancelarEdicion" @guardado="alGuardar" @abrir="abrirDetalle"
            @dinero-guardado="recargarSilencioso" @estatus-cambiado="recargarSilencioso" />
    </div>
</template>