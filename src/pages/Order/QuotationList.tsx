import React from "react";
import OrderListTable, { type ColumnDef } from "../../components/MasterListTable/OrderListTable";

interface QuotationItem {
  id: number;
  customer_name: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  quotation_date: string;
  status: string;
}

const columns: ColumnDef<QuotationItem>[] = [
  { header: "Customer Name", accessorKey: "customer_name" },
  { header: "Item Name", accessorKey: "item_name" },
  { header: "Total Amount", accessorKey: "total_amount" },
  {
    header: "Quotation Date",
    cell: (row) => new Date(row.quotation_date).toLocaleDateString()
  },
  { header: "Status", accessorKey: "status" }
];

const QuotationList: React.FC = () => {
  return (
    <OrderListTable<QuotationItem>
      title="Quotation"
      endpoint="quotation"
      createPath="/order-quotation/create"
      editPathPrefix="/order-quotation/edit"
      columns={columns}
      entityName="Quotation"
    />
  );
};

export default QuotationList;
