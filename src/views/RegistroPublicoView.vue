<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { registrarProspecto } from '@/api/registro-publico'
import { listarEscuelasPublicas } from '@/api/escuelas'
import type { Parentesco } from '@/types/registro-publico'
import { OPCIONES_SERVICIO, type Servicio } from '@/utils/servicio'
import DropdownSelect from '@/components/DropdownSelect.vue'
import LoaderVan from '@/components/LoaderVan.vue'
import BotonScroll from '@/components/BotonScroll.vue'
import { useConsultaTelefono } from '@/composables/useConsultaTelefono'
import { Check, AlertCircle, GraduationCap, Users, Mail, MapPin, ArrowRightLeft, ArrowRight, ArrowLeft } from 'lucide-vue-next'

const opcionesParentesco = [
    { value: 'padre', label: 'Padre' },
    { value: 'madre', label: 'Madre' },
    { value: 'abuelo', label: 'Abuelo' },
    { value: 'abuela', label: 'Abuela' },
    { value: 'estudiante', label: 'Soy el alumno' },
    { value: 'otro', label: 'Otro' },
]

const opcionesEscuela = ref([{ value: '', label: 'Selecciona una escuela' }])

const form = ref({
    nombre_alumno: '',
    apellido_paterno_alumno: '',
    apellido_materno_alumno: '',
    parentesco: 'padre' as Parentesco,
    parentesco_detalle: '',
    telefono_alumno: '',
    nombre_tutor: '',
    telefono_tutor: '',
    correo: '',
    codigo_postal: '',
    calle: '',
    numero_exterior: '',
    colonia: '',
    direccion_referencias: '',
    escuela_id: '',
    servicio: 'completo' as Servicio,
})

const esEstudiante = computed(() => form.value.parentesco === 'estudiante')

// Escucha los teléfonos mientras se escriben y pregunta al servidor si ya existen
const { resultado: consultaTutor } = useConsultaTelefono(() => form.value.telefono_tutor)
const { resultado: consultaAlumno } = useConsultaTelefono(() => form.value.telefono_alumno)

// Respuesta a "¿Acabamos de recibir a tu madre?"; vuelve a pendiente si cambia el número
const respuestaTutor = ref<'pendiente' | 'si' | 'no'>('pendiente')
watch(
    () => form.value.telefono_tutor,
    () => {
        respuestaTutor.value = 'pendiente'
    },
)

const tutorConocido = computed(() => !esEstudiante.value && consultaTutor.value?.tipo === 'tutor')
const tutorConfirmado = computed(() => tutorConocido.value && respuestaTutor.value === 'si')
const textoBotonEnvio = computed(() => (tutorConfirmado.value ? 'Unir a mi familia' : 'Registrarme'))
const tutorEsAlumno = computed(() => !esEstudiante.value && consultaTutor.value?.tipo === 'alumno')
// No se puede enviar mientras el número del tutor no esté confirmado o sea de un alumno
const tutorBloqueado = computed(
    () => tutorEsAlumno.value || (tutorConocido.value && respuestaTutor.value !== 'si'),
)
const alumnoTelefonoRepetido = computed(() => {
    const tipo = consultaAlumno.value?.tipo
    return tipo === 'tutor' || tipo === 'alumno'
})
const parentescoTexto = computed(() =>
    form.value.parentesco === 'otro'
        ? 'tutor'
        : (opcionesParentesco.find((o) => o.value === form.value.parentesco)?.label ?? 'tutor').toLowerCase(),
)

// Solo se marcan campos en rojo después del primer intento de enviar, no antes
const intentoEnviar = ref(false)

const errores = computed(() => ({
    nombre_alumno: !form.value.nombre_alumno,
    apellido_paterno_alumno: !form.value.apellido_paterno_alumno,
    apellido_materno_alumno: !form.value.apellido_materno_alumno,
    escuela_id: !form.value.escuela_id,
    parentesco_detalle: form.value.parentesco === 'otro' && !form.value.parentesco_detalle,
    telefono_alumno: esEstudiante.value && !form.value.telefono_alumno,
    nombre_tutor: !esEstudiante.value && !tutorConfirmado.value && !form.value.nombre_tutor,
    telefono_tutor: !esEstudiante.value && !form.value.telefono_tutor,
    telefono_tutor_conocido: tutorBloqueado.value,
    telefono_alumno_repetido: alumnoTelefonoRepetido.value,
}))

function mostrarError(campo: keyof typeof errores.value) {
    return intentoEnviar.value && errores.value[campo]
}

const enviando = ref(false)
const resultado = ref<{ tipo: 'ok' | 'ya_existe'; mensaje: string } | null>(null)

const errorEscuelas = ref(false)

async function cargarEscuelas() {
    errorEscuelas.value = false
    try {
        const escuelas = await listarEscuelasPublicas()
        opcionesEscuela.value = [
            { value: '', label: 'Selecciona una escuela' },
            ...escuelas.map((e) => ({
                value: String(e.id),
                label: e.turno ? `${e.nombre} (${e.turno})` : e.nombre,
            })),
        ]
    } catch {
        errorEscuelas.value = true
    }
}

onMounted(cargarEscuelas)

async function enviar() {
    intentoEnviar.value = true
    if (Object.values(errores.value).some(Boolean)) return

    enviando.value = true
    resultado.value = null
    try {
        const resp = await registrarProspecto({
            nombre_alumno: form.value.nombre_alumno,
            apellido_paterno_alumno: form.value.apellido_paterno_alumno,
            apellido_materno_alumno: form.value.apellido_materno_alumno,
            parentesco: form.value.parentesco,
            parentesco_detalle: form.value.parentesco === 'otro' ? form.value.parentesco_detalle : undefined,
            telefono_alumno: form.value.telefono_alumno || undefined,
            nombre_tutor: esEstudiante.value || tutorConfirmado.value ? undefined : form.value.nombre_tutor,
            telefono_tutor: esEstudiante.value ? undefined : form.value.telefono_tutor,
            correo: form.value.correo || undefined,
            codigo_postal: form.value.codigo_postal || undefined,
            calle: form.value.calle || undefined,
            numero_exterior: form.value.numero_exterior || undefined,
            colonia: form.value.colonia || undefined,
            direccion_referencias: form.value.direccion_referencias || undefined,
            escuela_id: Number(form.value.escuela_id),
            servicio: form.value.servicio,
        })
        resultado.value = { tipo: resp.ya_existe ? 'ya_existe' : 'ok', mensaje: resp.mensaje }
    } catch {
        resultado.value = { tipo: 'ya_existe', mensaje: 'Ocurrió un error, intenta de nuevo más tarde' }
    } finally {
        enviando.value = false
    }
}
function registrarOtroAlumno() {
    form.value.nombre_alumno = ''
    form.value.apellido_paterno_alumno = ''
    form.value.apellido_materno_alumno = ''
    form.value.telefono_alumno = ''
    intentoEnviar.value = false
    resultado.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
    <div class="min-h-screen px-4 pb-28 pt-8 lg:pt-16">
        <div
            class="glass mx-auto w-full max-w-lg rounded-card p-6 sm:p-8 lg:grid lg:max-w-4xl lg:grid-cols-[16rem_1fr] lg:gap-12 lg:p-10">
            <header class="mb-6 text-center lg:sticky lg:top-10 lg:mb-0 lg:self-start">
                <LoaderVan variante="inline" class="mb-4" />
                <h1 class="mb-1 text-xl font-semibold text-text-primary">Registro de transporte escolar</h1>
                <p v-if="!resultado" class="text-sm text-text-secondary">Llena tus datos y te contactaremos a la
                    brevedad.</p>
            </header>

            <div v-if="resultado" class="flex flex-col items-center gap-3 py-8 text-center"
                :class="resultado.tipo === 'ok' ? 'text-mint' : 'text-sun'">
                <Check v-if="resultado.tipo === 'ok'" class="h-10 w-10" />
                <AlertCircle v-else class="h-10 w-10" />
                <p class="font-medium text-text-primary">{{ resultado.mensaje }}</p>
                <button v-if="resultado.tipo === 'ok' && !esEstudiante" type="button"
                    class="mt-2 rounded-card border border-border bg-panel px-5 py-2 text-sm font-medium text-text-primary hover:bg-panel-2"
                    @click="registrarOtroAlumno">
                    Registrar otro alumno
                </button>
            </div>

            <form v-else id="formRegistro" class="space-y-6" @submit.prevent="enviar">
                <div class="space-y-3">
                    <p
                        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        <GraduationCap class="h-4 w-4" />
                        Datos del alumno
                    </p>

                    <div>
                        <label class="block text-xs text-text-secondary">¿Quién llena este registro?</label>
                        <DropdownSelect v-model="form.parentesco" :opciones="opcionesParentesco" alinear="left"
                            class="mt-1 w-fit" />
                    </div>

                    <div>
                        <label class="block text-xs text-text-secondary">¿Qué servicio necesita?</label>
                        <div class="mt-1 grid gap-2 sm:grid-cols-3">
                            <button v-for="o in OPCIONES_SERVICIO" :key="o.value" type="button"
                                class="flex items-center gap-3 rounded-card border px-3 py-2.5 text-left transition"
                                :class="form.servicio === o.value
                                    ? 'border-accent bg-accent/10'
                                    : 'border-border bg-panel hover:bg-panel-2'" @click="form.servicio = o.value">
                                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                                    :class="form.servicio === o.value ? 'bg-accent text-bg' : 'bg-panel-2 text-accent'">
                                    <ArrowRightLeft v-if="o.value === 'completo'" class="h-4 w-4" />
                                    <ArrowRight v-else-if="o.value === 'ida'" class="h-4 w-4" />
                                    <ArrowLeft v-else class="h-4 w-4" />
                                </span>
                                <span class="min-w-0">
                                    <span class="block text-sm font-medium text-text-primary">{{ o.titulo }}</span>
                                    <span class="block text-xs text-text-secondary">{{ o.detalle }}</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    <div v-if="form.parentesco === 'otro'">
                        <label class="block text-xs text-text-secondary">Especifica el parentesco</label>
                        <input v-model="form.parentesco_detalle" type="text"
                            class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                            :class="mostrarError('parentesco_detalle') ? 'border-danger' : 'border-border'" />
                        <p v-if="mostrarError('parentesco_detalle')" class="mt-1 text-xs text-danger">Este campo es
                            obligatorio</p>
                    </div>

                    <div class="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label class="block text-xs text-text-secondary">Nombre del alumno</label>
                            <input v-model="form.nombre_alumno" type="text"
                                class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                                :class="mostrarError('nombre_alumno') ? 'border-danger' : 'border-border'" />
                            <p v-if="mostrarError('nombre_alumno')" class="mt-1 text-xs text-danger">Este campo es
                                obligatorio</p>
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">Apellido paterno</label>
                            <input v-model="form.apellido_paterno_alumno" type="text"
                                class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                                :class="mostrarError('apellido_paterno_alumno') ? 'border-danger' : 'border-border'" />
                            <p v-if="mostrarError('apellido_paterno_alumno')" class="mt-1 text-xs text-danger">Este
                                campo es obligatorio</p>
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">Apellido materno</label>
                            <input v-model="form.apellido_materno_alumno" type="text"
                                class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                                :class="mostrarError('apellido_materno_alumno') ? 'border-danger' : 'border-border'" />
                            <p v-if="mostrarError('apellido_materno_alumno')" class="mt-1 text-xs text-danger">Este
                                campo es obligatorio</p>
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">
                                Teléfono del alumno {{ esEstudiante ? '' : '(opcional)' }}
                            </label>
                            <input v-model="form.telefono_alumno" type="tel"
                                class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                                :class="mostrarError('telefono_alumno') ? 'border-danger' : 'border-border'" />
                            <p v-if="mostrarError('telefono_alumno')" class="mt-1 text-xs text-danger">Este campo es
                                obligatorio</p>
                            <p v-if="alumnoTelefonoRepetido" class="mt-1 text-xs text-sun">
                                Ese teléfono ya está registrado.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs text-text-secondary">Escuela</label>
                        <DropdownSelect v-model="form.escuela_id" :opciones="opcionesEscuela"
                            :invalid="mostrarError('escuela_id')" alinear="full" class="mt-1 w-full" />
                        <p v-if="mostrarError('escuela_id')" class="mt-1 text-xs text-danger">Selecciona una escuela
                        </p>
                        <p v-if="errorEscuelas" class="mt-1 text-xs text-danger">
                            No se pudieron cargar las escuelas.
                            <button type="button" class="underline" @click="cargarEscuelas">Reintentar</button>
                        </p>
                    </div>
                </div>

                <div v-if="!esEstudiante" class="space-y-3 border-t border-border pt-4">
                    <p
                        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        <Users class="h-4 w-4" />
                        Datos del tutor
                    </p>
                    <div class="grid gap-3 sm:grid-cols-2">
                        <div v-if="!tutorConfirmado">
                            <label class="block text-xs text-text-secondary">Nombre del tutor</label>
                            <input v-model="form.nombre_tutor" type="text"
                                class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                                :class="mostrarError('nombre_tutor') ? 'border-danger' : 'border-border'" />
                            <p v-if="mostrarError('nombre_tutor')" class="mt-1 text-xs text-danger">Este campo es
                                obligatorio</p>
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">Teléfono del tutor</label>
                            <input v-model="form.telefono_tutor" type="tel"
                                class="mt-1 w-full rounded-card border bg-panel px-3 py-2 text-sm text-text-primary"
                                :class="mostrarError('telefono_tutor') ? 'border-danger' : 'border-border'" />
                            <p v-if="mostrarError('telefono_tutor')" class="mt-1 text-xs text-danger">Este campo es
                                obligatorio</p>
                        </div>
                    </div>

                    <div v-if="tutorConocido" class="rounded-card border border-accent/30 bg-accent/10 p-4">
                        <p class="text-sm text-text-primary">
                            ¿Acabamos de recibir a tu {{ parentescoTexto }}?
                            <span v-if="consultaTutor?.nombre">Su nombre es <strong>{{ consultaTutor.nombre
                            }}</strong></span>
                        </p>
                        <div v-if="respuestaTutor === 'pendiente'" class="mt-3 flex gap-3">
                            <button type="button"
                                class="rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
                                @click="respuestaTutor = 'si'">
                                Sí
                            </button>
                            <button type="button"
                                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                                @click="respuestaTutor = 'no'">
                                No
                            </button>
                        </div>
                        <p v-else-if="respuestaTutor === 'si'" class="mt-2 flex items-center gap-2 text-sm text-mint">
                            <Check class="h-4 w-4" />
                            Listo, este registro se vincula a su familia.
                            <button type="button"
                                class="ml-auto text-xs text-text-secondary underline hover:text-text-primary"
                                @click="respuestaTutor = 'pendiente'">
                                Cambiar
                            </button>
                        </p>
                        <p v-else class="mt-2 text-sm text-sun">
                            Ese número ya está registrado a nombre de otra persona. Revisa que lo hayas escrito bien.
                        </p>
                    </div>
                    <p v-else-if="tutorEsAlumno" class="text-sm text-sun">
                        Ese teléfono ya pertenece a un alumno registrado. Revisa el número del tutor.
                    </p>
                </div>

                <div class="space-y-3 border-t border-border pt-4">
                    <p
                        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        <Mail class="h-4 w-4" />
                        Correo de contacto (opcional)
                    </p>
                    <input v-model="form.correo" type="email"
                        class="w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
                </div>

                <div class="space-y-3 border-t border-border pt-4">
                    <p
                        class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        <MapPin class="h-4 w-4" />
                        Domicilio del alumno (opcional)
                    </p>
                    <p class="text-xs text-text-secondary">Dónde pasamos por el alumno.</p>

                    <div class="grid gap-3 sm:grid-cols-2">
                        <div>
                            <label class="block text-xs text-text-secondary">Calle</label>
                            <input v-model="form.calle" type="text"
                                class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">Número exterior</label>
                            <input v-model="form.numero_exterior" type="text"
                                class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">Colonia</label>
                            <input v-model="form.colonia" type="text"
                                class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
                        </div>
                        <div>
                            <label class="block text-xs text-text-secondary">Código postal</label>
                            <input v-model="form.codigo_postal" type="text" inputmode="numeric" maxlength="5"
                                autocomplete="postal-code"
                                class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs text-text-secondary">Referencias de domicilio</label>
                        <input v-model="form.direccion_referencias" type="text"
                            class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
                    </div>
                </div>
            </form>
        </div>

        <div v-if="!resultado" class="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4"
            style="padding-bottom: max(env(safe-area-inset-bottom), 0.75rem)">
            <div
                class="glass pointer-events-auto mx-auto flex max-w-lg lg:max-w-4xl items-center justify-between gap-3 rounded-card px-4 py-2.5 shadow-lg shadow-black/30">
                <template v-if="enviando">
                    <div class="flex flex-1 items-center gap-3 text-sm text-text-secondary">
                        <LoaderVan variante="compacto" />
                        Enviando tu registro...
                    </div>
                </template>
                <template v-else>
                    <RouterLink :to="{ name: 'login' }" class="text-sm text-text-secondary hover:text-text-primary">
                        ¿Ya tienes cuenta? <span class="font-medium text-accent">Inicia sesión</span>
                    </RouterLink>
                    <button type="submit" form="formRegistro"
                        class="shrink-0 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90">
                        {{ textoBotonEnvio }}
                    </button>
                </template>
            </div>
        </div>
        <BotonScroll />
    </div>
</template>