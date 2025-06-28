import DataTable from '@/components/dashboard/data-table'
import GraphGrids from '@/components/dashboard/graph-grids'

export default function overviewPage() {
  return (
    <div className="space-y-2 w-full">

      {/* Graph Grids Section */}
      <GraphGrids />

      {/* Data Table Section */}
      <DataTable />
    </div>
  )
}
