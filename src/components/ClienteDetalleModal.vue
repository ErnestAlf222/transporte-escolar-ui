<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { verCliente, verAdeudoCliente, archivarCliente, reincorporarCliente } from '@/api/clientes'
import type { ClienteDetalle, AlumnoClienteFamilia, MotivoArchivo } from '@/types/cliente'
import { telefonoInternacional } from '@/utils/telefono'
import { X, Mail, GraduationCap, AlertTriangle, Pencil, Save, Phone, Archive, ArchiveRestore } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import Spinner from '@/components/Spinner.vue'
import ClienteEditarForm from '@/components/ClienteEditarForm.vue'
import ClienteDineroPanel from '@/components/ClienteDineroPanel.vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const props = defineProps<{ clienteId: number | null; modoEdicion: boolean }>()
const emit = defineEmits<{
    close: []
    editar: []
    'cancelar-edicion': []
    guardado: []
    abrir: [id: number]
    'dinero-guardado': []
    'estatus-cambiado': []
}>()

const auth = useAuthStore()
const puedeEditar = computed(() => auth.rol === 'admin')

const MOTIVOS: { valor: MotivoArchivo; etiqueta: string }[] = [
    { valor: 'cambio_escuela', etiqueta: 'Cambio de escuela' },
    { valor: 'no_pago', etiqueta: 'Falta de pago' },
    { valor: 'ya_no_continua', etiqueta: 'Ya no continúa' },
    { valor: 'otro', etiqueta: 'Otro' },
]

function etiquetaMotivo(motivo?: string): string {
    return MOTIVOS.find((m) => m.valor === motivo)?.etiqueta ?? motivo ?? ''
}

const archivando = ref(false)
const motivoArchivo = ref<MotivoArchivo | ''>('')
const detalleArchivo = ref('')
const enviandoEstatus = ref(false)
const errorEstatus = ref('')
const cargandoDeuda = ref(false)
const deudaAlumno = ref<{ monto: number; semanas: number } | null>(null)

const puedeConfirmarArchivo = computed(
    () =>
        motivoArchivo.value !== '' &&
        (motivoArchivo.value !== 'otro' || detalleArchivo.value.trim() !== '') &&
        !enviandoEstatus.value,
)

function cerrarArchivado() {
    archivando.value = false
    motivoArchivo.value = ''
    detalleArchivo.value = ''
    errorEstatus.value = ''
    deudaAlumno.value = null
}

// Al abrir la confirmación se consulta cuánto debe este alumno, para avisar (sin bloquear)
async function abrirArchivado() {
    if (props.clienteId === null) return
    archivando.value = true
    errorEstatus.value = ''
    cargandoDeuda.value = true
    try {
        const r = await verAdeudoCliente(props.clienteId)
        deudaAlumno.value = {
            monto: r.total_adeudo,
            semanas: (r.semanas ?? []).filter((s) => s.estatus !== 'confirmado').length,
        }
    } catch {
        deudaAlumno.value = null
    } finally {
        cargandoDeuda.value = false
    }
}

const textoDeuda = computed(() => {
    const d = deudaAlumno.value
    if (!d) return ''
    const semanas = d.semanas === 1 ? '1 semana' : `${d.semanas} semanas`
    return `${formatearMonto(d.monto)} (${semanas})`
})

async function confirmarArchivo() {
    if (!puedeConfirmarArchivo.value || props.clienteId === null || motivoArchivo.value === '') return
    enviandoEstatus.value = true
    errorEstatus.value = ''
    try {
        await archivarCliente(props.clienteId, motivoArchivo.value, detalleArchivo.value.trim())
        cerrarArchivado()
        emit('estatus-cambiado')
        await cargar(props.clienteId, true)
    } catch (e) {
        errorEstatus.value =
            axios.isAxiosError(e) && e.response?.status === 400 && typeof e.response.data === 'string'
                ? e.response.data.trim()
                : 'No se pudo archivar al alumno'
    } finally {
        enviandoEstatus.value = false
    }
}

async function reincorporar() {
    if (props.clienteId === null || enviandoEstatus.value) return
    enviandoEstatus.value = true
    errorEstatus.value = ''
    try {
        await reincorporarCliente(props.clienteId)
        emit('estatus-cambiado')
        await cargar(props.clienteId, true)
    } catch {
        errorEstatus.value = 'No se pudo reincorporar al alumno'
    } finally {
        enviandoEstatus.value = false
    }
}


const detalle = ref<ClienteDetalle | null>(null)
const cargando = ref(false) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de alumno: se conserva lo mostrado y solo se atenúa
const error = ref('')
const mensajeGuardado = ref(false)
const formRef = ref<InstanceType<typeof ClienteEditarForm> | null>(null)

function formatearMonto(monto: number): string {
    return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function nombreCompleto(a: AlumnoClienteFamilia): string {
    return [a.nombre_alumno, a.apellido_paterno_alumno, a.apellido_materno_alumno]
        .map((s) => (s ?? '').trim())
        .filter(Boolean)
        .join(' ')
}

function inicialesAlumno(a: AlumnoClienteFamilia): string {
    return `${a.nombre_alumno.trim()[0] ?? ''}${a.apellido_paterno_alumno?.[0] ?? ''}`.toUpperCase()
}

function abrirAlumno(a: AlumnoClienteFamilia) {
    if (a.id !== props.clienteId) emit('abrir', a.id)
}

// Abre la app de llamadas con el número cargado (en celular marca directo)
function hrefLlamada(telefono: string): string {
    return `tel:+${telefonoInternacional(telefono)}`
}

function tituloContacto(d: ClienteDetalle): string {
    return d.tutor_id !== null ? `Tutor: ${d.nombre_tutor}` : 'Contacto'
}

function tituloAlumno(d: ClienteDetalle): string {
    return `Datos de ${d.nombre_alumno.trim()}`
}

let ultimaSolicitud = 0

async function cargar(id: number, silencioso = false) {
    const solicitud = ++ultimaSolicitud
    const primeraCarga = detalle.value === null
    cargando.value = primeraCarga
    cambiando.value = !primeraCarga && !silencioso
    error.value = ''
    try {
        const nuevo = await verCliente(id)
        if (solicitud === ultimaSolicitud) detalle.value = nuevo
    } catch {
        if (solicitud === ultimaSolicitud) error.value = 'No se pudo cargar el detalle del cliente'
    } finally {
        if (solicitud === ultimaSolicitud) {
            cargando.value = false
            cambiando.value = false
        }
    }
}

watch(
    () => props.clienteId,
    (id, anterior) => {
        if (id === null) return
        cerrarArchivado()
        // Al abrir desde cerrado se parte de cero; entre alumnos se conserva lo mostrado
        if (anterior === null) {
            detalle.value = null
        }
        cargar(id)
    },
    { immediate: true },
)

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}

function alGuardar() {
    mensajeGuardado.value = true
    setTimeout(() => (mensajeGuardado.value = false), 2500)
    emit('guardado')
    // Refresco silencioso: se conserva lo mostrado y solo cambian los textos
    if (props.clienteId !== null) cargar(props.clienteId, true)
}

// Al guardar dinero: el listado de atrás y el detalle se refrescan sin parpadeo.
function alDineroGuardado() {
    emit('dinero-guardado')
    if (props.clienteId !== null) cargar(props.clienteId, true)
}

// Si el usuario cierra con la "X" mientras edita (incluso por error), se guarda igual que con
// el botón "Guardar" — dispara el submit real del formulario, respetando validaciones
function alCerrar() {
    if (props.modoEdicion) {
        // Sin cambios no hay nada que guardar: se vuelve al detalle, igual que Cancelar
        if (formRef.value?.hayCambios) formRef.value.formEl?.requestSubmit()
        else emit('cancelar-edicion')
        return
    }
    emit('close')
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="clienteId !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                @click.self="emit('close')" @keydown="alTeclaEsc" tabindex="-1">
                <Transition appear enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95">
                    <div class="relative w-full max-w-md md:max-w-2xl">
                        <div class="glass w-full rounded-card p-5 sm:p-6">
                            <div class="mb-4 flex items-start justify-between">
                                <h2 class="text-lg font-semibold text-text-primary">
                                    {{ modoEdicion ? 'Editar cliente' : 'Detalle del cliente' }}
                                </h2>
                                <div class="flex items-center gap-3">
                                    <button v-if="!modoEdicion && detalle" class="text-accent hover:opacity-80"
                                        title="Editar" @click="emit('editar')">
                                        <Pencil class="h-5 w-5" />
                                    </button>
                                    <button class="text-text-secondary hover:text-text-primary" @click="alCerrar">
                                        <X class="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <Transition enter-active-class="transition duration-200 ease-out"
                                enter-from-class="opacity-0 -translate-y-1" enter-to-class="opacity-100 translate-y-0"
                                leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
                                leave-to-class="opacity-0">
                                <p v-if="mensajeGuardado"
                                    class="mb-3 flex items-center gap-2 rounded-card bg-mint/15 px-3 py-2 text-sm text-mint">
                                    <Save class="h-4 w-4" />
                                    Cambios guardados
                                </p>
                            </Transition>

                            <div v-if="cargando" class="flex items-center gap-2 py-8 text-text-secondary">
                                <Spinner />
                                Cargando...
                            </div>
                            <p v-else-if="error && !detalle" class="text-danger">{{ error }}</p>

                            <ClienteEditarForm v-else-if="detalle && modoEdicion" ref="formRef" :detalle="detalle"
                                @guardado="alGuardar" @cancelar="emit('cancelar-edicion')" />

                            <div v-else-if="detalle" class="space-y-5 pb-14 transition-opacity duration-150"
                                :class="{ 'opacity-60': cambiando }">
                                <p v-if="error" class="text-sm text-danger">{{ error }}</p>

                                <div class="glass space-y-3 rounded-card p-4">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        {{ tituloContacto(detalle) }}
                                    </p>

                                    <div v-if="detalle.telefono_tutor" class="flex items-center justify-between">
                                        <a :href="hrefLlamada(detalle.telefono_tutor)"
                                            class="flex items-center gap-2 text-sm text-text-primary hover:text-accent"
                                            title="Llamar">
                                            <Phone class="h-4 w-4 shrink-0" />
                                            {{ detalle.telefono_tutor }}
                                        </a>
                                        <div class="flex items-center gap-3">
                                            <a :href="`https://wa.me/${telefonoInternacional(detalle.telefono_tutor)}`"
                                                target="_blank" rel="noopener" title="Abrir WhatsApp">
                                                <WhatsappIcon class="h-5 w-5" />
                                            </a>
                                            <a :href="`https://t.me/+${telefonoInternacional(detalle.telefono_tutor)}`"
                                                target="_blank" rel="noopener" title="Abrir Telegram">
                                                <TelegramIcon class="h-5 w-5" />
                                            </a>
                                        </div>
                                    </div>

                                    <p v-if="detalle.telefono_emergencia"
                                        class="flex items-center gap-2 text-sm text-text-secondary">
                                        <AlertTriangle class="h-4 w-4 shrink-0 text-sun" />
                                        Emergencia:
                                        <a :href="hrefLlamada(detalle.telefono_emergencia)"
                                            class="text-text-primary hover:text-accent">{{ detalle.telefono_emergencia
                                            }}</a>
                                    </p>
                                    <p v-if="detalle.correo"
                                        class="flex items-center gap-2 text-sm text-text-secondary">
                                        <Mail class="h-4 w-4 shrink-0" />
                                        {{ detalle.correo }}
                                    </p>
                                </div>

                                <div>
                                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Alumnos ({{ detalle.alumnos?.length ?? 0 }})
                                    </p>
                                    <div class="flex flex-col gap-2">
                                        <button v-for="a in detalle.alumnos ?? []" :key="a.id" type="button"
                                            class="flex items-center gap-3 rounded-card border p-3 text-left transition hover:bg-panel-2"
                                            :class="a.id === clienteId ? 'border-accent/50 bg-accent/10' : 'border-border'"
                                            @click="abrirAlumno(a)">
                                            <div
                                                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-panel-2 text-sm font-semibold text-accent">
                                                {{ inicialesAlumno(a) }}
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <p class="truncate font-semibold text-text-primary">{{ nombreCompleto(a)
                                                    }}
                                                </p>
                                                <p class="flex items-center gap-1 text-xs text-text-secondary">
                                                    <GraduationCap class="h-3.5 w-3.5 shrink-0" />
                                                    {{ a.nombre_escuela || 'Sin escuela asignada' }}
                                                </p>
                                            </div>
                                            <div class="shrink-0 text-right">
                                                <p class="text-sm font-semibold text-text-primary">{{
                                                    formatearMonto(a.monto_cuota) }}</p>
                                                <p v-if="a.estatus === 'archivado'" class="text-xs text-danger">
                                                    Archivado
                                                </p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div class="glass space-y-3 rounded-card p-4">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        {{ tituloAlumno(detalle) }}
                                    </p>

                                    <div v-if="detalle.telefono_alumno" class="flex items-center justify-between">
                                        <a :href="hrefLlamada(detalle.telefono_alumno)"
                                            class="flex items-center gap-2 text-sm text-text-primary hover:text-accent"
                                            title="Llamar">
                                            <Phone class="h-4 w-4 shrink-0" />
                                            {{ detalle.telefono_alumno }}
                                        </a>
                                        <div class="flex items-center gap-3">
                                            <a :href="`https://wa.me/${telefonoInternacional(detalle.telefono_alumno)}`"
                                                target="_blank" rel="noopener" title="Abrir WhatsApp">
                                                <WhatsappIcon class="h-5 w-5" />
                                            </a>
                                            <a :href="`https://t.me/+${telefonoInternacional(detalle.telefono_alumno)}`"
                                                target="_blank" rel="noopener" title="Abrir Telegram">
                                                <TelegramIcon class="h-5 w-5" />
                                            </a>
                                        </div>
                                    </div>
                                    <p v-else class="text-sm text-text-secondary">Sin teléfono del alumno</p>
                                </div>

                                <div v-if="detalle.estatus === 'archivado'"
                                    class="space-y-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                                    <div class="flex items-start gap-2">
                                        <AlertTriangle class="h-4 w-4 shrink-0" />
                                        <div>
                                            <p class="font-medium">Cliente archivado</p>
                                            <p v-if="detalle.motivo_archivo">
                                                Motivo: {{ etiquetaMotivo(detalle.motivo_archivo) }}
                                            </p>
                                            <p v-if="detalle.motivo_archivo_detalle">{{ detalle.motivo_archivo_detalle
                                                }}
                                            </p>
                                        </div>
                                    </div>
                                    <template v-if="puedeEditar">
                                        <p v-if="errorEstatus" class="text-xs">{{ errorEstatus }}</p>
                                        <button type="button" :disabled="enviandoEstatus"
                                            class="flex items-center gap-2 rounded-card border border-danger/40 px-3 py-2 text-xs font-medium hover:bg-danger/10 disabled:opacity-50"
                                            @click="reincorporar">
                                            <Spinner v-if="enviandoEstatus" />
                                            <ArchiveRestore v-else class="h-4 w-4" />
                                            Reincorporar
                                        </button>
                                    </template>
                                </div>

                                <div v-else-if="puedeEditar">
                                    <button type="button"
                                        class="flex items-center gap-2 rounded-card border border-danger/40 px-3 py-2 text-sm text-danger/90 transition hover:bg-danger/10"
                                        @click="abrirArchivado">
                                        <Archive class="h-4 w-4" />
                                        Archivar alumno
                                    </button>
                                </div>
                            </div>

                        </div>

                        <ClienteDineroPanel v-if="detalle && !modoEdicion" :detalle="detalle"
                            :puede-editar="puedeEditar" @guardado="alDineroGuardado" />

                        <!-- Archivado: capa de desenfoque + panel grande (mismo patrón que la burbuja) -->
                        <Transition enter-active-class="transition-opacity duration-200 motion-reduce:transition-none"
                            enter-from-class="opacity-0"
                            leave-active-class="transition-opacity duration-150 motion-reduce:transition-none"
                            leave-to-class="opacity-0">
                            <div v-if="archivando && detalle && !modoEdicion"
                                class="fixed inset-0 z-40 bg-black/40 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                                @click="cerrarArchivado"></div>
                        </Transition>

                        <div class="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
                            <Transition
                                enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
                                enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
                                leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
                                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                                <div v-if="archivando && detalle && !modoEdicion" role="dialog"
                                    aria-label="Archivar alumno"
                                    class="glass pointer-events-auto max-h-full w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-card p-5 shadow-xl shadow-black/40 md:max-w-xl"
                                    :style="{ transformOrigin: '50% 50%' }">
                                    <p class="text-base font-semibold text-text-primary">
                                        ¿Archivar a <strong>{{ detalle.nombre_alumno.trim() }}</strong>?
                                    </p>
                                    <p class="text-sm text-text-secondary">
                                        Dejará de aparecer en Activos y de sumar al adeudo. No se borra nada y puedes
                                        reincorporarlo cuando quieras.
                                    </p>

                                    <p v-if="cargandoDeuda" class="flex items-center gap-2 text-sm text-text-secondary">
                                        <Spinner />
                                        Revisando adeudo...
                                    </p>
                                    <p v-else-if="deudaAlumno && deudaAlumno.monto > 0"
                                        class="rounded-card bg-sun/10 p-3 text-sm text-sun">
                                        Todavía tiene {{ textoDeuda }} por cubrir.
                                    </p>

                                    <div>
                                        <p class="text-xs text-text-secondary">Motivo</p>
                                        <div class="mt-1 grid grid-cols-2 gap-2">
                                            <button v-for="m in MOTIVOS" :key="m.valor" type="button"
                                                class="rounded-card border py-2.5 text-sm transition"
                                                :class="motivoArchivo === m.valor ? 'border-accent bg-accent/25 font-semibold text-accent ring-1 ring-accent' : 'border-text-muted/60 bg-panel/40 text-text-primary hover:bg-panel-2/60'"
                                                @click="motivoArchivo = m.valor">
                                                {{ m.etiqueta }}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="block text-xs text-text-secondary" for="detalle-archivo">
                                            {{ motivoArchivo === 'otro' ? 'Detalle (obligatorio)' : 'Detalle (opcional)'
                                            }}
                                        </label>
                                        <textarea id="detalle-archivo" v-model="detalleArchivo" rows="3" maxlength="300"
                                            :placeholder="motivoArchivo === 'otro' ? 'Escribe por qué se archiva' : 'Agrega una nota si lo necesitas'"
                                            class="mt-1 w-full resize-none rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary transition placeholder:text-text-secondary/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"></textarea>
                                    </div>

                                    <p v-if="errorEstatus" class="text-xs text-danger">{{ errorEstatus }}</p>

                                    <div class="flex justify-end gap-3">
                                        <button type="button"
                                            class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                                            @click="cerrarArchivado">
                                            Cancelar
                                        </button>
                                        <button type="button" :disabled="!puedeConfirmarArchivo"
                                            class="flex items-center gap-2 rounded-card bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                            @click="confirmarArchivo">
                                            <Spinner v-if="enviandoEstatus" />
                                            <Archive v-else class="h-4 w-4" />
                                            Archivar
                                        </button>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>