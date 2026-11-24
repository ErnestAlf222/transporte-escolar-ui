import { computed } from 'vue'
import { useConfiguracion } from '@/shared/composables/useConfiguracion'
import { temaLoaderPorId } from '@/shared/constants/temasLoader'

// El tema de temporada que debe llevar un loader. `forzado` undefined = el vigente de la configuración;
// con un id (o '' para el loader normal) se usa ese, para las vistas previas. Un id desconocido da undefined.
export function useTemaLoader(forzado: () => string | null | undefined) {
  const { temaLoader } = useConfiguracion()
  return computed(() => {
    const id = forzado()
    return temaLoaderPorId(id === undefined ? temaLoader.value : id)
  })
}
