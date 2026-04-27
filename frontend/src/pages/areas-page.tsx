import { CatalogManagementPage } from '@/pages/catalog-management-page'

export function AreasPage() {
  return (
    <CatalogManagementPage
      title="Áreas"
      description="Administra las áreas organizacionales disponibles para la asignación de cargos."
      endpoint="/areas"
      itemLabel="Área"
    />
  )
}
