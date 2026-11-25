import { CircleAlert, CircleCheck, CircleDashed, CircleX, Clock, Minus } from 'lucide-vue-next'
import type { Component } from 'vue'

// Los estados del ciclo de pago de una semana (ciclo.estado del servidor). Un solo mapa para todo el sistema:
// etiqueta, color e icono. Los tokens de color son los de main.css.
export type EstadoCiclo = 'sin_reportar' | 'por_verificar' | 'pagada' | 'parcial' | 'rechazada' | 'sin_cobro'

export interface VistaEstadoCiclo {
  texto: string
  clases: string // chip: fondo suave + texto
  seleccionado: string // contador activo: borde y fondo suaves
  barra: string // tramo de la barra de avance
  significado: string // qué quiere decir el estado de un pago y qué sigue (frase para el administrador)
  leyenda: string // línea corta para la leyenda de estados
  icono: Component
}

export const ESTADO_CICLO: Record<EstadoCiclo, VistaEstadoCiclo> = {
  por_verificar: {
    texto: 'Por verificar',
    clases: 'bg-sun/15 text-sun',
    seleccionado: 'border border-sun/40 bg-sun/10',
    barra: 'bg-sun',
    significado: 'El cliente ya reportó su pago con comprobante. Falta que lo revises.',
    leyenda: 'Reportó su pago y espera tu revisión.',
    icono: Clock,
  },
  sin_reportar: {
    texto: 'Sin reportar',
    clases: 'bg-panel-2 text-text-secondary',
    seleccionado: 'border border-text-secondary/40 bg-text-secondary/10',
    barra: 'bg-text-muted',
    significado: 'El cliente todavía no reporta su pago de esta semana. Puedes registrar lo que recibas en persona.',
    leyenda: 'No ha reportado ni pagado.',
    icono: CircleAlert,
  },
  parcial: {
    texto: 'Pago parcial',
    clases: 'bg-servicio/15 text-servicio',
    seleccionado: 'border border-servicio/40 bg-servicio/10',
    barra: 'bg-servicio',
    significado: 'Ya se recibió una parte de la semana. Falta cubrir el resto.',
    leyenda: 'Se recibió una parte, falta el resto.',
    icono: CircleDashed,
  },
  sin_cobro: {
    texto: 'Sin cobro todavía',
    clases: 'bg-panel-2 text-text-muted',
    seleccionado: 'border border-text-secondary/40 bg-text-secondary/10',
    barra: 'bg-text-muted',
    significado: 'Todavía no hay cuota que cobrar esta semana.',
    leyenda: 'Su cuota empieza en una semana posterior.',
    icono: Minus,
  },
  rechazada: {
    texto: 'Rechazado',
    clases: 'bg-danger/15 text-danger',
    seleccionado: 'border border-danger/40 bg-danger/10',
    barra: 'bg-danger',
    significado: 'El reporte se rechazó. El cliente puede volver a reportar su pago.',
    leyenda: 'El reporte no se aceptó; puede reportar de nuevo.',
    icono: CircleX,
  },
  pagada: {
    texto: 'Pagado',
    clases: 'bg-mint/15 text-mint',
    seleccionado: 'border border-mint/40 bg-mint/10',
    barra: 'bg-mint',
    significado: 'La semana está cubierta. No hay nada más que hacer.',
    leyenda: 'Cubierta por completo.',
    icono: CircleCheck,
  },
}

// Orden en que se listan los estados (contadores y barra de avance)
export const ORDEN_ESTADOS_CICLO: EstadoCiclo[] = ['por_verificar', 'sin_reportar', 'parcial', 'rechazada', 'pagada']

// Un archivado sin pago por verificar no es deuda de la semana: se marca aparte
export const VISTA_ARCHIVADO = { texto: 'Archivado', clases: 'bg-panel-2 text-text-secondary' }

// Estados en los que se espera recibir dinero (abono) de la familia
export const ESTADOS_QUE_PIDEN_ABONO: EstadoCiclo[] = ['sin_reportar', 'parcial', 'rechazada']
