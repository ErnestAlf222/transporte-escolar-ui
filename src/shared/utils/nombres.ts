// Dos primeras palabras de un nombre: "Ana Paula Pérez Jiménez" -> "AP"
export function inicialesDeTexto(texto: string): string {
  return texto
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra[0] ?? '')
    .join('')
    .toUpperCase()
}

// Alumno con apellidos opcionales (prospectos y modales de detalle)
interface AlumnoConApellidosOpcionales {
  nombre_alumno: string
  apellido_paterno_alumno?: string | null
  apellido_materno_alumno?: string | null
}

// Alumno cuyos nombres siempre llegan como texto (listado de clientes)
interface AlumnoConApellidos {
  nombre_alumno: string
  apellido_paterno_alumno: string
  apellido_materno_alumno: string
}

// Nombre y apellidos unidos con espacios, saltando los vacíos. Tolera apellidos ausentes (null/undefined).
export function nombreCompleto(a: AlumnoConApellidosOpcionales): string {
  return [a.nombre_alumno, a.apellido_paterno_alumno, a.apellido_materno_alumno]
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

// Igual, pero sin tolerar null/undefined: si un nombre llegara así lanza TypeError, tal como hacían las
// copias originales de Clientes, Familias y Casos especiales. Se deja separada de nombreCompleto a
// propósito: no son equivalentes en ese caso (ver docs/fase1-utilidades.md).
export function nombreCompletoEstricto(a: AlumnoConApellidos): string {
  return [a.nombre_alumno, a.apellido_paterno_alumno, a.apellido_materno_alumno]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')
}

// Iniciales de un alumno: primera letra del nombre (recortado) + primera del apellido paterno
export function inicialesAlumno(
  a: Pick<AlumnoConApellidosOpcionales, 'nombre_alumno' | 'apellido_paterno_alumno'>,
): string {
  return `${a.nombre_alumno.trim()[0] ?? ''}${a.apellido_paterno_alumno?.[0] ?? ''}`.toUpperCase()
}
