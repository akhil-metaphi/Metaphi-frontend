import React from "react";
import WarehouseListTable, { type ColumnDef } from "../../components/MasterListTable/WarehouseListTable";

interface ItemInward {
  id: number;
  item_name: string;
  warehouse_name: string;
  supplier_name: string;
  quantity: number;
  inward_date: string;
}

const columns: ColumnDef<ItemInward>[] = [
  { header: "Item Name", accessorKey: "item_name", sortable: true, filterable: true },
  { header: "Warehouse", accessorKey: "warehouse_name", sortable: true, filterable: true },
  { header: "Supplier", accessorKey: "supplier_name", sortable: true, filterable: true },
  { header: "Quantity", accessorKey: "quantity", sortable: true },
  { 
    header: "Inward Date", 
    accessorKey: "inward_date",
    sortable: true,
    cell: (row) => new Date(row.inward_date).toLocaleDateString()
  }
];

const ItemInwardList: React.FC = () => {
  return (
    <WarehouseListTable<ItemInward>
      title="Item Inward"
      endpoint="inward"
      createPath="/warehouse-item-inward/create"
      editPathPrefix="/warehouse-item-inward/edit"
      columns={columns}
      entityName="Item Inward"
    />
  );
};

export default ItemInwardList;
