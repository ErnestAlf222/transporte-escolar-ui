<script setup lang="ts">
import { computed } from 'vue'
import { UserRound, Phone, Mail, Users, GraduationCap } from 'lucide-vue-next'
import TarjetaPortal from '@/features/portal-cliente/components/TarjetaPortal.vue'
import { usePerfil } from '@/features/portal-cliente/composables/usePerfil'
import SeccionPortal from '@/features/portal-cliente/components/SeccionPortal.vue'
import NavegacionPortal from '@/features/portal-cliente/components/NavegacionPortal.vue'
import ContenedorPortal from '@/features/portal-cliente/components/ContenedorPortal.vue'
import FotoEditable from '@/features/portal-cliente/components/FotoEditable.vue'
import DireccionAlumno from '@/features/portal-cliente/components/DireccionAlumno.vue'
import {
    TEXTO_PERFIL_TITULO,
    TEXTO_PERFIL_SOLO_LECTURA,
    ETIQUETA_NOMBRE,
    ETIQUETA_TELEFONO_PERFIL,
    ETIQUETA_CORREO,
    ETIQUETA_PARENTESCO,
    TEXTO_PERFIL_ALUMNO,
    TEXTO_SIN_REGISTRAR,
    TEXTO_PARENTESCO_AYUDA,
} from '@/features/portal-cliente/constants/perfil'
import { TEXTO_FAMILIA_SIN_ESCUELA } from '@/features/portal-cliente/constants/portal'
import { etiquetaParentesco } from '@/shared/constants/parentesco'
import { nombreCompleto } from '@/shared/utils/nombres'

const { perfil, errores, estaOcupado, errorImagen, cambiarFotoTutor, cambiarFotoAlumno, cambiarFotoDomicilio, cambiarDireccion } =
    usePerfil()

const datos = computed(() => perfil.datos.value)
const esTutor = computed(() => datos.value?.tipo === 'tutor')

// Datos de solo lectura, como filas con icono (el correo solo si lo hay)
const filasTutor = computed(() => {
    const d = datos.value
    if (!d) return []
    return [
        { etiqueta: ETIQUETA_NOMBRE, valor: d.nombre, icono: UserRound },
        // Siempre se muestra; si el servidor no trae el dato, se dice y se explica qué hacer (no se inventa un valor)
        ...(d.tipo === 'tutor'
            ? [{
                etiqueta: ETIQUETA_PARENTESCO,
                valor: etiquetaParentesco(d.parentesco) || TEXTO_SIN_REGISTRAR,
                ayuda: etiquetaParentesco(d.parentesco) ? '' : TEXTO_PARENTESCO_AYUDA,
                icono: Users,
            }]
            : []),
        { etiqueta: ETIQUETA_TELEFONO_PERFIL, valor: d.telefono, icono: Phone },
        ...(d.correo ? [{ etiqueta: ETIQUETA_CORREO, valor: d.correo, icono: Mail }] : []),
    ]
})
</script>

<template>
    <ContenedorPortal>
        <NavegacionPortal />

        <SeccionPortal :titulo="TEXTO_PERFIL_TITULO" :icono="UserRound" :estado="perfil.estado.value" @reintentar="perfil.cargar">
            <!-- Escritorio: a la izquierda el tutor; a la derecha, la tarjeta de cada alumno. En móvil, una columna -->
            <div v-if="datos" class="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 lg:space-y-0">
                <!-- Tutor: avatar grande con su botón de foto y datos de solo lectura como filas con icono -->
                <TarjetaPortal class="entra-suave space-y-6 lg:sticky lg:top-6">
                    <FotoEditable v-if="esTutor" :foto="datos.foto_url" :nombre="datos.nombre" :subiendo="estaOcupado('tutor')"
                        @elegida="cambiarFotoTutor" @error="errorImagen" />
                    <p v-if="errores.tutor" role="alert" class="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{{ errores.tutor }}</p>
                    <dl class="space-y-3">
                        <div v-for="f in filasTutor" :key="f.etiqueta" class="flex items-center gap-4 rounded-2xl bg-panel-2 px-4 py-3">
                            <span aria-hidden="true" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                                <component :is="f.icono" class="h-5 w-5" />
                            </span>
                            <div class="min-w-0">
                                <dt class="text-xs font-bold uppercase tracking-wide text-text-muted">{{ f.etiqueta }}</dt>
                                <dd class="break-all text-base font-bold text-text-primary">{{ f.valor }}</dd>
                                <p v-if="'ayuda' in f && f.ayuda" class="text-xs text-text-secondary">{{ f.ayuda }}</p>
                            </div>
                        </div>
                    </dl>
                    <p class="text-sm text-text-secondary">{{ TEXTO_PERFIL_SOLO_LECTURA }}</p>
                </TarjetaPortal>

                <div class="space-y-8">
                    <TarjetaPortal v-for="(a, i) in datos.alumnos" :key="a.id" class="entra-suave space-y-6"
                        :style="{ '--i': i + 1 }">
                        <div class="space-y-4">
                            <FotoEditable :foto="a.foto_url" :nombre="nombreCompleto(a)" :subiendo="estaOcupado(`foto-${a.id}`)"
                                @elegida="cambiarFotoAlumno(a.id, $event)" @error="errorImagen" />
                            <p class="text-xl font-extrabold text-text-primary">{{ nombreCompleto(a) }}</p>
                            <div class="flex flex-wrap gap-2">
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                                    <UserRound class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    {{ TEXTO_PERFIL_ALUMNO }}
                                </span>
                                <span class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-panel-2 px-3 py-1 text-xs font-medium text-text-secondary">
                                    <GraduationCap class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                    <span class="truncate">{{ a.escuela?.nombre ?? TEXTO_FAMILIA_SIN_ESCUELA }}</span>
                                </span>
                            </div>
                            <p v-if="errores[`foto-${a.id}`]" role="alert" class="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
                                {{ errores[`foto-${a.id}`] }}
                            </p>
                        </div>
                        <DireccionAlumno :uid="a.id" :direccion="a.direccion" :guardando="estaOcupado(`direccion-${a.id}`)"
                            :subiendo-foto="estaOcupado(`domicilio-${a.id}`)"
                            :error="errores[`direccion-${a.id}`] ?? errores[`domicilio-${a.id}`] ?? ''"
                            @guardar="cambiarDireccion(a.id, $event)" @foto-elegida="cambiarFotoDomicilio(a.id, $event)"
                            @error-foto="errorImagen" />
                    </TarjetaPortal>
                </div>
            </div>
        </SeccionPortal>
    </ContenedorPortal>
</template>
