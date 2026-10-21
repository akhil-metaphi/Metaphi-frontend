import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMasterList, createWarehouseItem, updateWarehouseItem, fetchWarehouseList } from "../../services/api";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import Toast from "../../components/Toast/Toast";
import "./Warehouse.css";
import "../UserManagement/UserForm.css";

const DispatchForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    item_id: "",
    warehouse_id: "",
    dispatch_type: "Order",
    quantity: 0,
    dispatch_date: new Date().toISOString().split("T")[0],
    status: "Pending",
    remarks: ""
  });

  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [itemsRes, whRes] = await Promise.all([
          fetchMasterList("items", { limit: 100 }),
          fetchMasterList("warehouses", { limit: 100 })
        ]);
        setItems(itemsRes.data.items);
        setWarehouses(whRes.data.items);
      } catch (err) {
        console.error("Failed to load dropdowns", err);
      }
    };
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const loadItem = async () => {
        try {
          const res = await fetchWarehouseList<any>("dispatch", { limit: 100 });
          const item = res.data.items.find((i: any) => String(i.id) === id);
          if (item) {
            setFormData({
              item_id: item.item_id ? String(item.item_id) : "",
              warehouse_id: item.warehouse_id ? String(item.warehouse_id) : "",
              dispatch_type: item.dispatch_type || "Order",
              quantity: item.quantity || 0,
              dispatch_date: item.dispatch_date ? new Date(item.dispatch_date).toISOString().split("T")[0] : "",
              status: item.status || "Pending",
              remarks: item.remarks || ""
            });
          }
        } catch (err) {
          console.error("Failed to load dispatch", err);
        }
      };
      loadItem();
    }
  }, [isEdit, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id) {
      setError("Please select an item");
      return;
    }
    if (!formData.warehouse_id) {
      setError("Please select a warehouse");
      return;
    }
    if (!formData.dispatch_type) {
      setError("Please select a dispatch type");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (!formData.dispatch_date) {
      setError("Please select a dispatch date");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (isEdit) {
        await updateWarehouseItem("dispatch", id!, formData);
      } else {
        await createWarehouseItem("dispatch", formData);
      }
      navigate("/warehouse-dispatch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save dispatch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              className="back-arrow"
              onClick={() => navigate("/warehouse-dispatch")}
              title="Back to Dispatch"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </span>
            <h3 className="page-title">{isEdit ? "Edit Dispatch" : "Create Dispatch"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Warehouse &gt; Dispatch &gt; <span>{isEdit ? "Edit Dispatch" : "Create Dispatch"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <h4 className="form-section-heading">Dispatch Details</h4>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px 20px" }}>
            {/* Row 1 */}
            <div className="form-field">
              <label>Item <span className="required">*</span></label>
              <SelectWithClear
                value={formData.item_id}
                placeholder="Select Item"
                options={items.map(i => ({ value: String(i.id), label: i.item_name }))}
                onChange={(e) => setFormData(prev => ({ ...prev, item_id: e.target.value }))}
                onClear={() => setFormData(prev => ({ ...prev, item_id: "" }))}
              />
            </div>

            <div className="form-field">
              <label>Warehouse <span className="required">*</span></label>
              <SelectWithClear
                value={formData.warehouse_id}
                placeholder="Select Warehouse"
                options={warehouses.map(w => ({ value: String(w.id), label: w.warehouse_name }))}
                onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: e.target.value }))}
                onClear={() => setFormData(prev => ({ ...prev, warehouse_id: "" }))}
              />
            </div>

            <div className="form-field">
              <label>Dispatch Type <span className="required">*</span></label>
              <SelectWithClear
                value={formData.dispatch_type}
                placeholder="Select Dispatch Type"
                options={[
                  { value: "Order", label: "Order" },
                  { value: "Stock Transfer", label: "Stock Transfer" },
                  { value: "Issue to Labour", label: "Issue to Labour" }
                ]}
                onChange={(e) => setFormData(prev => ({ ...prev, dispatch_type: e.target.value }))}
                onClear={() => setFormData(prev => ({ ...prev, dispatch_type: "" }))}
              />
            </div>

            <div className="form-field">
              <label>Quantity <span className="required">*</span></label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity || ""}
                onChange={handleChange}
                required
                min="1"
                placeholder="Enter Quantity"
              />
            </div>

            {/* Row 2 */}
            <div className="form-field">
              <label>Dispatch Date <span className="required">*</span></label>
              <input
                type="date"
                name="dispatch_date"
                value={formData.dispatch_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Status <span className="required">*</span></label>
              <SelectWithClear
                value={formData.status}
                placeholder="Select Status"
                options={[
                  { value: "Pending", label: "Pending" },
                  { value: "Completed", label: "Completed" },
                  { value: "Cancelled", label: "Cancelled" }
                ]}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                onClear={() => setFormData(prev => ({ ...prev, status: "" }))}
              />
            </div>

            <div className="form-field">
              <label>Remarks</label>
              <input
                type="text"
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Enter Remarks"
              />
            </div>

            <div>{/* Row 2 Col 4 empty */}</div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", borderTop: "none", paddingTop: 0 }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/warehouse-dispatch")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update Dispatch" : "Create Dispatch"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchForm;
