import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface Unit {
  id: number;
  unit_name: string;
  unit_code: string;
  unit_symbol: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const UnitList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → Unit Name → Unit Symbol → Status → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<Unit>[] = [
    { header: "Unit Name", accessorKey: "unit_name", sortable: true, filterable: true },
    { header: "Unit Symbol", accessorKey: "unit_symbol", sortable: true, filterable: true },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    {
      header: "Created By/Date", sortable: true, filterable: true,
      cell: (row) => formatAuditData(row.created_by, row.created_at, currentUser)
    },
    {
      header: "Updated By/Date", sortable: true, filterable: true,
      cell: (row) => formatAuditData(row.updated_by, row.updated_at, currentUser)
    },
  ];

  return (
    <MasterListTable<Unit>
      title="Unit"
      endpoint="units"
      createPath="/add-unit"
      editPathPrefix="/edit-unit"
      columns={columns}
      entityName="Unit"
    />
  );
};

export default UnitList;
