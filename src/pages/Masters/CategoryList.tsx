import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface Category {
  id: number;
  category_name: string;
  description: string;
  remarks?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const CategoryList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → Category → Status → Remarks → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<Category>[] = [
    { header: "Category", accessorKey: "category_name", sortable: true, filterable: true },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    { header: "Remarks", sortable: false, filterable: false, cell: (row) => row.remarks || row.description || "-" },
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
    <MasterListTable<Category>
      title="Category"
      endpoint="categories"
      createPath="/add-category"
      editPathPrefix="/edit-category"
      columns={columns}
      entityName="Category"
    />
  );
};

export default CategoryList;
