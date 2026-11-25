<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Save } from 'lucide-vue-next'
import { actualizarConfiguracion, verDatosPago } from '@/shared/api/configuracion'
import { useAviso } from '@/shared/composables/useAviso'
import { TARJETA_DIGITOS_MAX, TARJETA_DIGITOS_MIN } from '@/shared/constants/tarjeta'
import { mensajeDeError } from '@/shared/utils/errores'
import { agruparTarjeta, digitosTarjeta } from '@/shared/utils/tarjeta'
import { TEXTOS_DATOS_PAGO as T } from '@/features/apariencia/constants/datosPago'
import Spinner from '@/shared/ui/Spinner.vue'

const props = defineProps<{ puedeEditar: boolean }>()

const { mostrarAviso } = useAviso()

const guardada = ref('') // solo dígitos, como está en el servidor
const campo = ref('') // lo que se ve en el campo, en grupos de 4
const cargando = ref(true)
const guardando = ref(false)
const errorCarga = ref('')

const digitos = computed(() => digitosTarjeta(campo.value))
const longitudValida = computed(
  () => digitos.value === '' || (digitos.value.length >= TARJETA_DIGITOS_MIN && digitos.value.length <= TARJETA_DIGITOS_MAX),
)
const hayCambios = computed(() => digitos.value !== guardada.value)
const puedeGuardar = computed(() => props.puedeEditar && hayCambios.value && longitudValida.value && !guardando.value)

function alEscribir(evento: Event) {
  // Solo dígitos y con espacio cada 4; el límite de largo es el del servidor
  const limpio = digitosTarjeta((evento.target as HTMLInputElement).value).slice(0, TARJETA_DIGITOS_MAX)
  campo.value = agruparTarjeta(limpio)
  ;(evento.target as HTMLInputElement).value = campo.value
}

async function cargar() {
  try {
    guardada.value = digitosTarjeta((await verDatosPago()).tarjeta_deposito)
    campo.value = agruparTarjeta(guardada.value)
  } catch (e) {
    errorCarga.value = mensajeDeError(e, T.errorCargar)
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  if (!puedeGuardar.value) return
  guardando.value = true
  const nueva = digitos.value
  try {
    await actualizarConfiguracion({ tarjeta_deposito: nueva })
    guardada.value = nueva
    mostrarAviso(nueva ? T.guardada : T.borrada)
  } catch (e) {
    mostrarAviso(mensajeDeError(e, T.errorGuardar), 'error')
  } finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="glass space-y-3 rounded-card p-4">
    <p class="text-sm font-medium text-text-primary">{{ T.titulo }}</p>
    <p class="text-xs text-text-secondary">{{ puedeEditar ? T.ayuda : T.ayudaLectura }}</p>

    <p v-if="cargando" class="flex items-center gap-2 text-sm text-text-secondary">
      <Spinner />
    </p>
    <p v-else-if="errorCarga" class="text-sm text-danger">{{ errorCarga }}</p>
    <template v-else>
      <label class="block text-xs text-text-secondary" for="tarjeta-deposito">{{ T.etiqueta }}</label>
      <input v-if="puedeEditar" id="tarjeta-deposito" :value="campo" type="text" inputmode="numeric"
        autocomplete="off" :placeholder="T.placeholder" :aria-invalid="!longitudValida"
        class="w-full rounded-card border bg-panel/40 px-3 py-2 font-mono text-sm tracking-wider text-text-primary focus:outline-none focus:ring-1"
        :class="longitudValida ? 'border-border focus:border-accent focus:ring-accent' : 'border-danger focus:border-danger focus:ring-danger'"
        @input="alEscribir" @keydown.enter.prevent="guardar" />
      <p v-else id="tarjeta-deposito" class="font-mono text-sm tracking-wider text-text-primary">
        {{ campo || T.vacia }}
      </p>
      <p v-if="!longitudValida" class="text-xs text-danger">{{ T.longitud }}</p>

      <div v-if="puedeEditar" class="flex justify-end">
        <button type="button" :disabled="!puedeGuardar"
          class="flex items-center gap-2 rounded-card bg-accent px-5 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          @click="guardar">
          <Spinner v-if="guardando" />
          <Save v-else class="h-4 w-4" />
          {{ T.guardar }}
        </button>
      </div>
    </template>
  </div>
</template>
