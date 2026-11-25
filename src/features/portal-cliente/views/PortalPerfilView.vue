<script setup lang="ts">
import { computed } from 'vue'
import { usePerfil } from '@/features/portal-cliente/composables/usePerfil'
import SeccionPortal from '@/features/portal-cliente/components/SeccionPortal.vue'
import NavegacionPortal from '@/features/portal-cliente/components/NavegacionPortal.vue'
import FotoEditable from '@/features/portal-cliente/components/FotoEditable.vue'
import DireccionAlumno from '@/features/portal-cliente/components/DireccionAlumno.vue'
import {
    TEXTO_PERFIL_TITULO,
    TEXTO_PERFIL_SOLO_LECTURA,
    ETIQUETA_NOMBRE,
    ETIQUETA_TELEFONO_PERFIL,
    ETIQUETA_CORREO,
} from '@/features/portal-cliente/constants/perfil'
import { nombreCompleto } from '@/shared/utils/nombres'

const { perfil, errores, estaOcupado, errorImagen, cambiarFotoTutor, cambiarFotoAlumno, cambiarFotoDomicilio, cambiarDireccion } =
    usePerfil()

const datos = computed(() => perfil.datos.value)
const esTutor = computed(() => datos.value?.tipo === 'tutor')
</script>

<template>
    <div class="mx-auto min-h-screen w-full max-w-md space-y-6 p-4 pb-10">
        <NavegacionPortal />

        <SeccionPortal :titulo="TEXTO_PERFIL_TITULO" :estado="perfil.estado.value" @reintentar="perfil.cargar">
            <div v-if="datos" class="space-y-6">
                <div class="glass-plano entra-suave space-y-4 rounded-card p-4">
                    <FotoEditable v-if="esTutor" :foto="datos.foto_url" :nombre="datos.nombre" :subiendo="estaOcupado('tutor')"
                        @elegida="cambiarFotoTutor" @error="errorImagen" />
                    <p v-if="errores.tutor" role="alert" class="text-sm text-danger">{{ errores.tutor }}</p>
                    <dl class="space-y-2 text-sm">
                        <div>
                            <dt class="text-xs text-text-secondary">{{ ETIQUETA_NOMBRE }}</dt>
                            <dd class="text-text-primary">{{ datos.nombre }}</dd>
                        </div>
                        <div>
                            <dt class="text-xs text-text-secondary">{{ ETIQUETA_TELEFONO_PERFIL }}</dt>
                            <dd class="text-text-primary">{{ datos.telefono }}</dd>
                        </div>
                        <div v-if="datos.correo">
                            <dt class="text-xs text-text-secondary">{{ ETIQUETA_CORREO }}</dt>
                            <dd class="break-all text-text-primary">{{ datos.correo }}</dd>
                        </div>
                    </dl>
                    <p class="text-xs text-text-muted">{{ TEXTO_PERFIL_SOLO_LECTURA }}</p>
                </div>

                <div v-for="(a, i) in datos.alumnos" :key="a.id" class="glass-plano entra-suave space-y-4 rounded-card p-4"
                    :style="{ '--i': i + 1 }">
                    <FotoEditable :foto="a.foto_url" :nombre="nombreCompleto(a)" :subiendo="estaOcupado(`foto-${a.id}`)"
                        @elegida="cambiarFotoAlumno(a.id, $event)" @error="errorImagen" />
                    <p class="font-medium text-text-primary">{{ nombreCompleto(a) }}</p>
                    <p v-if="errores[`foto-${a.id}`]" role="alert" class="text-sm text-danger">{{ errores[`foto-${a.id}`] }}</p>
                    <DireccionAlumno :uid="a.id" :direccion="a.direccion" :guardando="estaOcupado(`direccion-${a.id}`)"
                        :subiendo-foto="estaOcupado(`domicilio-${a.id}`)"
                        :error="errores[`direccion-${a.id}`] ?? errores[`domicilio-${a.id}`] ?? ''"
                        @guardar="cambiarDireccion(a.id, $event)" @foto-elegida="cambiarFotoDomicilio(a.id, $event)"
                        @error-foto="errorImagen" />
                </div>
            </div>
        </SeccionPortal>
    </div>
</template>
