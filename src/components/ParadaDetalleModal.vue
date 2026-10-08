<script setup lang="ts">
import { ref, computed } from 'vue'
import { School, MapPin, Signpost, Home, X, Maximize2, Navigation, Copy, Check } from 'lucide-vue-next'
import type { ParadaRuta } from '@/types/conductor'
import { inicial } from '@/utils/conductores'
import VisorCaptura from '@/components/VisorCaptura.vue'

const props = defineProps<{ titulo: string; alumnos: ParadaRuta[] | null }>()
const emit = defineEmits<{ close: [] }>()

// Hermanos de una misma parada comparten domicilio: se muestra el del primero
const casa = computed(() => props.alumnos?.[0] ?? null)

// Solo muestra lo que esté lleno: sin huecos
const lineas = computed(() => {
    const a = casa.value
    if (!a) return []
    return [
        [a.calle, a.numero_exterior].filter(Boolean).join(' '),
        a.numero_interior ? `Interior ${a.numero_interior}` : '',
        a.colonia ?? '',
        a.codigo_postal ? `C.P. ${a.codigo_postal}` : '',
    ].filter(Boolean)
})

const textoDireccion = computed(() => lineas.value.join(', '))
const enlaceMapa = computed(
    () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textoDireccion.value)}`,
)

// Solo se muestran fotos con enlace http(s): el enlace lo captura un usuario y no debe poder ejecutar nada
const foto = computed(() => {
    const url = casa.value?.foto_domicilio_url ?? ''
    try {
        const u = new URL(url)
        return u.protocol === 'http:' || u.protocol === 'https:' ? url : ''
    } catch {
        return ''
    }
})

const sinDatos = computed(() => lineas.value.length === 0 && !casa.value?.referencias && !foto.value)

const verFoto = ref(false)
const copiado = ref(false)

async function copiar() {
    try {
        await navigator.clipboard.writeText(textoDireccion.value)
        copiado.value = true
        setTimeout(() => (copiado.value = false), 2000)
    } catch {
        copiado.value = false
    }
}

function escuelaDe(a: ParadaRuta): string {
    return a.turno ? `${a.escuela} (${a.turno})` : a.escuela
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
            <div v-if="alumnos && casa"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                @click.self="emit('close')" @keydown="alTeclaEsc" tabindex="-1">
                <Transition appear enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95">
                    <div
                        class="glass relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-card">
                        <button
                            class="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-text-primary backdrop-blur hover:bg-black/60"
                            aria-label="Cerrar" @click="emit('close')">
                            <X class="h-4 w-4" />
                        </button>

                        <div v-if="foto" class="relative h-48 shrink-0">
                            <img :src="foto" alt="Foto de la casa" class="h-full w-full object-cover" />
                            <button type="button"
                                class="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-text-primary backdrop-blur hover:bg-black/60"
                                @click="verFoto = true">
                                <Maximize2 class="h-3.5 w-3.5" />
                                Ampliar
                            </button>
                        </div>
                        <div v-else class="relative h-36 shrink-0 overflow-hidden bg-panel-2/60">
                            <span
                                class="absolute left-1/2 top-4 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-accent/15 text-accent">
                                <Home class="h-5 w-5" />
                            </span>
                            <div class="absolute inset-x-0 bottom-9 border-t border-dashed border-text-secondary/30">
                            </div>
                            <div class="van" aria-hidden="true">
                                <svg class="rebote" width="34" height="18" viewBox="0 0 34 18"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <rect x="1" y="3" width="24" height="10" rx="2" fill="var(--color-accent)" />
                                    <path d="M25 6h5l3 4v3h-8z" fill="var(--color-accent)" />
                                    <rect x="26.5" y="7" width="4" height="3" rx="0.5" fill="var(--color-bg)" />
                                    <circle cx="8" cy="14" r="3" fill="var(--color-text-primary)"
                                        stroke="var(--color-bg)" stroke-width="1" />
                                    <circle cx="27" cy="14" r="3" fill="var(--color-text-primary)"
                                        stroke="var(--color-bg)" stroke-width="1" />
                                </svg>
                            </div>
                            <p class="absolute inset-x-0 bottom-2 text-center text-xs text-text-secondary">
                                El cliente aún no sube la foto de su casa
                            </p>
                        </div>

                        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 scroll-fino">
                            <div>
                                <h2 class="text-xl font-semibold text-text-primary">{{ titulo }}</h2>
                                <p v-if="alumnos.length === 1"
                                    class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs text-accent">
                                    <School class="h-3.5 w-3.5" />
                                    {{ escuelaDe(casa) }}
                                </p>
                            </div>

                            <ul v-if="alumnos.length > 1" class="space-y-2">
                                <li v-for="a in alumnos" :key="a.alumno_id" class="flex items-center gap-3">
                                    <span
                                        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent">
                                        {{ inicial(a.alumno) }}
                                    </span>
                                    <span class="min-w-0">
                                        <span class="block truncate text-sm font-medium text-text-primary">{{ a.alumno
                                            }}</span>
                                        <span class="block truncate text-xs text-text-secondary">{{ escuelaDe(a)
                                            }}</span>
                                    </span>
                                </li>
                            </ul>

                            <section v-if="lineas.length" class="space-y-3">
                                <div class="flex gap-3">
                                    <span
                                        class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                                        <MapPin class="h-4 w-4" />
                                    </span>
                                    <div class="min-w-0">
                                        <p class="text-xs text-text-secondary">Dirección</p>
                                        <p v-for="(linea, i) in lineas" :key="i"
                                            :class="i === 0 ? 'text-base font-medium text-text-primary' : 'text-sm text-text-secondary'">
                                            {{ linea }}
                                        </p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <a :href="enlaceMapa" target="_blank" rel="noopener noreferrer"
                                        class="flex items-center justify-center gap-2 rounded-card bg-accent px-3 py-2.5 text-sm font-semibold text-bg hover:opacity-90">
                                        <Navigation class="h-4 w-4" />
                                        Cómo llegar
                                    </a>
                                    <button type="button"
                                        class="flex items-center justify-center gap-2 rounded-card border border-border px-3 py-2.5 text-sm text-text-primary hover:bg-panel-2"
                                        @click="copiar">
                                        <Check v-if="copiado" class="h-4 w-4 text-mint" />
                                        <Copy v-else class="h-4 w-4" />
                                        {{ copiado ? 'Copiada' : 'Copiar' }}
                                    </button>
                                </div>
                            </section>

                            <section v-if="casa.referencias" class="space-y-2">
                                <h3 class="flex items-center gap-1.5 text-xs text-text-secondary">
                                    <Signpost class="h-4 w-4 text-sun" />Referencias
                                </h3>
                                <p
                                    class="whitespace-pre-line rounded-card border-l-4 border-sun bg-sun/10 px-4 py-3 text-base leading-relaxed text-text-primary">
                                    {{ casa.referencias }}
                                </p>
                            </section>

                            <p v-if="sinDatos" class="py-4 text-center text-sm text-text-secondary">
                                Todavía no hay datos de la casa.
                            </p>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>

    <VisorCaptura :url="foto" :abierto="verFoto" @close="verFoto = false" />
</template>

<style scoped>
.van {
    position: absolute;
    bottom: 35px;
    left: -14%;
    animation: pasa 7s linear infinite;
}

.rebote {
    animation: rebote 0.45s ease-in-out infinite alternate;
}

@keyframes pasa {
    from {
        left: -14%;
    }

    to {
        left: 104%;
    }
}

@keyframes rebote {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(-1px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .van {
        animation: none;
        left: calc(50% - 17px);
    }

    .rebote {
        animation: none;
    }
}
</style>