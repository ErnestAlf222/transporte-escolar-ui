<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Mail, KeyRound, Send, Pencil, MapPin } from 'lucide-vue-next'
import {
  cambiarAccesoPortal,
  corregirCorreoTutor,
  reenviarCodigoTutor,
  avisarTutor,
} from '@/features/clientes/api/clientes'
import type { ClienteDetalle } from '@/features/clientes/types/cliente'
import { CORREO_MAX_CARACTERES, TEXTOS_ACCESO_PORTAL as T } from '@/features/clientes/constants/accesoPortal'
import { useAviso } from '@/shared/composables/useAviso'
import { esCorreoValido } from '@/shared/utils/correo'
import { mensajeDeError } from '@/shared/utils/errores'
import { textoFechaHora } from '@/shared/utils/fecha'
import ModalConfirmacion from '@/shared/ui/ModalConfirmacion.vue'
import Spinner from '@/shared/ui/Spinner.vue'

type Accion = 'activar' | 'desactivar' | 'codigo' | 'aviso'

const props = defineProps<{ detalle: ClienteDetalle; puedeEditar: boolean }>()
const emit = defineEmits<{ cambio: [] }>()

const { mostrarAviso } = useAviso()

// El servidor aún no dice si el acceso está activo: se conoce solo lo que se cambia en esta pantalla
const activo = ref<boolean | undefined>(props.detalle.acceso_portal)
watch(
  () => props.detalle.acceso_portal,
  (valor) => {
    if (valor !== undefined) activo.value = valor
  },
)

const tutorId = computed(() => props.detalle.tutor_id)
const correoActual = computed(() => props.detalle.correo.trim())
const faltaCorreo = computed(() => correoActual.value === '')
const fechaDireccion = computed(() =>
  props.detalle.direccion_actualizada_en ? textoFechaHora(props.detalle.direccion_actualizada_en) : '',
)

const confirmando = ref<Accion | null>(null)
const enviando = ref(false)

const TEXTOS_CONFIRMAR: Record<Accion, { titulo: string; ayuda: string }> = {
  activar: { titulo: T.confirmarActivar, ayuda: T.ayudaActivar },
  desactivar: { titulo: T.confirmarDesactivar, ayuda: T.ayudaDesactivar },
  codigo: { titulo: T.confirmarCodigo, ayuda: T.ayudaCodigo },
  aviso: { titulo: T.confirmarAviso, ayuda: T.ayudaAviso },
}

async function ejecutar(accion: Accion): Promise<string> {
  if (accion === 'activar' || accion === 'desactivar') {
    const r = await cambiarAccesoPortal(props.detalle.id, accion === 'activar')
    activo.value = accion === 'activar'
    return r.mensaje
  }
  if (tutorId.value === null) throw new Error('sin tutor')
  return (accion === 'codigo' ? await reenviarCodigoTutor(tutorId.value) : await avisarTutor(tutorId.value)).mensaje
}

async function confirmar() {
  const accion = confirmando.value
  if (!accion || enviando.value) return
  enviando.value = true
  try {
    mostrarAviso(await ejecutar(accion))
    emit('cambio')
  } catch (e) {
    mostrarAviso(mensajeDeError(e, T.errorGenerico), 'error')
  } finally {
    enviando.value = false
    confirmando.value = null
  }
}

// Correo del tutor: si falta, el campo ya viene abierto
const editandoCorreo = ref(false)
const correoNuevo = ref('')
const guardandoCorreo = ref(false)
const mostrarCampoCorreo = computed(
  () => props.puedeEditar && tutorId.value !== null && (faltaCorreo.value || editandoCorreo.value),
)
const correoValido = computed(() => esCorreoValido(correoNuevo.value))
const correoSinCambios = computed(() => correoNuevo.value.trim() === correoActual.value)

function empezarEditarCorreo() {
  correoNuevo.value = correoActual.value
  editandoCorreo.value = true
}

async function guardarCorreo() {
  if (tutorId.value === null || !correoValido.value || correoSinCambios.value || guardandoCorreo.value) return
  guardandoCorreo.value = true
  try {
    const r = await corregirCorreoTutor(tutorId.value, correoNuevo.value.trim())
    mostrarAviso(r.mensaje || T.exitoCorreo)
    editandoCorreo.value = false
    emit('cambio')
  } catch (e) {
    mostrarAviso(mensajeDeError(e, T.errorGenerico), 'error')
  } finally {
    guardandoCorreo.value = false
  }
}
</script>

<template>
  <div class="glass space-y-3 rounded-card p-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-text-secondary">{{ T.titulo }}</p>

    <!-- Estado del acceso -->
    <div v-if="activo !== undefined" class="flex items-center justify-between gap-3">
      <p class="text-sm" :class="activo ? 'text-mint' : 'text-text-secondary'">
        {{ activo ? T.estadoActivo : T.estadoApagado }}
      </p>
      <button v-if="puedeEditar" type="button" role="switch" :aria-checked="activo" :aria-label="T.titulo"
        :disabled="enviando"
        class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 motion-reduce:transition-none"
        :class="activo ? 'bg-accent' : 'bg-panel-2'" @click="confirmando = activo ? 'desactivar' : 'activar'">
        <span
          class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-bg transition-transform motion-reduce:transition-none"
          :class="activo ? 'translate-x-5' : 'translate-x-0'"></span>
      </button>
    </div>
    <div v-else-if="puedeEditar" class="space-y-2">
      <p class="text-sm text-text-secondary">{{ T.estadoDesconocido }}</p>
      <div class="flex flex-wrap gap-2">
        <button type="button" :disabled="enviando"
          class="rounded-card border border-border px-3 py-2 text-sm text-text-primary hover:bg-panel-2 disabled:opacity-50"
          @click="confirmando = 'activar'">{{ T.activar }}</button>
        <button type="button" :disabled="enviando"
          class="rounded-card border border-border px-3 py-2 text-sm text-text-primary hover:bg-panel-2 disabled:opacity-50"
          @click="confirmando = 'desactivar'">{{ T.desactivar }}</button>
      </div>
    </div>

    <!-- Correo del tutor -->
    <div v-if="tutorId !== null" class="space-y-2">
      <p class="text-xs text-text-secondary">{{ T.correo }}</p>
      <template v-if="mostrarCampoCorreo">
        <p v-if="faltaCorreo" class="rounded-card bg-sun/10 px-3 py-2 text-sm text-sun">{{ T.correoFalta }}</p>
        <input v-model="correoNuevo" type="email" inputmode="email" autocomplete="off"
          :maxlength="CORREO_MAX_CARACTERES" :aria-label="T.correo" @keydown.enter.prevent="guardarCorreo"
          class="w-full rounded-card border border-border bg-panel/40 px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent" />
        <p v-if="correoNuevo.trim() && !correoValido" class="text-xs text-danger">{{ T.correoInvalido }}</p>
        <div class="flex justify-end gap-2">
          <button v-if="!faltaCorreo" type="button"
            class="rounded-card border border-border px-3 py-2 text-sm text-text-secondary hover:bg-panel-2"
            @click="editandoCorreo = false">{{ T.cancelar }}</button>
          <button type="button" :disabled="!correoValido || correoSinCambios || guardandoCorreo"
            class="flex items-center gap-2 rounded-card bg-accent px-3 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            @click="guardarCorreo">
            <Spinner v-if="guardandoCorreo" />
            {{ T.correoGuardar }}
          </button>
        </div>
      </template>
      <div v-else class="flex items-center justify-between gap-3">
        <p v-if="faltaCorreo" class="text-sm text-sun">{{ T.correoFaltaLectura }}</p>
        <p v-else class="flex min-w-0 items-center gap-2 text-sm text-text-primary">
          <Mail class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ correoActual }}</span>
        </p>
        <button v-if="puedeEditar && !faltaCorreo" type="button" :title="T.correoCambiar" :aria-label="T.correoCambiar"
          class="shrink-0 text-accent hover:opacity-80" @click="empezarEditarCorreo">
          <Pencil class="h-4 w-4" />
        </button>
      </div>

      <div v-if="puedeEditar" class="flex flex-wrap gap-2 pt-1">
        <button type="button" :disabled="faltaCorreo || enviando"
          class="flex items-center gap-2 rounded-card border border-border px-3 py-2 text-sm text-text-primary hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-50"
          @click="confirmando = 'codigo'">
          <KeyRound class="h-4 w-4" />
          {{ T.reenviarCodigo }}
        </button>
        <button type="button" :disabled="faltaCorreo || enviando"
          class="flex items-center gap-2 rounded-card border border-border px-3 py-2 text-sm text-text-primary hover:bg-panel-2 disabled:cursor-not-allowed disabled:opacity-50"
          @click="confirmando = 'aviso'">
          <Send class="h-4 w-4" />
          {{ T.avisarTutor }}
        </button>
      </div>
    </div>

    <p v-if="fechaDireccion" class="flex items-start gap-2 text-xs text-text-secondary">
      <MapPin class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ T.ultimoCambioDireccion }}: {{ fechaDireccion }}</span>
    </p>

    <ModalConfirmacion :abierto="confirmando !== null" :etiqueta="T.titulo" @cerrar="confirmando = null">
      <template v-if="confirmando">
        <p class="text-base font-semibold text-text-primary">{{ TEXTOS_CONFIRMAR[confirmando].titulo }}</p>
        <p class="text-sm text-text-secondary">{{ TEXTOS_CONFIRMAR[confirmando].ayuda }}</p>
        <div class="flex justify-end gap-3">
          <button type="button"
            class="rounded-card border border-border px-4 py-2 text-sm text-text-secondary hover:bg-panel-2"
            @click="confirmando = null">{{ T.cancelar }}</button>
          <button type="button" :disabled="enviando"
            class="flex items-center gap-2 rounded-card bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
            @click="confirmar">
            <Spinner v-if="enviando" />
            {{ T.confirmar }}
          </button>
        </div>
      </template>
    </ModalConfirmacion>
  </div>
</template>
