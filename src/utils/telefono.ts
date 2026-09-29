// Asume código de país +52 (México) cuando el teléfono viene sin él, ya que la app opera solo en Puebla
export function telefonoInternacional(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, '')
  return soloDigitos.length === 10 ? `52${soloDigitos}` : soloDigitos
}
