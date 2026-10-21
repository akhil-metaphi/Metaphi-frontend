import React from "react";
import OrderListTable, { type ColumnDef } from "../../components/MasterListTable/OrderListTable";

interface SiteVisitItem {
  id: number;
  customer_name: string;
  assigned_to: string;
  visit_date: string;
  status: string;
}

const columns: ColumnDef<SiteVisitItem>[] = [
  { header: "Customer Name", accessorKey: "customer_name" },
  { header: "Assigned To", accessorKey: "assigned_to" },
  { 
    header: "Visit Date", 
    cell: (row) => new Date(row.visit_date).toLocaleDateString()
  },
  { header: "Status", accessorKey: "status" }
];

const SiteVisitList: React.FC = () => {
  return (
    <OrderListTable<SiteVisitItem>
      title="Site Visit"
      endpoint="site-visit"
      createPath="/order-site-visit/create"
      editPathPrefix="/order-site-visit/edit"
      columns={columns}
      entityName="Site Visit"
    />
  );
};

export default SiteVisitList;
