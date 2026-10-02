<script setup lang="ts">
import { ref, watch } from 'vue'
import { verProspecto, convertirProspecto, descartarProspecto, restaurarProspecto } from '@/api/prospectos'
import type { ProspectoDetalle, AlumnoFamilia } from '@/types/prospecto'
import { telefonoInternacional } from '@/utils/telefono'
import {
    X, Mail, GraduationCap, MapPin, AlertTriangle, UserCheck, Check, Phone, Clock, Ban, Undo2, Pencil, Save,
} from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import Spinner from '@/components/Spinner.vue'
import ProspectoEditarForm from '@/components/ProspectoEditarForm.vue'
import BotonScroll from '@/components/BotonScroll.vue'

const props = defineProps<{ prospectoId: number | null }>()
const emit = defineEmits<{
    close: []
    convertido: []
    'estatus-cambiado': []
    guardado: []
    abrir: [id: number]
}>()

const detalle = ref<ProspectoDetalle | null>(null)
const cargando = ref(false) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de alumno: se conserva lo mostrado y solo se atenúa
const error = ref('')

const confirmandoConversion = ref(false)
const convirtiendo = ref(false)
const errorConversion = ref('')
const convertidoOk = ref(false)

const confirmandoDescarte = ref(false)
const cambiandoEstatus = ref(false)
const errorEstatus = ref('')
const modoEdicion = ref(false)

const DURACION_MENSAJE_MS = 2500
const mensajeGuardado = ref(false)
const zonaScroll = ref<HTMLElement | null>(null)
const formRef = ref<InstanceType<typeof ProspectoEditarForm> | null>(null)

function direccionCompleta(d: ProspectoDetalle): string {
    const partes = [d.calle, d.numero_exterior, d.numero_interior, d.colonia, d.codigo_postal].filter(Boolean)
    return partes.length > 0 ? partes.join(', ') : ''
}

function nombreCompleto(a: AlumnoFamilia): string {
    return [a.nombre_alumno, a.apellido_paterno_alumno, a.apellido_materno_alumno]
        .map((s) => (s ?? '').trim())
        .filter(Boolean)
        .join(' ')
}

function inicialesAlumno(a: AlumnoFamilia): string {
    return `${a.nombre_alumno.trim()[0] ?? ''}${a.apellido_paterno_alumno?.[0] ?? ''}`.toUpperCase()
}

function abrirAlumno(a: AlumnoFamilia) {
    if (a.id !== props.prospectoId) emit('abrir', a.id)
}

// Abre la app de llamadas con el número cargado (en celular marca directo)
function hrefLlamada(telefono: string): string {
    return `tel:+${telefonoInternacional(telefono)}`
}

function tituloContacto(d: ProspectoDetalle): string {
    return d.tutor_id !== null ? `Tutor: ${d.nombre_tutor}` : 'Contacto y domicilio'
}

function tituloAlumno(d: ProspectoDetalle): string {
    return `Datos de ${d.nombre_alumno.trim()}`
}

function textoFechaRegistro(d: ProspectoDetalle): string {
    const fecha = new Date(d.fecha_contacto)
    if (Number.isNaN(fecha.getTime())) return ''
    const dia = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const hora = fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `Registrado el ${dia} a las ${hora}`
}

const ETIQUETAS_PARENTESCO: Record<string, string> = {
    padre: 'Padre',
    madre: 'Madre',
    abuelo: 'Abuelo',
    abuela: 'Abuela',
    estudiante: 'El propio alumno',
}

function textoParentesco(d: ProspectoDetalle): string {
    if (!d.parentesco) return ''
    const etiqueta =
        d.parentesco === 'otro' ? d.parentesco_detalle || 'Otro' : (ETIQUETAS_PARENTESCO[d.parentesco] ?? d.parentesco)
    return `Registró: ${etiqueta}`
}

let ultimaSolicitud = 0

async function cargar(id: number) {
    const solicitud = ++ultimaSolicitud
    const primeraCarga = detalle.value === null
    cargando.value = primeraCarga
    cambiando.value = !primeraCarga
    error.value = ''
    errorConversion.value = ''
    confirmandoConversion.value = false
    convertidoOk.value = false
    try {
        const nuevo = await verProspecto(id)
        if (solicitud === ultimaSolicitud) detalle.value = nuevo
    } catch {
        if (solicitud === ultimaSolicitud) error.value = 'No se pudo cargar el detalle del prospecto'
    } finally {
        if (solicitud === ultimaSolicitud) {
            cargando.value = false
            cambiando.value = false
        }
    }
}

watch(
    () => props.prospectoId,
    (id, anterior) => {
        if (id === null) return
        modoEdicion.value = false
        // Al abrir desde cerrado se parte de cero; entre alumnos se conserva lo mostrado
        if (anterior === null) detalle.value = null
        cargar(id)
    },
    { immediate: true },
)

async function confirmarConversion() {
    if (!detalle.value) return
    convirtiendo.value = true
    errorConversion.value = ''
    try {
        await convertirProspecto(detalle.value.id)
        convertidoOk.value = true
        emit('convertido')
        setTimeout(() => emit('close'), 1500)
    } catch {
        errorConversion.value = 'No se pudo convertir el prospecto'
    } finally {
        convirtiendo.value = false
        confirmandoConversion.value = false
    }
}

async function descartar() {
    if (!detalle.value) return
    cambiandoEstatus.value = true
    errorEstatus.value = ''
    try {
        await descartarProspecto(detalle.value.id)
        confirmandoDescarte.value = false
        emit('estatus-cambiado')
        emit('close')
    } catch {
        errorEstatus.value = 'No se pudo descartar el prospecto'
    } finally {
        cambiandoEstatus.value = false
    }
}

async function restaurar() {
    if (!detalle.value) return
    cambiandoEstatus.value = true
    errorEstatus.value = ''
    try {
        await restaurarProspecto(detalle.value.id)
        emit('estatus-cambiado')
        emit('close')
    } catch {
        errorEstatus.value = 'No se pudo restaurar el prospecto'
    } finally {
        cambiandoEstatus.value = false
    }
}

async function alGuardar() {
    modoEdicion.value = false
    mensajeGuardado.value = true
    setTimeout(() => (mensajeGuardado.value = false), DURACION_MENSAJE_MS)
    emit('guardado')
    if (props.prospectoId !== null) await cargar(props.prospectoId)
}

// Si se cierra con la "X" mientras se edita, se guarda igual que con el botón "Guardar" (dispara el submit
// real, respetando validaciones). Sin cambios solo se sale de la edición, igual que "Cancelar"
function alCerrar() {
    if (modoEdicion.value) {
        if (formRef.value?.hayCambios) formRef.value.formEl?.requestSubmit()
        else modoEdicion.value = false
        return
    }
    emit('close')
}

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="prospectoId !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                @click.self="emit('close')" @keydown="alTeclaEsc" tabindex="-1">
                <Transition appear enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95">
                    <div
                        class="glass relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-card p-5 sm:p-6 md:max-w-2xl">
                        <div class="mb-4 flex shrink-0 items-start justify-between">
                            <h2 class="text-lg font-semibold text-text-primary">
                                {{ modoEdicion ? 'Editar prospecto' : 'Detalle del prospecto' }}
                            </h2>
                            <div class="flex items-center gap-3">
                                <button v-if="detalle && !modoEdicion && detalle.estatus === 'pendiente'"
                                    class="text-accent hover:opacity-80" title="Editar" @click="modoEdicion = true">
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
                                class="mb-3 flex shrink-0 items-center gap-2 rounded-card bg-mint/15 px-3 py-2 text-sm text-mint">
                                <Save class="h-4 w-4" />
                                Cambios guardados
                            </p>
                        </Transition>

                        <div ref="zonaScroll"
                            class="-mr-4 min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-fino pr-4 sm:-mr-5 sm:pr-5">
                            <div v-if="cargando" class="flex items-center gap-2 py-8 text-text-secondary">
                                <Spinner />
                                Cargando...
                            </div>
                            <p v-else-if="error && !detalle" class="text-danger">{{ error }}</p>

                            <div v-else-if="convertidoOk"
                                class="flex flex-col items-center gap-3 rounded-card bg-mint/10 py-8 text-mint">
                                <Check class="h-10 w-10" />
                                <p class="font-medium">Convertido a cliente correctamente</p>
                            </div>

                            <ProspectoEditarForm v-else-if="detalle && modoEdicion" ref="formRef" :detalle="detalle"
                                @guardado="alGuardar" @cancelar="modoEdicion = false" />

                            <div v-else-if="detalle" class="space-y-5 transition-opacity duration-150"
                                :class="{ 'opacity-60': cambiando }">
                                <p v-if="error" class="text-sm text-danger">{{ error }}</p>

                                <div class="glass space-y-3 rounded-card p-4">
                                    <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        {{ tituloContacto(detalle) }}
                                    </p>

                                    <div v-if="detalle.tutor_id !== null" class="flex items-center justify-between">
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
                                    <p v-if="direccionCompleta(detalle)"
                                        class="flex items-start gap-2 text-sm text-text-secondary">
                                        <MapPin class="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>
                                            {{ direccionCompleta(detalle) }}
                                            <span v-if="detalle.direccion_referencias" class="block text-xs italic">
                                                {{ detalle.direccion_referencias }}
                                            </span>
                                        </span>
                                    </p>
                                    <p v-if="textoFechaRegistro(detalle)"
                                        class="flex items-start gap-2 text-sm text-text-secondary">
                                        <Clock class="mt-0.5 h-4 w-4 shrink-0" />
                                        {{ textoFechaRegistro(detalle) }}
                                    </p>
                                </div>

                                <div>
                                    <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Alumnos ({{ detalle.alumnos.length }})
                                    </p>
                                    <div class="flex flex-col gap-2">
                                        <button v-for="a in detalle.alumnos" :key="a.id" type="button"
                                            class="flex items-center gap-3 rounded-card border p-3 text-left transition hover:bg-panel-2"
                                            :class="a.id === prospectoId ? 'border-accent/50 bg-accent/10' : 'border-border'"
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
                                            <span class="shrink-0 rounded-card px-2 py-1 text-xs font-medium"
                                                :class="a.estatus === 'pendiente' ? 'bg-sun/15 text-sun' : 'bg-mint/15 text-mint'">
                                                {{ a.estatus === 'pendiente' ? 'Pendiente' : 'Convertido' }}
                                            </span>
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

                                    <p v-if="textoParentesco(detalle)" class="text-sm text-text-secondary">
                                        {{ textoParentesco(detalle) }}
                                    </p>
                                </div>

                                <div v-if="detalle.estatus === 'convertido'"
                                    class="rounded-card bg-mint/10 p-3 text-sm text-mint">
                                    Este prospecto ya fue convertido a cliente.
                                </div>

                                <div v-else-if="detalle.estatus === 'descartado'"
                                    class="space-y-3 rounded-card border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                                    <p>Este prospecto fue descartado.</p>
                                    <p v-if="errorEstatus" class="text-xs">{{ errorEstatus }}</p>
                                    <button type="button" :disabled="cambiandoEstatus"
                                        class="flex items-center gap-2 rounded-card border border-danger/40 px-3 py-2 text-xs font-medium hover:bg-danger/10 disabled:opacity-50"
                                        @click="restaurar">
                                        <Spinner v-if="cambiandoEstatus" />
                                        <Undo2 v-else class="h-4 w-4" />
                                        Restaurar
                                    </button>
                                </div>

                                <template v-else>
                                    <p v-if="errorConversion" class="text-sm text-danger">{{ errorConversion }}</p>

                                    <div v-if="!confirmandoConversion && !confirmandoDescarte"
                                        class="flex justify-end gap-3">
                                        <button type="button"
                                            class="flex items-center gap-2 rounded-card border border-danger/40 px-4 py-2 text-sm text-danger/90 hover:bg-danger/10"
                                            @click="confirmandoDescarte = true">
                                            <Ban class="h-4 w-4" />
                                            Descartar
                                        </button>
                                        <button type="button"
                                            class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                                            @click="confirmandoConversion = true">
                                            <UserCheck class="h-4 w-4" />
                                            Convertir a cliente
                                        </button>
                                    </div>

                                    <div v-else-if="confirmandoDescarte"
                                        class="rounded-card border border-danger/30 bg-danger/10 p-4">
                                        <p class="mb-3 text-sm text-text-primary">
                                            ¿Descartar a <strong>{{ detalle.nombre_alumno }}</strong>? Sale de
                                            Pendientes y
                                            puedes restaurarlo después desde el filtro Descartados.
                                        </p>
                                        <p v-if="errorEstatus" class="mb-3 text-xs text-danger">{{ errorEstatus }}</p>
                                        <div class="flex justify-end gap-3">
                                            <button type="button"
                                                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                                                @click="confirmandoDescarte = false; errorEstatus = ''">
                                                Cancelar
                                            </button>
                                            <button type="button" :disabled="cambiandoEstatus"
                                                class="flex items-center gap-2 rounded-card bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                                                @click="descartar">
                                                <Spinner v-if="cambiandoEstatus" />
                                                <Ban v-else class="h-4 w-4" />
                                                Descartar
                                            </button>
                                        </div>
                                    </div>

                                    <div v-else class="rounded-card border border-accent/30 bg-accent/10 p-4">
                                        <p class="mb-3 text-sm text-text-primary">
                                            ¿Confirmas convertir a <strong>{{ detalle.nombre_alumno }}</strong> en
                                            cliente?
                                            Se generará su link de acceso personal.
                                        </p>
                                        <div class="flex justify-end gap-3">
                                            <button type="button"
                                                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                                                @click="confirmandoConversion = false">
                                                Cancelar
                                            </button>
                                            <button type="button" :disabled="convirtiendo"
                                                class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
                                                @click="confirmarConversion">
                                                <Spinner v-if="convirtiendo" />
                                                <Check v-else class="h-4 w-4" />
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                        <BotonScroll v-if="modoEdicion" :objetivo="zonaScroll" />
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>