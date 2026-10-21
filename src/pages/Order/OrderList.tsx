import React from "react";
import OrderListTable, { type ColumnDef } from "../../components/MasterListTable/OrderListTable";

interface OrderItem {
  id: number;
  customer_name: string;
  total_amount: number;
  order_date: string;
  status: string;
  payment_status: string;
}

const columns: ColumnDef<OrderItem>[] = [
  { header: "Customer Name", accessorKey: "customer_name" },
  { header: "Total Amount", accessorKey: "total_amount" },
  { 
    header: "Order Date", 
    cell: (row) => new Date(row.order_date).toLocaleDateString()
  },
  { header: "Status", accessorKey: "status" },
  { header: "Payment Status", accessorKey: "payment_status" }
];

const OrderList: React.FC = () => {
  return (
    <OrderListTable<OrderItem>
      title="Order"
      endpoint="order"
      createPath="/order-list/create"
      editPathPrefix="/order-list/edit"
      columns={columns}
      entityName="Order"
    />
  );
};

export default OrderList;
