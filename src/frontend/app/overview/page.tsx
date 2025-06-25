import DataTable from '@/components/dashboard/data-table'
import GraphGrids from '@/components/dashboard/graph-grids'

export default function overviewPage() {
  return (
    <div className="space-y-6 py-2 w-full">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl">🏠 Übersicht</h1>
      </div>

      {/* Graph Grids Section */}
      <GraphGrids />

      {/* Data Table Section */}
      <DataTable />
    </div>
  )
}
