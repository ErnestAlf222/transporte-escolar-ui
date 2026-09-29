<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { actualizarCliente } from '@/api/clientes'
import { listarEscuelas } from '@/api/escuelas'
import type { ClienteDetalle, ActualizarClientePayload } from '@/types/cliente'
import { Save } from 'lucide-vue-next'
import Spinner from '@/components/Spinner.vue'
import DropdownSelect from '@/components/DropdownSelect.vue'

const props = defineProps<{ detalle: ClienteDetalle }>()
const emit = defineEmits<{ guardado: [detalle: ClienteDetalle]; cancelar: [] }>()

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
})

const guardando = ref(false)
const errorGuardar = ref('')
const formEl = ref<HTMLFormElement | null>(null)

defineExpose({ formEl })

function precargar(d: ClienteDetalle) {
    form.value = {
        nombre_alumno: d.nombre_alumno,
        apellido_paterno_alumno: d.apellido_paterno_alumno,
        apellido_materno_alumno: d.apellido_materno_alumno,
        telefono_alumno: d.telefono_alumno ?? '',
        nombre_tutor: d.nombre_tutor,
        telefono_tutor: d.telefono_tutor,
        telefono_emergencia: d.telefono_emergencia ?? '',
        correo: d.correo,
        escuela_id: d.escuela_id ? String(d.escuela_id) : '',
    }
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

async function guardar() {
    guardando.value = true
    errorGuardar.value = ''
    try {
        const payload: ActualizarClientePayload = {
            nombre_alumno: form.value.nombre_alumno,
            apellido_paterno_alumno: form.value.apellido_paterno_alumno,
            apellido_materno_alumno: form.value.apellido_materno_alumno,
            telefono_alumno: form.value.telefono_alumno || undefined,
            nombre_tutor: form.value.nombre_tutor,
            telefono_tutor: form.value.telefono_tutor,
            telefono_emergencia: form.value.telefono_emergencia || undefined,
            correo: form.value.correo || undefined,
            escuela_id: form.value.escuela_id ? Number(form.value.escuela_id) : undefined,
        }
        await actualizarCliente(props.detalle.id, payload)

        emit('guardado', {
            ...props.detalle,
            ...payload,
            escuela_id: payload.escuela_id ?? props.detalle.escuela_id,
            nombre_escuela: escuelasOpciones.value.find((o) => o.value === form.value.escuela_id)?.label,
        })
    } catch {
        errorGuardar.value = 'No se pudieron guardar los cambios'
    } finally {
        guardando.value = false
    }
}
</script>

<template>
    <form ref="formEl" class="space-y-4" @submit.prevent="guardar">
        <div class="grid gap-3 sm:grid-cols-2">
            <div>
                <label class="block text-xs text-text-secondary">Nombre del alumno</label>
                <input v-model="form.nombre_alumno" type="text" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Apellido paterno</label>
                <input v-model="form.apellido_paterno_alumno" type="text" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Apellido materno</label>
                <input v-model="form.apellido_materno_alumno" type="text" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Teléfono del alumno (opcional)</label>
                <input v-model="form.telefono_alumno" type="tel"
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
        </div>

        <div>
            <label class="block text-xs text-text-secondary">Escuela</label>
            <DropdownSelect v-model="form.escuela_id" :opciones="escuelasOpciones" class="mt-1 w-full" />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
            <div>
                <label class="block text-xs text-text-secondary">Nombre del tutor</label>
                <input v-model="form.nombre_tutor" type="text" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Teléfono del tutor</label>
                <input v-model="form.telefono_tutor" type="tel" required
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Teléfono de emergencia (opcional)</label>
                <input v-model="form.telefono_emergencia" type="tel"
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
            <div>
                <label class="block text-xs text-text-secondary">Correo (opcional)</label>
                <input v-model="form.correo" type="email"
                    class="mt-1 w-full rounded-card border border-border bg-panel px-3 py-2 text-sm text-text-primary" />
            </div>
        </div>

        <p v-if="errorGuardar" class="text-sm text-danger">{{ errorGuardar }}</p>

        <div class="flex justify-end gap-3 pt-2">
            <button type="button"
                class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
                @click="emit('cancelar')">
                Cancelar
            </button>
            <button type="submit" :disabled="guardando"
                class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50">
                <Spinner v-if="guardando" />
                <Save v-else class="h-4 w-4" />
                Guardar
            </button>
        </div>
    </form>
</template>