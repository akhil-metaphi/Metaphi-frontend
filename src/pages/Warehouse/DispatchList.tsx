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
  { 
    header: "Type", 
    accessorKey: "dispatch_type", 
    sortable: true, 
    filterable: true,
    cell: (row) => (
      <span className="status-pill status-order">{row.dispatch_type || "Order"}</span>
    )
  },
  { header: "Quantity", accessorKey: "quantity", sortable: true },
  { 
    header: "Status", 
    accessorKey: "status", 
    sortable: true, 
    filterable: true,
    cell: (row) => {
      const s = (row.status || "").toLowerCase();
      let pillClass = "status-pill status-pending";
      if (s === "dispatched" || s === "completed") pillClass = "status-pill status-dispatched";
      else if (s === "cancelled") pillClass = "status-pill status-cancelled";
      return <span className={pillClass}>{row.status || "Pending"}</span>;
    }
  },
  { 
    header: "Dispatch Date", 
    accessorKey: "dispatch_date",
    sortable: true,
    cell: (row) => row.dispatch_date ? new Date(row.dispatch_date).toLocaleDateString() : "-"
  }
];

const DispatchList: React.FC = () => {
  return (
    <WarehouseListTable<DispatchItem>
      title="Dispatch"
      endpoint="dispatch"
      createPath="/warehouse-dispatch/create"
      editPathPrefix="/warehouse-dispatch/edit"
      columns={columns}
      entityName="Dispatch"
      createButtonText="+ Create Dispatch"
      emptyStateTitle="No dispatches found"
      emptyStateSubtitle="There are currently no dispatches registered in the system."
    />
  );
};

export default DispatchList;
