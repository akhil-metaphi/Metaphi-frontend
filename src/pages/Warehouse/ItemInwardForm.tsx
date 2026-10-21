import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMasterList, createWarehouseItem, updateWarehouseItem, fetchWarehouseList } from "../../services/api";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import Toast from "../../components/Toast/Toast";
import "./Warehouse.css";
import "../UserManagement/UserForm.css";

const ItemInwardForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    item_id: "",
    warehouse_id: "",
    supplier_id: "",
    quantity: 0,
    unit_price: 0,
    inward_date: new Date().toISOString().split("T")[0],
    batch_number: "",
    remarks: ""
  });

  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [itemsRes, whRes, supRes] = await Promise.all([
          fetchMasterList("items", { limit: 100 }),
          fetchMasterList("warehouses", { limit: 100 }),
          fetchMasterList("suppliers", { limit: 100 })
        ]);
        setItems(itemsRes.data.items);
        setWarehouses(whRes.data.items);
        setSuppliers(supRes.data.items);
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
          const res = await fetchWarehouseList<any>("inward", { limit: 100 });
          const item = res.data.items.find((i: any) => String(i.id) === id);
          if (item) {
            setFormData({
              item_id: item.item_id ? String(item.item_id) : "",
              warehouse_id: item.warehouse_id ? String(item.warehouse_id) : "",
              supplier_id: item.supplier_id ? String(item.supplier_id) : "",
              quantity: item.quantity || 0,
              unit_price: item.unit_price || 0,
              inward_date: item.inward_date ? new Date(item.inward_date).toISOString().split("T")[0] : "",
              batch_number: item.batch_number || "",
              remarks: item.remarks || ""
            });
          }
        } catch (err) {
          console.error("Failed to load item inward", err);
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
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (!formData.inward_date) {
      setError("Please select an inward date");
      return;
    }

    try {
      setLoading(true);
      setError("");
      if (isEdit) {
        await updateWarehouseItem("inward", id!, formData);
      } else {
        await createWarehouseItem("inward", formData);
      }
      navigate("/warehouse-item-inward");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item inward");
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
              onClick={() => navigate("/warehouse-item-inward")}
              title="Back to Item Inward"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </span>
            <h3 className="page-title">{isEdit ? "Edit Item Inward" : "Add Item Inward"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Warehouse &gt; Item Inward &gt; <span>{isEdit ? "Edit Item Inward" : "Add Item Inward"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <h4 className="form-section-heading">Item Inward Details</h4>
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
              <label>Supplier</label>
              <SelectWithClear
                value={formData.supplier_id}
                placeholder="Select Supplier"
                options={suppliers.map(s => ({ value: String(s.id), label: s.supplier_name }))}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))}
                onClear={() => setFormData(prev => ({ ...prev, supplier_id: "" }))}
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
              <label>Inward Date <span className="required">*</span></label>
              <input
                type="date"
                name="inward_date"
                value={formData.inward_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Batch Number</label>
              <input
                type="text"
                name="batch_number"
                value={formData.batch_number}
                onChange={handleChange}
                placeholder="Enter Batch Number"
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
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/warehouse-item-inward")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update Inward" : "Create Inward"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemInwardForm;
