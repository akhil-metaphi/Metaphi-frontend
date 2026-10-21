import React, { useEffect, useState } from "react";
import { fetchInventoryReorderLevel } from "../../services/api";
import "../../components/MasterListTable/MasterListTable.css";

interface ReorderItem {
  id: number;
  item_name: string;
  item_code: string;
  category_name: string;
  total_inward: number;
  total_dispatch: number;
  current_stock: number;
  reorder_level: number;
}

const ReorderLevelList: React.FC = () => {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetchInventoryReorderLevel();
        setItems(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reorder level items");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-bar-custom">
        <h3 className="page-title">Reorder Level Alerts</h3>
      </div>

      <div className="page-card">
        {error && <div style={{ color: "#dc3545", padding: "10px 0" }}>{error}</div>}

        <div style={{ width: "100%", overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "green" }}>All stock levels are optimal. No reorder needed.</td></tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{idx + 1}</td>
                    <td>{row.item_name} {row.item_code ? `(${row.item_code})` : ""}</td>
                    <td>{row.category_name}</td>
                    <td style={{ color: "red", fontWeight: "bold" }}>{row.current_stock}</td>
                    <td>{row.reorder_level}</td>
                    <td>
                      <span style={{ background: "#dc3545", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReorderLevelList;
