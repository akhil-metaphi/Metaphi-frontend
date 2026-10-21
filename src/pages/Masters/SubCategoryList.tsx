import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface SubCategory {
  id: number;
  category_name: string;
  sub_category_name: string;
  description: string;
  remarks: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const SubCategoryList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → Sub Category → Categories → Remarks → Status → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<SubCategory>[] = [
    { header: "Sub Category", accessorKey: "sub_category_name", sortable: true, filterable: true },
    {
      header: "Categories",
      accessorKey: "category_name",
      sortable: true,
      filterable: true,
      cell: (row) => (
        <span style={{
          display: "inline-block",
          backgroundColor: "#3b82f6",
          color: "#ffffff",
          padding: "4px 12px",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: 500
        }}>
          {row.category_name || "-"}
        </span>
      )
    },
    { header: "Remarks", sortable: false, filterable: false, cell: (row) => row.remarks || row.description || "-" },
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
    <MasterListTable<SubCategory>
      title="Sub Category"
      endpoint="sub-categories"
      createPath="/add-sub-category"
      editPathPrefix="/edit-sub-category"
      columns={columns}
      entityName="Sub Category"
    />
  );
};

export default SubCategoryList;
