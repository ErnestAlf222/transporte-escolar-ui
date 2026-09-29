<script setup lang="ts">
import { ref, watch } from 'vue'
import { verCliente } from '@/api/clientes'
import type { ClienteDetalle } from '@/types/cliente'
import { telefonoInternacional } from '@/utils/telefono'
import { X, Mail, GraduationCap, Wallet, Percent, Calendar, CreditCard, AlertTriangle, Pencil, Smartphone, Save } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import Spinner from '@/components/Spinner.vue'
import ClienteEditarForm from '@/components/ClienteEditarForm.vue'

const props = defineProps<{ clienteId: number | null; modoEdicion: boolean }>()
const emit = defineEmits<{ close: []; editar: []; 'cancelar-edicion': []; guardado: [] }>()

const detalle = ref<ClienteDetalle | null>(null)
const cargando = ref(false)
const error = ref('')
const mensajeGuardado = ref(false)
const formRef = ref<InstanceType<typeof ClienteEditarForm> | null>(null)

const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function formatearMonto(monto: number): string {
    return monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}

function iniciales(d: ClienteDetalle): string {
    return `${d.nombre_alumno[0] ?? ''}${d.apellido_paterno_alumno[0] ?? ''}`.toUpperCase()
}

async function cargar(id: number) {
    cargando.value = true
    error.value = ''
    detalle.value = null
    try {
        detalle.value = await verCliente(id)
    } catch {
        error.value = 'No se pudo cargar el detalle del cliente'
    } finally {
        cargando.value = false
    }
}

watch(
    () => props.clienteId,
    (id) => {
        if (id !== null) cargar(id)
    },
)

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}

function alGuardar(actualizado: ClienteDetalle) {
    detalle.value = actualizado
    mensajeGuardado.value = true
    setTimeout(() => (mensajeGuardado.value = false), 2500)
    emit('guardado')
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
                        <p v-else-if="error" class="text-danger">{{ error }}</p>

                        <ClienteEditarForm v-else-if="detalle && modoEdicion" ref="formRef" :detalle="detalle"
                            @guardado="alGuardar" @cancelar="emit('cancelar-edicion')" />

                        <div v-else-if="detalle" class="space-y-5">
                            <div class="flex items-center gap-4">
                                <div
                                    class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent">
                                    {{ iniciales(detalle) }}
                                </div>
                                <div class="min-w-0">
                                    <p class="truncate text-lg font-semibold text-text-primary">
                                        {{ detalle.nombre_alumno }} {{ detalle.apellido_paterno_alumno }} {{
                                            detalle.apellido_materno_alumno }}
                                    </p>
                                    <p class="flex items-center gap-1 text-sm text-text-secondary">
                                        <GraduationCap class="h-4 w-4 shrink-0" />
                                        {{ detalle.nombre_escuela || 'Sin escuela asignada' }}
                                    </p>
                                </div>
                            </div>

                            <div v-if="detalle.telefono_alumno" class="glass space-y-2 rounded-card p-4">
                                <p
                                    class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    <Smartphone class="h-4 w-4" />
                                    Teléfono del alumno
                                </p>
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-text-primary">{{ detalle.telefono_alumno }}</span>
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
                            </div>

                            <div class="glass space-y-3 rounded-card p-4">
                                <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Tutor: {{
                                    detalle.nombre_tutor }}</p>

                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-text-primary">{{ detalle.telefono_tutor }}</span>
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
                                    Emergencia: <span class="text-text-primary">{{ detalle.telefono_emergencia }}</span>
                                </p>
                                <p v-if="detalle.correo" class="flex items-center gap-2 text-sm text-text-secondary">
                                    <Mail class="h-4 w-4 shrink-0" />
                                    {{ detalle.correo }}
                                </p>
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