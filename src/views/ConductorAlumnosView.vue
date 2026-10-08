<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft, GripVertical, Plus } from 'lucide-vue-next'
import { verRutaConductor, guardarRutaConductor } from '@/api/conductores'
import type { ParadaRuta, RutaConductor } from '@/types/conductor'
import LoaderVan from '@/components/LoaderVan.vue'
import { colorEscuela } from '@/utils/escuelas'
import ParadaDetalleModal from '@/components/ParadaDetalleModal.vue'

const route = useRoute()
const router = useRouter()

const ruta = ref<RutaConductor | null>(null)
const lista = ref<Parada[]>([])
const cargando = ref(true)
const error = ref('')
const errorGuardar = ref('')
const guardando = ref(false)

const conductorId = computed(() => Number(route.params.id))

// La furgoneta se queda visible al menos este tiempo, para que se alcance a ver la animación
const ESPERA_MINIMA_MS = 1000
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

async function cargar() {
    cargando.value = true
    error.value = ''
    try {
        const [datos] = await Promise.all([verRutaConductor(conductorId.value), esperar(ESPERA_MINIMA_MS)])
        ruta.value = datos
        lista.value = agrupar(datos.paradas)
    } catch {
        error.value = 'No se pudo cargar la lista de alumnos'
    } finally {
        cargando.value = false
    }
}

onMounted(cargar)

onUnmounted(() => {
    cancelarEspera()
    if (temporizadorAviso) clearTimeout(temporizadorAviso)
    document.removeEventListener('touchmove', bloquearDesplazamiento)
})

function volver() {
    router.push({ name: 'conductor-detalle', params: { id: conductorId.value } })
}

function irAAgregar() {
    router.push({ name: 'conductor-agregar', params: { id: conductorId.value } })
}

interface Parada {
    clave: string
    alumnos: ParadaRuta[]
}

const paradaAbierta = ref<Parada | null>(null)
let ignorarClic = false

function abrir(p: Parada) {
    if (arrastre.value || ignorarClic) return
    paradaAbierta.value = p
}

// Hermanos (mismo tutor y misma escuela) van juntos en una sola parada
function agrupar(alumnos: ParadaRuta[]): Parada[] {
    const paradas: Parada[] = []
    const porClave = new Map<string, Parada>()
    for (const a of alumnos) {
        const clave = a.tutor_id === null ? `a-${a.alumno_id}` : `t-${a.tutor_id}-${a.escuela}`
        let parada = porClave.get(clave)
        if (!parada) {
            parada = { clave, alumnos: [] }
            porClave.set(clave, parada)
            paradas.push(parada)
        }
        parada.alumnos.push(a)
    }
    return paradas
}

function palabras(nombre: string): string[] {
    return nombre.trim().split(/\s+/)
}

// Apellidos que comparten todos los hermanos de la parada, sin contar el primer nombre
function apellidosComunes(alumnos: ParadaRuta[]): string {
    const listas = alumnos.map((a) => palabras(a.alumno))
    const limite = Math.min(...listas.map((l) => l.length)) - 1
    const comunes: string[] = []
    for (let i = 1; i <= limite; i++) {
        const palabra = listas[0]![listas[0]!.length - i]!
        if (!listas.every((l) => l[l.length - i] === palabra)) break
        comunes.unshift(palabra)
    }
    return comunes.join(' ')
}

function unir(nombres: string[]): string {
    if (nombres.length <= 1) return nombres.join('')
    return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

function primerosNombres(p: Parada): string {
    return unir(p.alumnos.map((a) => palabras(a.alumno)[0]!))
}

function titulo(p: Parada): string {
    if (p.alumnos.length === 1) return p.alumnos[0]!.alumno
    const apellidos = apellidosComunes(p.alumnos)
    return apellidos ? `Hermanos ${apellidos}` : primerosNombres(p)
}

// Solo muestra lo que esté lleno: sin huecos ni comas sueltas
function direccion(a: ParadaRuta): string {
    const calle = [a.calle, a.numero_exterior].filter(Boolean).join(' ')
    const interior = a.numero_interior ? `int. ${a.numero_interior}` : ''
    const parte = [calle, interior].filter(Boolean).join(', ')
    return [parte, a.colonia].filter(Boolean).join(' · ')
}

function nombreEscuela(a: ParadaRuta): string {
    return a.turno ? `${a.escuela} (${a.turno})` : a.escuela
}

function textoResumen(): string {
    const alumnos = lista.value.reduce((suma, p) => suma + p.alumnos.length, 0)
    const n = lista.value.length
    return `${alumnos === 1 ? '1 alumno' : `${alumnos} alumnos`} · ${n === 1 ? '1 parada' : `${n} paradas`}, en este orden`
}

// ---- Guardar, quitar y deshacer ----

interface Aviso {
    texto: string
    anterior: Parada[]
}

const aviso = ref<Aviso | null>(null)
let temporizadorAviso: ReturnType<typeof setTimeout> | null = null

function mostrarAviso(texto: string, anterior: Parada[]) {
    aviso.value = { texto, anterior }
    if (temporizadorAviso) clearTimeout(temporizadorAviso)
    temporizadorAviso = setTimeout(() => (aviso.value = null), 6000)
}

function quitarAviso() {
    if (temporizadorAviso) clearTimeout(temporizadorAviso)
    aviso.value = null
}

function idsDe(paradas: Parada[]): number[] {
    return paradas.flatMap((p) => p.alumnos.map((x) => x.alumno_id))
}

// Muestra el cambio al momento y lo guarda; si falla, regresa la lista a como estaba
// Solo "Quitar" ofrece Deshacer: si llega un texto se muestra el aviso; cambiar el orden no lo ofrece
async function guardarLista(nueva: Parada[], anterior: Parada[], texto?: string) {
    if (!texto) quitarAviso()
    lista.value = nueva
    guardando.value = true
    try {
        await guardarRutaConductor(conductorId.value, idsDe(nueva))
        if (texto) mostrarAviso(texto, anterior)
    } catch {
        lista.value = anterior
        errorGuardar.value = 'No se pudo guardar el cambio. Se dejó como estaba'
    } finally {
        guardando.value = false
    }
}

async function deshacer() {
    const a = aviso.value
    if (!a || guardando.value) return
    if (temporizadorAviso) clearTimeout(temporizadorAviso)
    aviso.value = null
    const actual = lista.value
    lista.value = a.anterior
    guardando.value = true
    try {
        await guardarRutaConductor(conductorId.value, idsDe(a.anterior))
    } catch {
        lista.value = actual
        errorGuardar.value = 'No se pudo deshacer. Inténtalo de nuevo'
    } finally {
        guardando.value = false
    }
}

function quitar(i: number) {
    if (guardando.value || arrastre.value) return
    errorGuardar.value = ''
    const anterior = lista.value
    const nueva = anterior.filter((_, k) => k !== i)
    guardarLista(nueva, anterior, `Quitado de la lista de ${ruta.value?.conductor.nombre ?? 'el conductor'}`)
}

// ---- Arrastrar para cambiar el orden: con el asa, o dejando presionada cualquier parada ----

const PRESION_LARGA_MS = 400
const MOVIMIENTO_MAXIMO_PX = 8

interface Arrastre {
    i: number // parada que se está moviendo
    destino: number // lugar al que llegaría si se suelta ahora
    dy: number // cuánto se ha movido el dedo hacia arriba o abajo
    alto: number // alto de la parada que se mueve: es lo que se corren las demás
    y0: number
    centros: number[]
}

const arrastre = ref<Arrastre | null>(null)
const filas: HTMLElement[] = []

function guardarFila(el: unknown, i: number) {
    if (el instanceof HTMLElement) filas[i] = el
}

let espera: { timer: ReturnType<typeof setTimeout>; x: number; y: number } | null = null

function cancelarEspera() {
    if (espera) clearTimeout(espera.timer)
    espera = null
}

// Mientras se arrastra, la pantalla no debe deslizarse
function bloquearDesplazamiento(evento: TouchEvent) {
    if (evento.cancelable) evento.preventDefault()
}

function comenzar(el: HTMLElement, pointerId: number, y: number, i: number) {
    if (guardando.value || arrastre.value) return
    const rects = lista.value.map((_, k) => filas[k]!.getBoundingClientRect())
    el.setPointerCapture(pointerId)
    document.addEventListener('touchmove', bloquearDesplazamiento, { passive: false })
    navigator.vibrate?.(12)
    errorGuardar.value = ''
    arrastre.value = {
        i,
        destino: i,
        dy: 0,
        alto: rects[i]!.height,
        y0: y,
        centros: rects.map((r) => r.top + r.height / 2),
    }
}

// Con el asa se arrastra de inmediato
function empezarConAsa(evento: PointerEvent, i: number) {
    comenzar(evento.currentTarget as HTMLElement, evento.pointerId, evento.clientY, i)
}

// En cualquier parte de la parada: hay que dejarla presionada un momento sin mover el dedo
function presionar(evento: PointerEvent, i: number) {
    if (arrastre.value || guardando.value) return
    if (evento.pointerType === 'mouse' && evento.button !== 0) return
    cancelarEspera()
    const el = evento.currentTarget as HTMLElement
    const { pointerId, clientX, clientY } = evento
    espera = {
        x: clientX,
        y: clientY,
        timer: setTimeout(() => {
            espera = null
            comenzar(el, pointerId, clientY, i)
        }, PRESION_LARGA_MS),
    }
}

function mover(evento: PointerEvent) {
    // Si el dedo se mueve antes de tiempo, se entiende que quiere deslizar la pantalla
    if (espera && Math.hypot(evento.clientX - espera.x, evento.clientY - espera.y) > MOVIMIENTO_MAXIMO_PX) {
        cancelarEspera()
    }
    const a = arrastre.value
    if (!a) return
    a.dy = evento.clientY - a.y0
    const centro = a.centros[a.i]! + a.dy
    let destino = a.i
    for (let k = a.i + 1; k < a.centros.length; k++) if (centro > a.centros[k]!) destino = k
    for (let k = a.i - 1; k >= 0; k--) if (centro < a.centros[k]!) destino = k
    a.destino = destino
}

async function soltar() {
    cancelarEspera()
    const a = arrastre.value
    if (!a) return
    document.removeEventListener('touchmove', bloquearDesplazamiento)
    arrastre.value = null

    // El dedo se levanta sobre la parada: ese toque no debe abrir su detalle
    ignorarClic = true
    setTimeout(() => (ignorarClic = false), 300)

    if (a.destino === a.i) return

    const anterior = lista.value
    const nueva = anterior.slice()
    const [movida] = nueva.splice(a.i, 1)
    nueva.splice(a.destino, 0, movida!)
    await guardarLista(nueva, anterior)
}

// Al presionar mucho, el celular ofrece "copiar": mientras se arrastra no debe aparecer
function alMenuContextual(evento: Event) {
    if (arrastre.value || espera) evento.preventDefault()
}

// Las demás paradas se corren para dejar el hueco, y la que se mueve sigue al dedo
function estiloFila(k: number) {
    const a = arrastre.value
    if (!a) return undefined
    if (k === a.i) return { transform: `translateY(${a.dy}px) scale(1.02)`, zIndex: 20 }
    if (a.i < a.destino && k > a.i && k <= a.destino) return { transform: `translateY(${-a.alto}px)` }
    if (a.i > a.destino && k < a.i && k >= a.destino) return { transform: `translateY(${a.alto}px)` }
    return undefined
}

function claseFila(k: number): string[] {
    const a = arrastre.value
    if (!a) return []
    return k === a.i ? ['bg-panel-2', 'ring-1', 'ring-accent'] : ['transition-transform', 'duration-200']
}

// El número se actualiza al momento, mientras se arrastra
function numeroDe(k: number): number {
    const a = arrastre.value
    if (!a) return k + 1
    if (k === a.i) return a.destino + 1
    if (a.i < a.destino && k > a.i && k <= a.destino) return k
    if (a.i > a.destino && k < a.i && k >= a.destino) return k + 2
    return k + 1
}
</script>

<template>
    <div class="space-y-4">
        <button type="button" class="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            @click="volver">
            <ChevronLeft class="h-5 w-5" />
            {{ ruta?.conductor.nombre ?? 'Conductor' }}
        </button>

        <LoaderVan v-if="cargando" />
        <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

        <template v-else-if="ruta">
            <div class="sticky top-cabecera z-25 -mx-6 bg-bg px-6 pb-3 pt-2">
                <h1 class="text-2xl font-semibold text-text-primary">Sus alumnos</h1>
                <p class="mt-1 text-sm text-text-secondary">{{ textoResumen() }}</p>
                <p v-if="lista.length > 1" class="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                    <GripVertical class="h-4 w-4 text-accent" />
                    Arrastra el asa, o deja presionada una parada, para cambiar el orden
                </p>
            </div>

            <p v-if="errorGuardar" class="text-sm text-danger">{{ errorGuardar }}</p>

            <p v-if="lista.length === 0" class="py-10 text-center text-sm text-text-secondary">
                {{ ruta.conductor.nombre }} no lleva a nadie todavía.
            </p>

            <div v-else>
                <div v-for="(p, i) in lista" :key="p.clave" :ref="(el) => guardarFila(el, i)"
                    class="parada -mx-2 flex touch-pan-y select-none items-start gap-4 rounded-2xl px-2 py-1.5 [-webkit-touch-callout:none]"
                    :class="claseFila(i)" :style="estiloFila(i)" @pointerdown="presionar($event, i)"
                    @pointermove="mover" @pointerup="soltar" @pointercancel="soltar" @contextmenu="alMenuContextual">
                    <div
                        class="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-bg">
                        {{ numeroDe(i) }}
                    </div>
                    <div class="min-w-0 flex-1 cursor-pointer pb-5" role="button" tabindex="0" @click="abrir(p)"
                        @keydown.enter="abrir(p)">
                        <p class="text-base font-semibold text-text-primary">{{ titulo(p) }}</p>
                        <p v-if="p.alumnos.length > 1" class="mt-0.5 text-xs text-sun">{{ primerosNombres(p) }}</p>
                        <p v-if="direccion(p.alumnos[0]!)" class="mt-0.5 text-sm text-text-secondary">
                            {{ direccion(p.alumnos[0]!) }}
                        </p>
                        <span
                            class="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
                            :class="colorEscuela(p.alumnos[0]!.escuela_id).etiqueta">
                            <span class="h-1.5 w-1.5 shrink-0 rounded-full"
                                :class="colorEscuela(p.alumnos[0]!.escuela_id).punto"></span>
                            <span class="truncate">{{ nombreEscuela(p.alumnos[0]!) }}</span>
                        </span>
                        <br />
                        <button type="button" :disabled="guardando"
                            class="mt-1.5 text-xs text-danger hover:underline disabled:opacity-50"
                            @click.stop="quitar(i)" @pointerdown.stop @keydown.enter.stop>
                            Quitar
                        </button>
                    </div>
                    <div v-if="lista.length > 1" role="button" aria-label="Arrastrar para cambiar el orden"
                        class="relative z-10 flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center self-center rounded-xl bg-panel-2 text-text-secondary"
                        :class="{ 'cursor-grabbing text-accent': arrastre?.i === i }"
                        @pointerdown.prevent.stop="empezarConAsa($event, i)">
                        <GripVertical class="h-5 w-5" />
                    </div>
                </div>
            </div>

            <div class="sticky bottom-4 z-25 pt-2">
                <button type="button"
                    class="flex w-full items-center justify-center gap-2 rounded-card bg-accent px-4 py-3 text-sm font-semibold text-bg shadow-lg shadow-black/40 hover:opacity-90"
                    @click="irAAgregar">
                    <Plus class="h-4 w-4" />
                    Agregar alumnos
                </button>
            </div>
        </template>

        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="aviso"
                class="glass fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-card px-4 py-3 text-sm text-text-primary">
                <span class="min-w-0 truncate">{{ aviso.texto }}</span>
                <button type="button" class="shrink-0 font-semibold text-accent" @click="deshacer">Deshacer</button>
            </div>
        </Transition>

        <ParadaDetalleModal :titulo="paradaAbierta ? titulo(paradaAbierta) : ''"
            :alumnos="paradaAbierta?.alumnos ?? null" @close="paradaAbierta = null" />
    </div>
</template>

<style scoped>
.parada {
    position: relative;
}

.parada:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 24px;
    top: 42px;
    bottom: -6px;
    width: 3px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--color-accent) 35%, transparent);
}
</style>