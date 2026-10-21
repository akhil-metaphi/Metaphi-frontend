import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMasterById } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import "../UserManagement/UserForm.css";

interface ItemData {
  id: number;
  item_name: string;
  alternate_name?: string;
  item_code: string;
  color?: string;
  category_name?: string;
  sub_category_name?: string;
  unit_name?: string;
  hsn_code?: string;
  gst_name?: string;
  price?: number;
  status?: string;
  remarks?: string;
}

const ItemDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchMasterById<ItemData>("items", id)
        .then((res) => setItem(res.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="page-container"><div className="page-card">Loading Item Details...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/item")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">Item</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Item &gt; <span>Item Details</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <div className="item-details-body" style={{ padding: "0 8px" }}>
          <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "24px", color: "#111827" }}>Item Details</h4>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "20px", columnGap: "40px", fontSize: "14px" }}>
            <div>
              <strong>Item Name : </strong> {item?.item_name || "-"}
            </div>
            <div>
              <strong>Alternate Name : </strong> {item?.alternate_name || "-"}
            </div>

            <div>
              <strong>Item Code : </strong> {item?.item_code || "-"}
            </div>
            <div>
              <strong>Color : </strong> {item?.color || "-"}
            </div>

            <div>
              <strong>Category : </strong> {item?.category_name || "-"}
            </div>
            <div>
              <strong>Sub Category : </strong> {item?.sub_category_name || "-"}
            </div>

            <div>
              <strong>Unit : </strong> {item?.unit_name || "-"}
            </div>
            <div>
              <strong>HSN Code : </strong> {item?.hsn_code || "-"}
            </div>

            <div>
              <strong>GST Percentage : </strong> {item?.gst_name ? `${item.gst_name}${String(item.gst_name).includes("%") ? "" : "%"}` : "-"}
            </div>
            <div>
              <strong>Selling Price : </strong> ₹{item?.price != null ? item.price : "0"}
            </div>

            <div>
              <strong>Status : </strong>
              <span
                style={{
                  backgroundColor: item?.status === "Inactive" ? "#ef4444" : "#22c55e",
                  color: "#ffffff",
                  padding: "3px 10px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginLeft: "4px",
                  display: "inline-block"
                }}
              >
                {item?.status || "Active"}
              </span>
            </div>
            <div></div>

            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Remarks : </strong> {item?.remarks || "-"}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
            <button
              type="button"
              className="btn-wizard-cancel"
              onClick={() => navigate("/item")}
              style={{ padding: "8px 24px" }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
