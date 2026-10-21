import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface HsnCode {
  id: number;
  hsn_code: string;
  description: string;
  gst_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const formatGst = (val: any) => {
  if (val === null || val === undefined || val === "") return "-";
  const num = parseFloat(String(val).replace("%", ""));
  if (isNaN(num)) return String(val);
  return `${num}%`;
};

const HsnList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → HSN Code → HSN Code Description → GST% → Status → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<HsnCode>[] = [
    { header: "HSN Code", accessorKey: "hsn_code", sortable: true, filterable: true },
    { header: "HSN Code Description", accessorKey: "description", sortable: false, filterable: false },
    {
      header: "GST%",
      accessorKey: "gst_name",
      sortable: true,
      filterable: true,
      cell: (row) => formatGst(row.gst_name)
    },
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
    <MasterListTable<HsnCode>
      title="HSN Code"
      endpoint="hsn"
      createPath="/add-hsn-code"
      editPathPrefix="/edit-hsn-code"
      columns={columns}
      entityName="HSN Code"
    />
  );
};

export default HsnList;
