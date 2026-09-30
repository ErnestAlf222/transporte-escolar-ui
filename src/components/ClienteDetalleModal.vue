<script setup lang="ts">
import { ref, watch } from 'vue'
import { verCliente, verAdeudoFamilia } from '@/api/clientes'
import type { ClienteDetalle, AlumnoClienteFamilia, AdeudoAlumno, AdeudoFamilia } from '@/types/cliente'
import { telefonoInternacional } from '@/utils/telefono'
import { X, Mail, GraduationCap, Wallet, Percent, Calendar, CreditCard, AlertTriangle, Pencil, Save, Phone, Calculator } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import Spinner from '@/components/Spinner.vue'
import ClienteEditarForm from '@/components/ClienteEditarForm.vue'

const props = defineProps<{ clienteId: number | null; modoEdicion: boolean }>()
const emit = defineEmits<{ close: []; editar: []; 'cancelar-edicion': []; guardado: []; abrir: [id: number] }>()

const detalle = ref<ClienteDetalle | null>(null)
const cargando = ref(false) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de alumno: se conserva lo mostrado y solo se atenúa
const error = ref('')
const mensajeGuardado = ref(false)
const adeudo = ref<AdeudoFamilia | null>(null)
const verTotal = ref(false)
const cargandoAdeudo = ref(false)
const errorAdeudo = ref('')
const formRef = ref<InstanceType<typeof ClienteEditarForm> | null>(null)

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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

function nombreAdeudo(a: AdeudoAlumno): string {
    return [a.nombre_alumno, a.apellido_paterno_alumno, a.apellido_materno_alumno]
        .map((s) => (s ?? '').trim())
        .filter(Boolean)
        .join(' ')
}

function detalleAdeudo(a: AdeudoAlumno): string {
    if (a.estatus === 'archivado') return 'Archivado, no suma al total'
    if (a.semanas_pendientes === 0) return 'Al corriente'
    return a.semanas_pendientes === 1 ? '1 semana por cubrir' : `${a.semanas_pendientes} semanas por cubrir`
}

// Se consulta al abrir el panel (no antes), así el total siempre sale con los pagos al día
async function alternarTotal() {
    if (verTotal.value) {
        verTotal.value = false
        return
    }
    if (props.clienteId === null || cargandoAdeudo.value) return
    cargandoAdeudo.value = true
    errorAdeudo.value = ''
    try {
        adeudo.value = await verAdeudoFamilia(props.clienteId)
    } catch {
        errorAdeudo.value = 'No se pudo calcular el adeudo'
    } finally {
        cargandoAdeudo.value = false
    }
    // Se abre una sola vez, con los datos ya listos
    verTotal.value = true
}

let ultimaSolicitud = 0

async function cargar(id: number) {
    const solicitud = ++ultimaSolicitud
    const primeraCarga = detalle.value === null
    cargando.value = primeraCarga
    cambiando.value = !primeraCarga
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
        // Al abrir desde cerrado se parte de cero; entre alumnos se conserva lo mostrado
        if (anterior === null) {
            detalle.value = null
            adeudo.value = null
            verTotal.value = false
        }
        cargar(id)
    },
    { immediate: true },
)

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}

function alGuardar(actualizado: ClienteDetalle) {
    detalle.value = actualizado
    mensajeGuardado.value = true
    setTimeout(() => (mensajeGuardado.value = false), 2500)
    emit('guardado')
    if (props.clienteId !== null) cargar(props.clienteId)
}

// Si el usuario cierra con la "X" mientras edita (incluso por error), se guarda igual que con
// el botón "Guardar" — dispara el submit real del formulario, respetando validaciones
function alCerrar() {
    if (props.modoEdicion) {
        formRef.value?.formEl?.requestSubmit()
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
                    <div class="glass w-full max-w-md rounded-card p-5 sm:p-6 md:max-w-2xl">
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

                        <div v-else-if="detalle" class="space-y-5 transition-opacity duration-150"
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
                                <p v-if="detalle.correo" class="flex items-center gap-2 text-sm text-text-secondary">
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
                                            <p class="truncate font-semibold text-text-primary">{{ nombreCompleto(a) }}
                                            </p>
                                            <p class="flex items-center gap-1 text-xs text-text-secondary">
                                                <GraduationCap class="h-3.5 w-3.5 shrink-0" />
                                                {{ a.nombre_escuela || 'Sin escuela asignada' }}
                                            </p>
                                        </div>
                                        <div class="shrink-0 text-right">
                                            <p class="text-sm font-semibold text-text-primary">{{
                                                formatearMonto(a.monto_cuota) }}</p>
                                            <p v-if="a.estatus === 'archivado'" class="text-xs text-danger">Archivado
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button type="button"
                                    class="flex w-full items-center justify-between rounded-card border border-border px-4 py-2 text-sm text-text-secondary transition hover:bg-panel-2 hover:text-text-primary"
                                    @click="alternarTotal">
                                    <span class="flex items-center gap-2">
                                        <Calculator class="h-4 w-4" />
                                        {{ verTotal ? 'Ocultar total adeudado' : 'Ver total adeudado' }}
                                    </span>
                                    <Spinner v-if="cargandoAdeudo" />
                                </button>

                                <div class="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none"
                                    :class="verTotal ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
                                    :aria-hidden="!verTotal">
                                    <div class="overflow-hidden">
                                        <div class="glass mt-2 space-y-3 rounded-card p-4">
                                            <p v-if="errorAdeudo" class="text-sm text-danger">{{ errorAdeudo }}</p>
                                            <template v-else-if="adeudo">
                                                <div v-for="a in adeudo.alumnos" :key="a.id"
                                                    class="flex items-center justify-between gap-3 text-sm">
                                                    <div class="min-w-0">
                                                        <p class="truncate text-text-primary">{{ nombreAdeudo(a) }}</p>
                                                        <p class="text-xs text-text-secondary">{{ detalleAdeudo(a) }}
                                                        </p>
                                                    </div>
                                                    <p class="shrink-0 font-semibold"
                                                        :class="a.estatus === 'activo' ? 'text-text-primary' : 'text-text-secondary'">
                                                        {{ formatearMonto(a.total_adeudo) }}
                                                    </p>
                                                </div>
                                                <div
                                                    class="flex items-center justify-between border-t border-border pt-3">
                                                    <p class="text-sm font-semibold text-text-primary">Total de la
                                                        familia</p>
                                                    <p class="text-lg font-bold text-accent">
                                                        {{ formatearMonto(adeudo.total_familia) }}
                                                    </p>
                                                </div>
                                            </template>
                                        </div>
                                    </div>
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

                            <div class="grid grid-cols-2 gap-3">
                                <div class="rounded-card bg-mint/10 p-3">
                                    <Wallet class="mb-1 h-4 w-4 text-mint" />
                                    <p class="text-xs text-text-secondary">Cuota</p>
                                    <p class="font-semibold text-text-primary">{{ formatearMonto(detalle.monto_cuota) }}
                                    </p>
                                </div>
                                <div class="rounded-card bg-sun/10 p-3">
                                    <Percent class="mb-1 h-4 w-4 text-sun" />
                                    <p class="text-xs text-text-secondary">Recargo</p>
                                    <p class="font-semibold text-text-primary">{{ formatearMonto(detalle.monto_recargo)
                                    }}</p>
                                </div>
                                <div class="rounded-card bg-accent/10 p-3">
                                    <Calendar class="mb-1 h-4 w-4 text-accent" />
                                    <p class="text-xs text-text-secondary">Día límite</p>
                                    <p class="font-semibold text-text-primary">{{ diasSemana[detalle.dia_limite_pago] }}
                                    </p>
                                </div>
                                <div class="rounded-card bg-panel-2 p-3">
                                    <CreditCard class="mb-1 h-4 w-4 text-text-secondary" />
                                    <p class="text-xs text-text-secondary">Método de pago</p>
                                    <p class="font-semibold text-text-primary">
                                        {{ detalle.metodo_pago === 'digital' ? 'Digital' : 'Efectivo' }}
                                    </p>
                                </div>
                            </div>

                            <div v-if="detalle.estatus === 'archivado'"
                                class="flex items-start gap-2 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                                <AlertTriangle class="h-4 w-4 shrink-0" />
                                <div>
                                    <p class="font-medium">Cliente archivado</p>
                                    <p v-if="detalle.motivo_archivo">Motivo: {{ detalle.motivo_archivo }}</p>
                                    <p v-if="detalle.motivo_archivo_detalle">{{ detalle.motivo_archivo_detalle }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>