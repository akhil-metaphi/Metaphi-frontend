import React, { useEffect, useState } from "react";
import Toast from "../../components/Toast/Toast";
import { fetchInventoryInStock } from "../../services/api";

interface InStockItem {
  id: number;
  item_name: string;
  item_code: string;
  category_name: string;
  sub_category_name?: string;
  unit_name: string;
  total_inward: number;
  total_dispatch: number;
  current_stock: number;
  reorder_level: number;
}

const InStockList: React.FC = () => {
  const [items, setItems] = useState<InStockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"stock" | "warehouse">("stock");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchInventoryInStock();
        setItems(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load in-stock items");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-bar-custom" style={{ display: 'none' }}>
        <h3 className="page-title">Inventory</h3>
      </div>

      <div className="page-card">
        <div className="page-header-bar-custom">
          <h3 className="page-title">Inventory</h3>
          <div className="header-actions">
            <div className="search-box">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search" />
            </div>

            <button className="btn-export">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export
            </button>
          </div>
        </div>

        <div className="tabs" style={{ display: "flex", borderBottom: "1px solid #e9ebec", marginBottom: "20px", gap: "20px" }}>
          <button 
            style={{ padding: "10px 0", cursor: "pointer", border: "none", background: "none", borderBottom: activeTab === "stock" ? "2px solid #3563fe" : "2px solid transparent", color: activeTab === "stock" ? "#3563fe" : "#495057", fontWeight: activeTab === "stock" ? "600" : "500", fontSize: "14px" }}
            onClick={() => setActiveTab("stock")}
          >
            Stock Overview
          </button>
          <button 
            style={{ padding: "10px 0", cursor: "pointer", border: "none", background: "none", borderBottom: activeTab === "warehouse" ? "2px solid #3563fe" : "2px solid transparent", color: activeTab === "warehouse" ? "#3563fe" : "#495057", fontWeight: activeTab === "warehouse" ? "600" : "500", fontSize: "14px" }}
            onClick={() => setActiveTab("warehouse")}
          >
            Warehouse-wise Stock
          </button>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}
        
        <div className="tab-content">
          {activeTab === "stock" && (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Sr No.</th>
                    <th>
                      <span className="sortable-header-label">Item Name <svg className="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg></span>
                      <span className="filter-icon" title="Filter"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
                    </th>
                    <th>
                      <span className="sortable-header-label">Category <svg className="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg></span>
                      <span className="filter-icon" title="Filter"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
                    </th>
                    <th>
                      <span className="sortable-header-label">Sub Category <svg className="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg></span>
                      <span className="filter-icon" title="Filter"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
                    </th>
                    <th>
                      <span className="sortable-header-label">Unit <svg className="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg></span>
                      <span className="filter-icon" title="Filter"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></span>
                    </th>
                    <th>Total Quantity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>No items found.</td></tr>
                  ) : (
                    items.map((row, idx) => (
                      <tr key={row.id}>
                        <td>{idx + 1}</td>
                        <td>{row.item_name}</td>
                        <td>{row.category_name}</td>
                        <td>{row.sub_category_name || "-"}</td>
                        <td>{row.unit_name}</td>
                        <td>{row.current_stock}</td>
                        <td>
                          <div className="action-buttons-cell">
                             <button style={{ padding: "4px 8px", background: "#3563fe", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}>View</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "warehouse" && (
            <div style={{ textAlign: "center", padding: "40px", color: "#878a99" }}>
              Warehouse-wise Stock functionality is under construction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InStockList;
