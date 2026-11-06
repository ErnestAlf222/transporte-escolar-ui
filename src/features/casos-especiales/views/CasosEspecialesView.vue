<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Check, BadgeDollarSign } from 'lucide-vue-next'
import { listarClientes } from '@/features/clientes'
import { listarCasosEspeciales, registrarCasoEspecial } from '@/features/casos-especiales/api/casos-especiales'
import { coincideBusqueda } from '@/shared/utils/busqueda'
import { nombreCompletoEstricto } from '@/shared/utils/nombres'
import { mensajeDeError } from '@/shared/utils/errores'
import { colorEscuela } from '@/shared/utils/escuelas'
import { formatearMonto, parseMonto } from '@/shared/utils/moneda'
import { useCamposTocados } from '@/shared/composables/useCamposTocados'
import Spinner from '@/shared/ui/Spinner.vue'
import BuscadorInput from '@/shared/ui/BuscadorInput.vue'
import ModalConfirmacion from '@/shared/ui/ModalConfirmacion.vue'
import CampoTexto from '@/shared/ui/CampoTexto.vue'
import type { ClienteListItem } from '@/features/clientes'
import type { CasoEspecial } from '@/features/casos-especiales/types/caso-especial'

const clientes = ref<ClienteListItem[]>([])
const casos = ref<CasoEspecial[]>([])
const cargando = ref(true)
const errorCarga = ref('')

async function cargarCasos() {
    try {
        casos.value = await listarCasosEspeciales()
    } catch {
        errorCarga.value = 'No se pudieron cargar los casos de la semana'
    }
}

onMounted(async () => {
    try {
        // Solo alumnos activos: no se registra un cobro a quien está dado de baja
        clientes.value = await listarClientes({ estatus: 'activo' })
    } catch {
        errorCarga.value = 'No se pudieron cargar los alumnos'
    }
    await cargarCasos()
    cargando.value = false
})

// Elegir al alumno: se busca por nombre y apellidos, con acentos y mayúsculas indistintos
const busqueda = ref('')
const MAX_RESULTADOS = 30

const resultados = computed(() =>
    busqueda.value.trim() === ''
        ? []
        : clientes.value
            .filter((c) =>
                coincideBusqueda(
                    busqueda.value,
                    [c.nombre_alumno, c.apellido_paterno_alumno, c.apellido_materno_alumno, c.nombre_escuela ?? ''],
                    [],
                ),
            )
            .slice(0, MAX_RESULTADOS),
)

const alumno = ref<ClienteListItem | null>(null)

// Formulario
const monto = ref('')
const motivo = ref('')
const { tocado, tocarTodos, reiniciar: reiniciarTocados } = useCamposTocados(['monto', 'motivo'])
const MOTIVO_MAXIMO = 200

const montoNumero = computed(() => parseMonto(monto.value))

const errores = computed(() => ({
    monto:
        monto.value.trim() === ''
            ? 'Escribe cuánto se cobró esta semana'
            : montoNumero.value === null || montoNumero.value <= 0
                ? 'Escribe un monto mayor a cero, como 125 o 125.50'
                : '',
    motivo: motivo.value.trim() === '' ? 'Escribe por qué se cobró otro monto' : '',
}))

const puedeGuardar = computed(() => !!alumno.value && !errores.value.monto && !errores.value.motivo)

function elegirAlumno(c: ClienteListItem) {
    alumno.value = c
    busqueda.value = ''
    exito.value = ''
    errorGuardar.value = ''
}

function cambiarAlumno() {
    alumno.value = null
    exito.value = ''
}

function limpiarFormulario() {
    monto.value = ''
    motivo.value = ''
    reiniciarTocados()
}

// Confirmación antes de guardar
const confirmando = ref(false)
const guardando = ref(false)
const errorGuardar = ref('')
const exito = ref('')

function pedirConfirmacion() {
    tocarTodos()
    if (!puedeGuardar.value) return
    errorGuardar.value = ''
    confirmando.value = true
}

async function guardar() {
    if (!alumno.value || !puedeGuardar.value || montoNumero.value === null) return
    const nombre = nombreCompletoEstricto(alumno.value)
    guardando.value = true
    errorGuardar.value = ''
    try {
        await registrarCasoEspecial(alumno.value.id, { monto: montoNumero.value, motivo: motivo.value.trim() })
        exito.value = `Se registró el pago de ${nombre} por ${formatearMonto(montoNumero.value)}`
        limpiarFormulario()
        alumno.value = null
        confirmando.value = false
        await cargarCasos()
    } catch (e) {
        // La API explica el problema (por ejemplo, si la semana ya tiene abonos)
        errorGuardar.value = mensajeDeError(e, 'No se pudo registrar el caso especial')
        confirmando.value = false
    } finally {
        guardando.value = false
    }
}

</script>

<template>
    <h1 class="text-2xl font-semibold text-text-primary">Casos especiales</h1>
    <p class="mt-1 text-sm text-text-secondary">
        Un pago de esta semana por otro monto. La semana siguiente se cobra normal.
    </p>

    <div v-if="cargando" class="mt-6 flex items-center gap-2 text-text-secondary">
        <Spinner />
        Cargando...
    </div>
    <p v-else-if="errorCarga && !clientes.length" class="mt-6 text-danger">{{ errorCarga }}</p>

    <div v-else class="mt-6 grid max-w-5xl gap-6 lg:grid-cols-2 lg:items-start">
        <div class="space-y-6">
            <!-- 1. Elegir al alumno -->
            <section class="glass space-y-3 rounded-card p-4">
                <p class="text-sm font-medium text-text-primary">Alumno</p>

                <div v-if="alumno" class="flex items-start justify-between gap-3 rounded-card bg-panel-2 p-3">
                    <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-text-primary">{{ nombreCompletoEstricto(alumno) }}</p>
                        <p class="text-xs text-text-secondary">{{ alumno.nombre_escuela || 'Sin escuela' }}</p>
                    </div>
                    <button type="button" class="shrink-0 text-xs font-medium text-accent hover:opacity-80"
                        @click="cambiarAlumno">
                        Cambiar
                    </button>
                </div>

                <div v-else class="space-y-2">
                    <BuscadorInput v-model="busqueda" placeholder="Buscar alumno o escuela" fondo="panel/40" con-foco
                        etiqueta-limpiar="Borrar búsqueda" />

                    <ul v-if="resultados.length" class="space-y-2">
                        <li v-for="c in resultados" :key="c.id">
                            <button type="button"
                                class="flex w-full items-center gap-3 rounded-card bg-panel-2 p-3 text-left transition hover:opacity-80"
                                @click="elegirAlumno(c)">
                                <span class="h-2 w-2 shrink-0 rounded-full" :class="colorEscuela(c.escuela_id).punto" />
                                <div class="min-w-0 flex-1">
                                    <p class="truncate text-sm font-semibold text-text-primary">{{ nombreCompletoEstricto(c) }}
                                    </p>
                                    <p class="truncate text-xs text-text-secondary">
                                        {{ c.nombre_escuela || 'Sin escuela' }}
                                    </p>
                                </div>
                            </button>
                        </li>
                    </ul>
                    <p v-else-if="busqueda.trim()" class="text-sm text-text-secondary">
                        No hay alumnos que coincidan con "{{ busqueda }}"
                    </p>
                </div>
            </section>

            <p v-if="exito" class="flex items-center gap-2 text-sm text-mint">
                <Check class="h-4 w-4" />
                {{ exito }}
            </p>

            <!-- 2. Monto y motivo -->
            <form v-if="alumno" class="glass space-y-4 rounded-card p-4" novalidate @submit.prevent="pedirConfirmacion">
                <p class="text-sm font-medium text-text-primary">Pago de esta semana</p>

                <CampoTexto id="caso-monto" v-model="monto" etiqueta="Monto que se cobró" inputmode="decimal"
                    autocomplete="off" placeholder="0.00" :invalido="tocado.monto && !!errores.monto"
                    :mensaje="tocado.monto && errores.monto ? errores.monto : undefined" @blur="tocado.monto = true" />

                <CampoTexto id="caso-motivo" v-model="motivo" etiqueta="Motivo" autocomplete="off"
                    :maxlength="MOTIVO_MAXIMO" placeholder="Ej. No asistió tres días"
                    :invalido="tocado.motivo && !!errores.motivo"
                    :mensaje="tocado.motivo && errores.motivo ? errores.motivo : undefined" @blur="tocado.motivo = true" />

                <p v-if="errorGuardar" class="text-sm text-danger">{{ errorGuardar }}</p>

                <div class="flex justify-end">
                    <button type="submit" :disabled="!puedeGuardar"
                        class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                        <BadgeDollarSign class="h-4 w-4" />
                        Registrar caso especial
                    </button>
                </div>
            </form>
        </div>

        <!-- 3. Casos de la semana en curso -->
        <section class="glass space-y-3 rounded-card p-4">
            <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-text-primary">Esta semana</p>
                <span class="text-xs text-text-secondary">{{ casos.length }}
                    {{ casos.length === 1 ? 'caso' : 'casos' }}</span>
            </div>

            <ul v-if="casos.length" class="space-y-2">
                <li v-for="c in casos" :key="c.pago_id" class="rounded-card bg-panel-2 p-3">
                    <div class="flex items-start justify-between gap-3">
                        <p class="min-w-0 truncate text-sm font-semibold text-text-primary">{{ c.alumno }}</p>
                        <p class="shrink-0 text-sm font-semibold text-mint">{{ formatearMonto(c.monto) }}</p>
                    </div>
                    <p class="text-xs text-text-secondary">{{ c.escuela }}</p>
                    <p class="mt-1 text-xs text-text-primary">{{ c.motivo }}</p>
                </li>
            </ul>
            <p v-else class="text-sm text-text-secondary">Todavía no hay casos especiales esta semana.</p>
        </section>
    </div>

    <!-- Confirmación antes de guardar -->
    <ModalConfirmacion :abierto="confirmando" :listo="!!alumno && montoNumero !== null" etiqueta="Registrar caso especial"
        @cerrar="confirmando = false">
        <p class="text-base font-semibold text-text-primary">
            ¿Registrar <strong>{{ formatearMonto(montoNumero!) }}</strong> como el pago de esta semana de
            <strong>{{ nombreCompletoEstricto(alumno!) }}</strong>?
        </p>
        <p class="text-sm text-text-secondary">
            La semana quedará como pagada con ese monto. La siguiente se cobra normal.
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
                <BadgeDollarSign v-else class="h-4 w-4" />
                Registrar
            </button>
        </div>
    </ModalConfirmacion>
</template>