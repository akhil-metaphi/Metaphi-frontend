import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import WarehouseListTable, { type ColumnDef } from "../../components/MasterListTable/WarehouseListTable";
import WarehouseEmptyState from "./WarehouseEmptyState";
import "./Warehouse.css";
import "../../components/MasterListTable/MasterListTable.css";

interface ItemInward {
  id: number;
  item_name: string;
  warehouse_name: string;
  supplier_name: string;
  quantity: number;
  inward_date: string;
}

type InwardTabKey = "pendingStockTransfer" | "pendingLabourInward" | "pendingSalesReturn" | "grn";

const grnColumns: ColumnDef<ItemInward>[] = [
  { header: "Item Name", accessorKey: "item_name", sortable: true, filterable: true },
  { header: "Warehouse", accessorKey: "warehouse_name", sortable: true, filterable: true },
  { header: "Supplier", accessorKey: "supplier_name", sortable: true, filterable: true },
  { header: "Quantity", accessorKey: "quantity", sortable: true },
  { 
    header: "Inward Date", 
    accessorKey: "inward_date",
    sortable: true,
    cell: (row) => row.inward_date ? new Date(row.inward_date).toLocaleDateString() : "-"
  }
];

const TABS: { key: InwardTabKey; label: string }[] = [
  { key: "pendingStockTransfer", label: "Pending Stock Transfer" },
  { key: "pendingLabourInward", label: "Pending Labour Inward" },
  { key: "pendingSalesReturn", label: "Pending Sales Order Return" },
  { key: "grn", label: "GRN" }
];

const ItemInwardList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as InwardTabKey | null;
  const [activeTab, setActiveTab] = useState<InwardTabKey>(
    tabParam && TABS.some(t => t.key === tabParam) ? tabParam : "pendingStockTransfer"
  );

  const [dummySearch, setDummySearch] = useState("");

  const handleTabChange = (key: InwardTabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  // If GRN tab is active, use the real WarehouseListTable which handles live data, sorting, pagination, and deletion
  if (activeTab === "grn") {
    return (
      <WarehouseListTable<ItemInward>
        title="Item Inward"
        endpoint="inward"
        createPath="/warehouse-item-inward/create"
        editPathPrefix="/warehouse-item-inward/edit"
        columns={grnColumns}
        entityName="Inward"
        createButtonText="+ Create Inward"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => handleTabChange(key as InwardTabKey)}
        emptyStateTitle="No GRN Records Found"
        emptyStateSubtitle="There are currently no completed goods received notes."
      />
    );
  }

  // Shell UI for Pending tabs as required by the reference specification
  const renderPendingTable = () => {
    switch (activeTab) {
      case "pendingStockTransfer":
        return {
          headers: ["Sr. No.", "Transfer ID", "Source Warehouse", "Destination Warehouse", "Item Name", "Quantity", "Date", "Status", "Action"],
          emptyTitle: "No pending stock transfers",
          emptySubtitle: "There are currently no pending stock transfer inwards to receive."
        };
      case "pendingLabourInward":
        return {
          headers: ["Sr. No.", "Job Order No.", "Labour / Vendor", "Warehouse", "Item Name", "Quantity", "Date", "Status", "Action"],
          emptyTitle: "No pending labour inwards",
          emptySubtitle: "There are currently no pending labour inwards to receive."
        };
      case "pendingSalesReturn":
        return {
          headers: ["Sr. No.", "Return No.", "Customer Name", "Warehouse", "Item Name", "Quantity", "Return Date", "Status", "Action"],
          emptyTitle: "No pending sales order returns",
          emptySubtitle: "There are currently no pending sales order returns to receive."
        };
      default:
        return {
          headers: ["Sr. No.", "Item Name", "Warehouse", "Quantity", "Date", "Status", "Action"],
          emptyTitle: "No pending records",
          emptySubtitle: "There are currently no pending records for this section."
        };
    }
  };

  const currentPending = renderPendingTable();

  return (
    <div className="page-container">
      <div className="page-card">
        {/* Header Bar */}
        <div className="page-header-bar-custom">
          <div>
            <h3 className="page-title">Item Inward</h3>
            <div className="breadcrumb" style={{ fontSize: "12px", color: "#878a99", marginTop: "4px" }}>
              Warehouse &gt; <span style={{ color: "#495057", fontWeight: 500 }}>Item Inward</span>
            </div>
          </div>

          <div className="header-actions">
            {/* Search Box */}
            <div className="search-box">
              <svg
                className="search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search"
                value={dummySearch}
                onChange={(e) => setDummySearch(e.target.value)}
              />
              {dummySearch && (
                <span
                  className="search-clear-btn"
                  onClick={() => setDummySearch("")}
                  title="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
              )}
            </div>

            {/* Export Button */}
            <button className="btn-export" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>

            {/* Create Button */}
            <Link to="/warehouse-item-inward/create" className="btn-create">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Create Inward
            </Link>
          </div>
        </div>

        {/* 4 Reference Tabs */}
        <div className="warehouse-tabs-container">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`warehouse-tab ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Table Shell with Authentic Empty State */}
        <div className="table-responsive">
          <table className="custom-user-table">
            <thead>
              <tr>
                {currentPending.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={currentPending.headers.length} style={{ padding: 0 }}>
                  <WarehouseEmptyState
                    title={currentPending.emptyTitle}
                    subtitle={currentPending.emptySubtitle}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Standard Pagination Footer Shell */}
        <div className="table-pagination-custom">
          <div>Showing 0 - 0 of 0 Results</div>

          <div className="pagination-right-controls">
            <div className="pagination-controls">
              <button className="page-btn" disabled>&lt;</button>
              <button className="page-btn active">1</button>
              <button className="page-btn" disabled>&gt;</button>
            </div>

            <div className="show-records-bottom">
              <span>Show</span>
              <select value={10} disabled style={{ opacity: 0.7 }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemInwardList;
