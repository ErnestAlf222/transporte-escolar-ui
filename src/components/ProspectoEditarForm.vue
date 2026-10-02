<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { actualizarProspecto } from '@/api/prospectos'
import { listarEscuelas } from '@/api/escuelas'
import type { ProspectoDetalle, ActualizarProspectoPayload } from '@/types/prospecto'
import { Save } from 'lucide-vue-next'
import Spinner from '@/components/Spinner.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'

const props = defineProps<{ detalle: ProspectoDetalle }>()
const emit = defineEmits<{ guardado: []; cancelar: [] }>()

const clasesCampo = 'mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary'

const escuelasOpciones = ref([{ value: '', label: 'Sin escuela asignada' }])

const form = ref({
    nombre_alumno: '',
    apellido_paterno_alumno: '',
    apellido_materno_alumno: '',
    telefono_alumno: '',
    nombre_tutor: '',
    telefono_tutor: '',
    telefono_emergencia: '',
    correo: '',
    escuela_id: '',
    codigo_postal: '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    colonia: '',
    direccion_referencias: '',
})

const guardando = ref(false)
const errorGuardar = ref('')

// Copia de los valores con los que se abrió el formulario, para saber si se cambió algo
const original = ref({ ...form.value })
const hayCambios = computed(() => JSON.stringify(form.value) !== JSON.stringify(original.value))

const formEl = ref<HTMLFormElement | null>(null)
defineExpose({ formEl, hayCambios })

// Un alumno que se registró solo no tiene tutor: su propio teléfono es su contacto
const sinTutor = computed(() => props.detalle.tutor_id === null)

function precargar(d: ProspectoDetalle) {
    form.value = {
        nombre_alumno: d.nombre_alumno,
        apellido_paterno_alumno: d.apellido_paterno_alumno ?? '',
        apellido_materno_alumno: d.apellido_materno_alumno ?? '',
        telefono_alumno: d.telefono_alumno ?? '',
        nombre_tutor: d.nombre_tutor ?? '',
        telefono_tutor: d.telefono_tutor ?? '',
        telefono_emergencia: d.telefono_emergencia ?? '',
        correo: d.correo ?? '',
        escuela_id: d.escuela_id ? String(d.escuela_id) : '',
        codigo_postal: d.codigo_postal ?? '',
        calle: d.calle ?? '',
        numero_exterior: d.numero_exterior ?? '',
        numero_interior: d.numero_interior ?? '',
        colonia: d.colonia ?? '',
        direccion_referencias: d.direccion_referencias ?? '',
    }
    original.value = { ...form.value }
}

watch(() => props.detalle, precargar, { immediate: true })

onMounted(async () => {
    const escuelas = await listarEscuelas()
    escuelasOpciones.value = [
        { value: '', label: 'Sin escuela asignada' },
        ...escuelas.map((e) => ({
            value: String(e.id),
            label: e.turno ? `${e.nombre} (${e.turno})` : e.nombre,
        })),
    ]
})

function validar(): string {
    const f = form.value
    if (!f.nombre_alumno.trim() || !f.apellido_paterno_alumno.trim() || !f.apellido_materno_alumno.trim()) {
        return 'El nombre y los dos apellidos del alumno son obligatorios'
    }
    if (sinTutor.value && !f.telefono_alumno.trim()) {
        return 'El teléfono del alumno es obligatorio'
    }
    if (!sinTutor.value && (!f.nombre_tutor.trim() || !f.telefono_tutor.trim())) {
        return 'El nombre y el teléfono del tutor son obligatorios'
    }
    return ''
}

// Un campo vacío no se manda: el servidor conserva el valor que ya tenía
function texto(valor: string): string | undefined {
    return valor.trim() || undefined
}

async function guardar() {
    if (!hayCambios.value) return
    errorGuardar.value = validar()
    if (errorGuardar.value) return

    guardando.value = true
    try {
        const f = form.value
        const payload: ActualizarProspectoPayload = {
            nombre_alumno: texto(f.nombre_alumno),
            apellido_paterno_alumno: texto(f.apellido_paterno_alumno),
            apellido_materno_alumno: texto(f.apellido_materno_alumno),
            telefono_alumno: texto(f.telefono_alumno),
            // Sin tutor no se manda nada del tutor: el servidor rechazaría un teléfono vacío
            nombre_tutor: sinTutor.value ? undefined : texto(f.nombre_tutor),
            telefono_tutor: sinTutor.value ? undefined : texto(f.telefono_tutor),
            telefono_emergencia: texto(f.telefono_emergencia),
            correo: texto(f.correo),
            escuela_id: f.escuela_id ? Number(f.escuela_id) : undefined,
            codigo_postal: texto(f.codigo_postal),
            calle: texto(f.calle),
            numero_exterior: texto(f.numero_exterior),
            numero_interior: texto(f.numero_interior),
            colonia: texto(f.colonia),
            direccion_referencias: texto(f.direccion_referencias),
        }
        await actualizarProspecto(props.detalle.id, payload)
        emit('guardado')
    } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 409 && typeof e.response.data === 'string') {
            errorGuardar.value = e.response.data.trim()
        } else {
            errorGuardar.value = 'No se pudieron guardar los cambios'
        }
    } finally {
        guardando.value = false
    }
}
</script>

<template>
    <form ref="formEl" class="space-y-5" @submit.prevent="guardar">
        <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Datos del alumno</p>
            <div class="grid gap-3 sm:grid-cols-2">
                <div>
                    <label class="block text-xs text-text-secondary">Nombre del alumno</label>
                    <input v-model="form.nombre_alumno" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Apellido paterno</label>
                    <input v-model="form.apellido_paterno_alumno" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Apellido materno</label>
                    <input v-model="form.apellido_materno_alumno" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">
                        Teléfono del alumno {{ sinTutor ? '' : '(opcional)' }}
                    </label>
                    <input v-model="form.telefono_alumno" type="tel" :class="clasesCampo" />
                </div>
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Escuela</label>
                <DropdownSelect v-model="form.escuela_id" :opciones="escuelasOpciones" alinear="full"
                    class="mt-1 w-full" />
            </div>
        </div>

        <div v-if="!sinTutor" class="space-y-3 border-t border-border pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Datos del tutor</p>
            <p class="text-xs text-text-secondary">
                El tutor es el mismo para toda la familia: lo que cambies aquí se refleja en sus otros alumnos.
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
                <div>
                    <label class="block text-xs text-text-secondary">Nombre del tutor</label>
                    <input v-model="form.nombre_tutor" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Teléfono del tutor</label>
                    <input v-model="form.telefono_tutor" type="tel" :class="clasesCampo" />
                </div>
            </div>
        </div>

        <div class="space-y-3 border-t border-border pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Contacto</p>
            <div class="grid gap-3 sm:grid-cols-2">
                <div>
                    <label class="block text-xs text-text-secondary">Teléfono de emergencia</label>
                    <input v-model="form.telefono_emergencia" type="tel" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Correo</label>
                    <input v-model="form.correo" type="email" :class="clasesCampo" />
                </div>
            </div>
        </div>

        <div class="space-y-3 border-t border-border pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Domicilio del alumno</p>
            <div class="grid gap-3 sm:grid-cols-2">
                <div>
                    <label class="block text-xs text-text-secondary">Calle</label>
                    <input v-model="form.calle" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Número exterior</label>
                    <input v-model="form.numero_exterior" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Número interior</label>
                    <input v-model="form.numero_interior" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Colonia</label>
                    <input v-model="form.colonia" type="text" :class="clasesCampo" />
                </div>
                <div>
                    <label class="block text-xs text-text-secondary">Código postal</label>
                    <input v-model="form.codigo_postal" type="text" :class="clasesCampo" />
                </div>
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Referencias de domicilio</label>
                <input v-model="form.direccion_referencias" type="text" :class="clasesCampo" />
            </div>
        </div>

        <p v-if="errorGuardar" class="text-sm text-danger">{{ errorGuardar }}</p>

        <div class="flex justify-end gap-3">
            <button type="button"
                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                @click="emit('cancelar')">
                Cancelar
            </button>
            <button type="submit" :disabled="!hayCambios || guardando"
                class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                <Spinner v-if="guardando" />
                <Save v-else class="h-4 w-4" />
                Guardar
            </button>
        </div>
    </form>
</template>