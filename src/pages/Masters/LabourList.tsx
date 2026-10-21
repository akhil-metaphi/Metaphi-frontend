import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface Labour {
  id: number;
  labour_name: string;
  mobile_number: string;
  status: string;
  remarks: string;
  address: string;
  state: string;
  city: string;
  country: string;
  pincode: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const LabourList: React.FC = () => {
  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence matching Screenshot 1: Sr. No. → Labour Name → Contact Number → Status → Remarks → Address → State → City → Country → Created By/Date → Updated By/Date → Action
  const columns: ColumnDef<Labour>[] = [
    { header: "Labour Name", accessorKey: "labour_name", sortable: true, filterable: true },
    { header: "Contact Number", accessorKey: "mobile_number", sortable: true, filterable: false },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    { header: "Remarks", accessorKey: "remarks", sortable: false, filterable: false, cell: (row) => row.remarks || "-" },
    { header: "Address", accessorKey: "address", sortable: false, filterable: true },
    { header: "State", accessorKey: "state", sortable: true, filterable: true },
    { header: "City", accessorKey: "city", sortable: true, filterable: true },
    { header: "Country", accessorKey: "country", sortable: true, filterable: true, cell: (row) => row.country || "India" },
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
    <MasterListTable<Labour>
      title="Labour"
      endpoint="labours"
      createPath="/add-labour"
      editPathPrefix="/edit-labour"
      columns={columns}
      entityName="Labour"
    />
  );
};

export default LabourList;
