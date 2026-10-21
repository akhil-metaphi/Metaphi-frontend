import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface Warehouse {
  id: number;
  warehouse_name: string;
  warehouse_type: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  remarks: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const WarehouseList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → Warehouse Name → Warehouse Type → Address → City → State → Country → Pincode → Remarks → Status → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<Warehouse>[] = [
    { header: "Warehouse Name", accessorKey: "warehouse_name", sortable: true, filterable: true },
    { header: "Warehouse Type", accessorKey: "warehouse_type", sortable: true, filterable: true },
    { header: "Address", accessorKey: "address", sortable: false, filterable: true },
    { header: "City", accessorKey: "city", sortable: true, filterable: true },
    { header: "State", accessorKey: "state", sortable: true, filterable: true },
    { header: "Country", accessorKey: "country", sortable: true, filterable: true },
    { header: "Pincode", accessorKey: "pincode", sortable: true, filterable: true },
    { header: "Remarks", accessorKey: "remarks", sortable: false, filterable: false },
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
    <MasterListTable<Warehouse>
      title="Warehouse"
      endpoint="warehouses"
      createPath="/add-warehouse"
      editPathPrefix="/edit-warehouse"
      configurePathPrefix="/configure-warehouse"
      columns={columns}
      entityName="Warehouse"
    />
  );
};

export default WarehouseList;
