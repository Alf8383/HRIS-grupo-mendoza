import { CatalogManagementPage } from '@/pages/catalog-management-page'

export function SitesPage() {
  return (
    <CatalogManagementPage
      title="Sedes"
      description="Gestiona las sedes operativas disponibles para la ubicación del personal."
      endpoint="/sites"
      itemLabel="Sede"
    />
  )
}
