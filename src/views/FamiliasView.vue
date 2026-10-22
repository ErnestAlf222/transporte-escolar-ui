<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { Search, X, UserPlus, Check, Users } from 'lucide-vue-next'
import { listarClientes, agregarAlumno } from '@/api/clientes'
import { coincideBusqueda } from '@/utils/busqueda'
import { colorEscuela } from '@/utils/escuelas'
import { useConsultaTelefono } from '@/composables/useConsultaTelefono'
import Spinner from '@/components/Spinner.vue'
import type { ClienteListItem } from '@/types/cliente'

interface AlumnoFamilia {
    id: number
    nombre: string
    escuela: string
    escuelaId: number | null
}

interface Familia {
    tutorId: number
    tutor: string
    telefono: string
    alumnoBaseId: number // cualquier alumno de la familia: la API saca el tutor de ahí
    alumnos: AlumnoFamilia[]
}

const clientes = ref<ClienteListItem[]>([])
const cargando = ref(true)
const errorCarga = ref('')

async function cargarClientes() {
    try {
        // Solo alumnos activos: no se suma a una familia dada de baja
        clientes.value = await listarClientes({ estatus: 'activo' })
        errorCarga.value = ''
    } catch {
        errorCarga.value = 'No se pudieron cargar las familias'
    }
}

onMounted(async () => {
    await cargarClientes()
    cargando.value = false
})

function nombreCompleto(c: ClienteListItem): string {
    return [c.nombre_alumno, c.apellido_paterno_alumno, c.apellido_materno_alumno]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ')
}

// Dos primeras palabras: "Maribel Susana Estrada" -> "MS"
function iniciales(texto: string): string {
    return texto
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((palabra) => palabra[0] ?? '')
        .join('')
        .toUpperCase()
}

// Una familia por tutor; los alumnos sin tutor no sirven aquí
const familias = computed<Familia[]>(() => {
    const mapa = new Map<number, Familia>()
    for (const c of clientes.value) {
        if (c.tutor_id === null || c.tutor_id === undefined) continue
        const alumno: AlumnoFamilia = {
            id: c.id,
            nombre: nombreCompleto(c),
            escuela: c.nombre_escuela ?? '',
            escuelaId: c.escuela_id ?? null,
        }
        const existente = mapa.get(c.tutor_id)
        if (existente) {
            existente.alumnos.push(alumno)
        } else {
            mapa.set(c.tutor_id, {
                tutorId: c.tutor_id,
                tutor: c.nombre_tutor,
                telefono: c.telefono_tutor,
                alumnoBaseId: c.id,
                alumnos: [alumno],
            })
        }
    }
    return [...mapa.values()].sort((a, b) => a.tutor.localeCompare(b.tutor, 'es'))
})

const busqueda = ref('')

// Sin búsqueda se ven todas; con búsqueda, las que coincidan por tutor, alumno o teléfono
const familiasFiltradas = computed(() =>
    familias.value.filter((f) =>
        coincideBusqueda(busqueda.value, [f.tutor, ...f.alumnos.map((a) => a.nombre)], [f.telefono]),
    ),
)

// Un punto por escuela distinta, con el color de esa escuela
function puntosDe(f: Familia): string[] {
    const ids = new Set(f.alumnos.map((a) => a.escuelaId))
    return [...ids].map((id) => colorEscuela(id).punto)
}

const familia = ref<Familia | null>(null)

// Formulario del alumno nuevo
const nombre = ref('')
const apellidoP = ref('')
const apellidoM = ref('')
const telefono = ref('')
const tocado = ref({ nombre: false, apellidoP: false, apellidoM: false, telefono: false })

// Con los 10 dígitos y sin teclear, se pregunta si el teléfono ya lo tiene alguien
const { resultado: consultaTelefono } = useConsultaTelefono(() => telefono.value)

const telefonoOcupado = computed(() => {
    const r = consultaTelefono.value
    if (!r || r.tipo === 'libre') return ''
    return r.tipo === 'tutor'
        ? `Ese teléfono ya es del tutor ${r.nombre ?? ''}`.trim()
        : 'Ese teléfono ya está registrado en otro alumno'
})

const SOLO_DIGITOS = /^\d+$/
const LONGITUD_TELEFONO = 10

const errores = computed(() => ({
    nombre: nombre.value.trim() === '' ? 'Escribe el nombre del alumno' : '',
    apellidoP: apellidoP.value.trim() === '' ? 'Escribe el apellido paterno' : '',
    apellidoM: apellidoM.value.trim() === '' ? 'Escribe el apellido materno' : '',
    telefono:
        telefono.value.trim() === ''
            ? ''
            : !SOLO_DIGITOS.test(telefono.value.trim()) || telefono.value.trim().length !== LONGITUD_TELEFONO
                ? `El teléfono debe tener ${LONGITUD_TELEFONO} dígitos`
                : '',
}))

const puedeGuardar = computed(
    () =>
        !!familia.value &&
        !errores.value.nombre &&
        !errores.value.apellidoP &&
        !errores.value.apellidoM &&
        !errores.value.telefono &&
        !telefonoOcupado.value,
)

// Confirmación antes de guardar
const confirmando = ref(false)
const guardando = ref(false)
const errorGuardar = ref('')
const exito = ref('')

function limpiarFormulario() {
    nombre.value = ''
    apellidoP.value = ''
    apellidoM.value = ''
    telefono.value = ''
    tocado.value = { nombre: false, apellidoP: false, apellidoM: false, telefono: false }
    errorGuardar.value = ''
}

function elegirFamilia(f: Familia) {
    familia.value = f
    exito.value = ''
    limpiarFormulario()
}

function cambiarFamilia() {
    familia.value = null
    exito.value = ''
}

function pedirConfirmacion() {
    tocado.value = { nombre: true, apellidoP: true, apellidoM: true, telefono: true }
    if (!puedeGuardar.value) return
    errorGuardar.value = ''
    confirmando.value = true
}

const nombreNuevo = computed(() => [nombre.value, apellidoP.value, apellidoM.value].map((s) => s.trim()).join(' '))

async function guardar() {
    if (!familia.value || !puedeGuardar.value) return
    const tutorId = familia.value.tutorId
    const nuevo = nombreNuevo.value
    guardando.value = true
    errorGuardar.value = ''
    try {
        await agregarAlumno(familia.value.alumnoBaseId, {
            nombre_alumno: nombre.value.trim(),
            apellido_paterno_alumno: apellidoP.value.trim(),
            apellido_materno_alumno: apellidoM.value.trim(),
            telefono_alumno: telefono.value.trim() || undefined,
        })
        exito.value = `${nuevo} se agregó a la familia`
        limpiarFormulario()
        confirmando.value = false
        // Se vuelve a pedir la lista: así la familia muestra al alumno nuevo con su escuela real
        await cargarClientes()
        familia.value = familias.value.find((f) => f.tutorId === tutorId) ?? null
    } catch (e) {
        // La API explica el problema (por ejemplo, un teléfono que ya está registrado)
        errorGuardar.value =
            axios.isAxiosError(e) && typeof e.response?.data === 'string' && e.response.data.trim()
                ? e.response.data.trim()
                : 'No se pudo agregar al alumno'
        confirmando.value = false
    } finally {
        guardando.value = false
    }
}

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') confirmando.value = false
}

const clasesCampo = (error: string, tocadoCampo: boolean) =>
    tocadoCampo && error
        ? 'border-danger focus:border-danger focus:ring-danger'
        : 'border-border focus:border-accent focus:ring-accent'
const CLASES_BASE_CAMPO =
    'mt-1 w-full rounded-card border bg-panel/40 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1'
</script>

<template>
    <h1 class="text-2xl font-semibold text-text-primary">Familias</h1>
    <p class="mt-1 text-sm text-text-secondary">Suma un alumno a una familia que ya está registrada.</p>

    <div v-if="cargando" class="mt-6 flex items-center gap-2 text-text-secondary">
        <Spinner />
        Cargando...
    </div>
    <p v-else-if="errorCarga && !clientes.length" class="mt-6 text-danger">{{ errorCarga }}</p>

    <div v-else class="mt-6 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <!-- Izquierda: todas las familias; en celular se oculta al elegir una -->
        <section class="glass space-y-3 rounded-card p-4" :class="familia ? 'hidden lg:block' : ''">
            <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-text-primary">Tutor</p>
                <span class="text-xs text-text-secondary">{{ familiasFiltradas.length }} de {{ familias.length }}</span>
            </div>

            <div class="relative">
                <Search
                    class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input v-model="busqueda" type="text" placeholder="Buscar tutor, alumno o teléfono"
                    class="w-full rounded-card border border-border bg-panel/40 py-2 pl-9 pr-8 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
                <button v-if="busqueda" type="button" aria-label="Borrar búsqueda" @click="busqueda = ''"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                    <X class="h-4 w-4" />
                </button>
            </div>

            <ul class="scroll-fino -mr-2 max-h-[60vh] space-y-2 overflow-y-auto pr-2">
                <li v-for="f in familiasFiltradas" :key="f.tutorId">
                    <button type="button"
                        class="flex w-full items-center gap-3 rounded-card border p-3 text-left transition"
                        :class="familia?.tutorId === f.tutorId ? 'border-accent bg-accent/10' : 'border-transparent bg-panel-2 hover:opacity-80'"
                        @click="elegirFamilia(f)">
                        <span
                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-panel text-sm font-semibold text-accent">
                            {{ iniciales(f.tutor) || '?' }}
                        </span>
                        <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-semibold text-text-primary">{{ f.tutor }}</p>
                            <p class="text-xs text-text-secondary">
                                {{ f.telefono }} · {{ f.alumnos.length }}
                                {{ f.alumnos.length === 1 ? 'alumno' : 'alumnos' }}
                            </p>
                        </div>
                        <div class="flex shrink-0 items-center gap-1">
                            <span v-for="(punto, i) in puntosDe(f)" :key="i" class="h-2 w-2 rounded-full"
                                :class="punto" />
                        </div>
                    </button>
                </li>
            </ul>

            <p v-if="familiasFiltradas.length === 0" class="text-sm text-text-secondary">
                No hay familias que coincidan con "{{ busqueda }}"
            </p>
        </section>

        <!-- Derecha: la familia elegida y el formulario -->
        <div v-if="familia" class="space-y-6">
            <section class="glass space-y-4 rounded-card p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-3">
                        <span
                            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-panel-2 text-base font-semibold text-accent">
                            {{ iniciales(familia.tutor) || '?' }}
                        </span>
                        <div class="min-w-0">
                            <p class="truncate text-sm font-semibold text-text-primary">{{ familia.tutor }}</p>
                            <p class="text-xs text-text-secondary">{{ familia.telefono }}</p>
                        </div>
                    </div>
                    <button type="button" class="shrink-0 text-xs font-medium text-accent hover:opacity-80 lg:hidden"
                        @click="cambiarFamilia">
                        Cambiar
                    </button>
                </div>

                <div>
                    <p class="text-xs text-text-secondary">Alumnos registrados ({{ familia.alumnos.length }})</p>
                    <ul class="mt-2 space-y-2">
                        <li v-for="a in familia.alumnos" :key="a.id" class="flex items-center gap-3">
                            <span
                                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                                :class="colorEscuela(a.escuelaId).etiqueta">
                                {{ iniciales(a.nombre) }}
                            </span>
                            <div class="min-w-0">
                                <p class="truncate text-sm text-text-primary">{{ a.nombre }}</p>
                                <p v-if="a.escuela" class="truncate text-xs text-text-secondary">{{ a.escuela }}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </section>

            <p v-if="exito" class="flex items-center gap-2 text-sm text-mint">
                <Check class="h-4 w-4" />
                {{ exito }}
            </p>

            <form class="glass space-y-4 rounded-card p-4" novalidate @submit.prevent="pedirConfirmacion">
                <p class="text-sm font-medium text-text-primary">Alumno nuevo</p>

                <div>
                    <label class="block text-xs text-text-secondary" for="fam-nombre">Nombre</label>
                    <input id="fam-nombre" v-model="nombre" type="text" autocomplete="off"
                        :class="[CLASES_BASE_CAMPO, clasesCampo(errores.nombre, tocado.nombre)]"
                        @blur="tocado.nombre = true" />
                    <p v-if="tocado.nombre && errores.nombre" class="mt-1 text-xs text-danger">{{ errores.nombre }}</p>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label class="block text-xs text-text-secondary" for="fam-apellido-p">Apellido paterno</label>
                        <input id="fam-apellido-p" v-model="apellidoP" type="text" autocomplete="off"
                            :class="[CLASES_BASE_CAMPO, clasesCampo(errores.apellidoP, tocado.apellidoP)]"
                            @blur="tocado.apellidoP = true" />
                        <p v-if="tocado.apellidoP && errores.apellidoP" class="mt-1 text-xs text-danger">
                            {{ errores.apellidoP }}
                        </p>
                    </div>
                    <div>
                        <label class="block text-xs text-text-secondary" for="fam-apellido-m">Apellido materno</label>
                        <input id="fam-apellido-m" v-model="apellidoM" type="text" autocomplete="off"
                            :class="[CLASES_BASE_CAMPO, clasesCampo(errores.apellidoM, tocado.apellidoM)]"
                            @blur="tocado.apellidoM = true" />
                        <p v-if="tocado.apellidoM && errores.apellidoM" class="mt-1 text-xs text-danger">
                            {{ errores.apellidoM }}
                        </p>
                    </div>
                </div>

                <div>
                    <label class="block text-xs text-text-secondary" for="fam-telefono">Teléfono (opcional)</label>
                    <input id="fam-telefono" v-model="telefono" type="tel" inputmode="numeric" autocomplete="off"
                        :class="[CLASES_BASE_CAMPO, clasesCampo(errores.telefono || telefonoOcupado, tocado.telefono || !!telefonoOcupado)]"
                        @blur="tocado.telefono = true" />
                    <p v-if="tocado.telefono && errores.telefono" class="mt-1 text-xs text-danger">
                        {{ errores.telefono }}
                    </p>
                    <p v-else-if="telefonoOcupado" class="mt-1 text-xs text-danger">{{ telefonoOcupado }}</p>
                </div>

                <p v-if="errorGuardar" class="text-sm text-danger">{{ errorGuardar }}</p>

                <div class="flex justify-end">
                    <button type="submit" :disabled="!puedeGuardar"
                        class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                        <UserPlus class="h-4 w-4" />
                        Agregar alumno
                    </button>
                </div>
            </form>
        </div>

        <section v-else
            class="hidden min-h-64 flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border p-8 text-center lg:flex">
            <Users class="h-8 w-8 text-text-secondary" />
            <p class="text-sm font-medium text-text-primary">Elige una familia</p>
            <p class="max-w-xs text-xs text-text-secondary">
                Al elegirla verás sus alumnos y podrás sumar uno nuevo.
            </p>
        </section>
    </div>

    <!-- Confirmación antes de guardar -->
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            leave-active-class="transition duration-200 ease-in" leave-to-class="opacity-0">
            <div v-if="confirmando"
                class="fixed inset-0 z-40 bg-black/40 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                @click="confirmando = false"></div>
        </Transition>

        <div class="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <Transition enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
                enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                <div v-if="confirmando && familia" role="dialog" aria-label="Agregar alumno" tabindex="-1"
                    class="pointer-events-auto w-full max-w-md space-y-4 rounded-card border border-border bg-panel p-5 shadow-xl shadow-black/40"
                    @keydown="alTeclaEsc">
                    <p class="text-base font-semibold text-text-primary">
                        ¿Agregar a <strong>{{ nombreNuevo }}</strong>?
                    </p>
                    <p class="text-sm text-text-secondary">
                        Se sumará a la familia de <strong>{{ familia.tutor }}</strong>. Tomará la escuela, el método de
                        pago y el servicio de sus hermanos, y su cuota se configura después desde Clientes.
                    </p>

                    <div class="flex justify-end gap-3">
                        <button type="button"
                            class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                            @click="confirmando = false">
                            Cancelar
                        </button>
                        <button type="button" :disabled="guardando"
                            class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            @click="guardar">
                            <Spinner v-if="guardando" />
                            <UserPlus v-else class="h-4 w-4" />
                            Agregar
                        </button>
                    </div>
                </div>
            </Transition>
        </div>
    </Teleport>
</template>