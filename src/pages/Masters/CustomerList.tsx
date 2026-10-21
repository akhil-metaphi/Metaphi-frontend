import React from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";

interface Customer {
  id: number;
  customer_name: string;
  company_name: string;
  customer_type: string;
  email: string;
  mobile_number: string;
  aadhaar_no: string;
  gstin: string;
  status: string;
  contact_person: string;
  contact_person_mobile: string;
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

const CustomerList: React.FC = () => {

  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  // EXACT column sequence matching Screenshot 1: Sr. No. → Customer Name → Company Name → Customer Type → Email → Contact Number → Aadhar No. → GSTIN → Status → Contact Person Name → Contact Person Mobile No. → Address → State → City → Country → Pincode → Created By/Date → Updated By/Date → Actions
  const columns: ColumnDef<Customer>[] = [
    { header: "Customer Name", accessorKey: "customer_name", sortable: true, filterable: true },
    { header: "Company Name", accessorKey: "company_name", sortable: true, filterable: true, cell: (row) => row.company_name || "-" },
    { header: "Customer Type", accessorKey: "customer_type", sortable: true, filterable: true },
    { header: "Email", accessorKey: "email", sortable: true, filterable: true },
    { header: "Contact Number", accessorKey: "mobile_number", sortable: true, filterable: true },
    { header: "Aadhar No.", accessorKey: "aadhaar_no", sortable: false, filterable: true },
    { header: "GSTIN", accessorKey: "gstin", sortable: true, filterable: true },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    { header: "Contact Person Name", accessorKey: "contact_person", sortable: true, filterable: true },
    { header: "Contact Person Mobile No.", accessorKey: "contact_person_mobile", sortable: true, filterable: true },
    { header: "Address", accessorKey: "address", sortable: false, filterable: true },
    { header: "State", accessorKey: "state", sortable: true, filterable: true },
    { header: "City", accessorKey: "city", sortable: true, filterable: true },
    { header: "Country", accessorKey: "country", sortable: true, filterable: true },
    { header: "Pincode", accessorKey: "pincode", sortable: true, filterable: true },
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
    <MasterListTable<Customer>
      title="Customer"
      endpoint="customers"
      createPath="/add-customer"
      editPathPrefix="/edit-customer"
      detailsPathPrefix="/customer-details"
      columns={columns}
      entityName="Customer"
    />
  );
};

export default CustomerList;
