<script setup lang="ts">
import { ref, watch } from 'vue'
import { verProspecto, convertirProspecto } from '@/api/prospectos'
import type { ProspectoDetalle, AlumnoFamilia } from '@/types/prospecto'
import { telefonoInternacional } from '@/utils/telefono'
import { X, Mail, GraduationCap, MapPin, AlertTriangle, UserCheck, Check, Phone } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ prospectoId: number | null }>()
const emit = defineEmits<{ close: []; convertido: []; abrir: [id: number] }>()

const detalle = ref<ProspectoDetalle | null>(null)
const cargando = ref(false) // solo la primera carga (spinner)
const cambiando = ref(false) // al cambiar de alumno: se conserva lo mostrado y solo se atenúa
const error = ref('')

const confirmandoConversion = ref(false)
const convirtiendo = ref(false)
const errorConversion = ref('')
const convertidoOk = ref(false)

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
                    <div class="glass w-full max-w-md rounded-card p-5 sm:p-6 md:max-w-2xl">
                        <div class="mb-4 flex items-start justify-between">
                            <h2 class="text-lg font-semibold text-text-primary">Detalle del prospecto</h2>
                            <button class="text-text-secondary hover:text-text-primary" @click="emit('close')">
                                <X class="h-5 w-5" />
                            </button>
                        </div>

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
                                <p v-if="detalle.correo" class="flex items-center gap-2 text-sm text-text-secondary">
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
                                            <p class="truncate font-semibold text-text-primary">{{ nombreCompleto(a) }}
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

                            <template v-else>
                                <p v-if="errorConversion" class="text-sm text-danger">{{ errorConversion }}</p>

                                <div v-if="!confirmandoConversion" class="flex justify-end">
                                    <button type="button"
                                        class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                                        @click="confirmandoConversion = true">
                                        <UserCheck class="h-4 w-4" />
                                        Convertir a cliente
                                    </button>
                                </div>

                                <div v-else class="rounded-card border border-accent/30 bg-accent/10 p-4">
                                    <p class="mb-3 text-sm text-text-primary">
                                        ¿Confirmas convertir a <strong>{{ detalle.nombre_alumno }}</strong> en cliente?
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
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>