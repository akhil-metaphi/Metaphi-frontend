import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface GstRate {
  id: number;
  gst_name: string;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  remarks: string;
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
  return `${num} %`;
};

const GstList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence: Sr. No. → GST % → Status → Remarks → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<GstRate>[] = [
    {
      header: "GST %",
      accessorKey: "rate",
      sortable: true,
      filterable: true,
      cell: (row) => formatGst(row.rate ?? row.gst_name)
    },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    { header: "Remarks", sortable: false, filterable: false, cell: (row) => row.remarks || "-" },
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
    <MasterListTable<GstRate>
      title="GST"
      endpoint="gst"
      createPath="/add-gst"
      editPathPrefix="/edit-gst"
      columns={columns}
      entityName="GST Rate"
    />
  );
};

export default GstList;
