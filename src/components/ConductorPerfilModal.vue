<script setup lang="ts">
import { Phone, Users, Check, Clock, X } from 'lucide-vue-next'
import type { ConductorLista } from '@/types/conductor'
import { inicial, textoAlumnos, terminoHoy, textoTermino } from '@/utils/conductores'

defineProps<{ conductor: ConductorLista | null }>()
const emit = defineEmits<{ close: []; 'ver-alumnos': [] }>()

function alTeclaEsc(evento: KeyboardEvent) {
    if (evento.key === 'Escape') emit('close')
}
</script>

<template>
    <Teleport to="body">
        <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
            enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100" leave-to-class="opacity-0">
            <div v-if="conductor"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 supports-backdrop-filter:bg-black/30 supports-backdrop-filter:backdrop-blur-sm"
                @click.self="emit('close')" @keydown="alTeclaEsc" tabindex="-1">
                <Transition appear enter-active-class="transition duration-200 ease-out"
                    enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95">
                    <div
                        class="glass relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-card p-5 sm:p-6">
                        <button class="absolute right-4 top-4 text-text-secondary hover:text-text-primary"
                            aria-label="Cerrar" @click="emit('close')">
                            <X class="h-5 w-5" />
                        </button>

                        <div class="flex flex-col items-center pt-4 text-center">
                            <div class="relative h-24 w-24">
                                <template v-if="terminoHoy(conductor)">
                                    <span class="pulso absolute inset-0 rounded-full border-2 border-mint"></span>
                                    <span
                                        class="pulso pulso-b absolute inset-0 rounded-full border-2 border-mint"></span>
                                </template>
                                <img v-if="conductor.foto_url" :src="conductor.foto_url"
                                    :alt="conductor.nombre_completo"
                                    class="relative h-24 w-24 rounded-full object-cover" />
                                <div v-else
                                    class="relative flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-semibold text-bg">
                                    {{ inicial(conductor.nombre_completo) }}
                                </div>
                            </div>

                            <h2 class="mt-4 text-xl font-semibold text-text-primary">{{ conductor.nombre_completo }}
                            </h2>
                            <span class="mt-2 rounded-full px-3 py-1 text-xs"
                                :class="conductor.estatus === 'activo' ? 'bg-mint/15 text-mint' : 'bg-panel-2 text-text-secondary'">
                                {{ conductor.estatus === 'activo' ? 'Activo' : 'Inactivo' }}
                            </span>
                        </div>

                        <div class="mt-5 divide-y divide-border text-sm">
                            <a :href="`tel:${conductor.telefono}`"
                                class="flex items-center justify-between gap-3 py-3 text-text-primary">
                                <span class="flex items-center gap-2 text-text-secondary">
                                    <Phone class="h-4 w-4" />Teléfono
                                </span>
                                {{ conductor.telefono }}
                            </a>
                            <div class="flex items-center justify-between gap-3 py-3 text-text-primary">
                                <span class="flex items-center gap-2 text-text-secondary">
                                    <Users class="h-4 w-4" />Alumnos que lleva
                                </span>
                                {{ textoAlumnos(conductor.alumnos) }}
                            </div>
                            <div class="flex items-center justify-between gap-3 py-3"
                                :class="terminoHoy(conductor) ? 'text-mint' : 'text-text-primary'">
                                <span class="flex items-center gap-2 text-text-secondary">
                                    <Check v-if="terminoHoy(conductor)" class="h-4 w-4" />
                                    <Clock v-else class="h-4 w-4" />Recorrido
                                </span>
                                {{ textoTermino(conductor) }}
                            </div>
                        </div>

                        <button type="button"
                            class="mt-5 w-full rounded-card bg-accent px-4 py-3 text-sm font-semibold text-bg hover:opacity-90"
                            @click="emit('ver-alumnos')">
                            Ver su recorrido
                        </button>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.pulso {
    opacity: 0;
    animation: pulso 2.6s ease-out infinite;
}

.pulso-b {
    animation-delay: 1.3s;
}

@keyframes pulso {
    0% {
        transform: scale(1);
        opacity: 0.55;
    }

    100% {
        transform: scale(1.6);
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .pulso {
        animation: none;
    }
}
</style>