<script setup lang="ts">
import { ref, watch } from 'vue'
import { verProspecto, convertirProspecto } from '@/api/prospectos'
import type { ProspectoDetalle } from '@/types/prospecto'
import { telefonoInternacional } from '@/utils/telefono'
import { X, Mail, GraduationCap, MapPin, AlertTriangle, UserCheck, Check } from 'lucide-vue-next'
import WhatsappIcon from '@/components/icons/WhatsappIcon.vue'
import TelegramIcon from '@/components/icons/TelegramIcon.vue'
import Spinner from '@/components/Spinner.vue'

const props = defineProps<{ prospectoId: number | null }>()
const emit = defineEmits<{ close: []; convertido: [] }>()

const detalle = ref<ProspectoDetalle | null>(null)
const cargando = ref(false)
const error = ref('')

const confirmandoConversion = ref(false)
const convirtiendo = ref(false)
const errorConversion = ref('')
const convertidoOk = ref(false)

function direccionCompleta(d: ProspectoDetalle): string {
    const partes = [d.calle, d.numero_exterior, d.numero_interior, d.colonia, d.codigo_postal].filter(Boolean)
    return partes.length > 0 ? partes.join(', ') : ''
}

async function cargar(id: number) {
    cargando.value = true
    error.value = ''
    detalle.value = null
    confirmandoConversion.value = false
    convertidoOk.value = false
    try {
        detalle.value = await verProspecto(id)
    } catch {
        error.value = 'No se pudo cargar el detalle del prospecto'
    } finally {
        cargando.value = false
    }
}

watch(
    () => props.prospectoId,
    (id) => {
        if (id !== null) cargar(id)
    },
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
                        <p v-else-if="error" class="text-danger">{{ error }}</p>

                        <div v-else-if="convertidoOk"
                            class="flex flex-col items-center gap-3 rounded-card bg-mint/10 py-8 text-mint">
                            <Check class="h-10 w-10" />
                            <p class="font-medium">Convertido a cliente correctamente</p>
                        </div>

                        <div v-else-if="detalle" class="space-y-5">
                            <div class="flex items-center gap-4">
                                <div
                                    class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent/15 text-2xl font-bold text-accent">
                                    {{ detalle.nombre_alumno[0] }}{{ detalle.apellido_paterno_alumno?.[0] ?? '' }}
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