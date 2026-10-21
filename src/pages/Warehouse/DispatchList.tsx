import React from "react";
import WarehouseListTable, { type ColumnDef } from "../../components/MasterListTable/WarehouseListTable";

interface DispatchItem {
  id: number;
  item_name: string;
  warehouse_name: string;
  dispatch_type: string;
  quantity: number;
  dispatch_date: string;
  status: string;
}

const columns: ColumnDef<DispatchItem>[] = [
  { header: "Item Name", accessorKey: "item_name", sortable: true, filterable: true },
  { header: "Warehouse", accessorKey: "warehouse_name", sortable: true, filterable: true },
  { header: "Type", accessorKey: "dispatch_type", sortable: true, filterable: true },
  { header: "Quantity", accessorKey: "quantity", sortable: true },
  { header: "Status", accessorKey: "status", sortable: true, filterable: true },
  { 
    header: "Dispatch Date", 
    accessorKey: "dispatch_date",
    sortable: true,
    cell: (row) => new Date(row.dispatch_date).toLocaleDateString()
  }
];

const DispatchList: React.FC = () => {
  return (
    <WarehouseListTable<DispatchItem>
      title="Warehouse Dispatch"
      endpoint="dispatch"
      createPath="/warehouse-dispatch/create"
      editPathPrefix="/warehouse-dispatch/edit"
      columns={columns}
      entityName="Dispatch"
    />
  );
};

export default DispatchList;
