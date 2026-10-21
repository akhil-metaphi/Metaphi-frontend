import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface Item {
  id: number;
  item_name: string;
  alternate_name?: string;
  item_code: string;
  category_name: string;
  sub_category_name: string;
  color?: string;
  unit_name: string;
  hsn_code: string;
  gst_name: string;
  price?: number;
  status: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const ItemList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → Item Name → Alternate Name → Item Code → Category → Sub Category → Color → Unit → HSN Code → GST% → Selling Price → Status → Remarks → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<Item>[] = [
    { header: "Item Name", accessorKey: "item_name", sortable: true, filterable: true },
    { header: "Alternate Name", accessorKey: "alternate_name", sortable: true, filterable: true, cell: (row) => row.alternate_name || "-" },
    { header: "Item Code", accessorKey: "item_code", sortable: true, filterable: true },
    { header: "Category", accessorKey: "category_name", sortable: true, filterable: true },
    { header: "Sub Category", accessorKey: "sub_category_name", sortable: true, filterable: true },
    { header: "Color", accessorKey: "color", sortable: true, filterable: true, cell: (row) => row.color || "-" },
    { header: "Unit", accessorKey: "unit_name", sortable: true, filterable: true },
    { header: "HSN Code", accessorKey: "hsn_code", sortable: true, filterable: true },
    { header: "GST%", accessorKey: "gst_name", sortable: true, filterable: true },
    { header: "Selling Price", accessorKey: "price", sortable: true, filterable: true, cell: (row) => row.price != null ? row.price : "-" },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    { header: "Remarks", accessorKey: "remarks", sortable: false, filterable: false, cell: (row) => row.remarks || "-" },
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
    <MasterListTable<Item>
      title="Item"
      endpoint="items"
      createPath="/add-item"
      editPathPrefix="/edit-item"
      detailsPathPrefix="/item-details"
      columns={columns}
      entityName="Item"
    />
  );
};

export default ItemList;
