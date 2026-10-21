import React from "react";
import OrderListTable, { type ColumnDef } from "../../components/MasterListTable/OrderListTable";

interface EnquiryItem {
  id: number;
  customer_name: string;
  item_name: string;
  quantity: number;
  enquiry_date: string;
  status: string;
}

const columns: ColumnDef<EnquiryItem>[] = [
  { header: "Customer Name", accessorKey: "customer_name" },
  { header: "Item Name", accessorKey: "item_name" },
  { header: "Quantity", accessorKey: "quantity" },
  { 
    header: "Enquiry Date", 
    cell: (row) => new Date(row.enquiry_date).toLocaleDateString()
  },
  { header: "Status", accessorKey: "status" }
];

const EnquiryList: React.FC = () => {
  return (
    <OrderListTable<EnquiryItem>
      title="Enquiry"
      endpoint="enquiry"
      createPath="/order-enquiry/create"
      editPathPrefix="/order-enquiry/edit"
      columns={columns}
      entityName="Enquiry"
    />
  );
};

export default EnquiryList;
