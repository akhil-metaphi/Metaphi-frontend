import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import "../UserManagement/UserForm.css";

const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{ category_name: string; description: string; remarks?: string; status: string }>("categories", id)
        .then((res) => {
          setCategoryName(res.data.category_name || "");
          setDescription(res.data.remarks || res.data.description || "");
          setStatus(res.data.status || "Active");
        })
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setFieldErrors({ categoryName: "Category name is required" });
      return;
    }
    setFieldErrors({});
    try {
      setLoading(true); setError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = { categoryName, description, remarks: description, status, createdBy: currentUser?.id, updatedBy: currentUser?.id };
      if (isEdit && id) {
        await updateMasterItem("categories", id, payload);
        navigate("/category", { state: { toastMessage: "Category updated successfully" } });
      } else {
        await createMasterItem("categories", payload);
        navigate("/category", { state: { toastMessage: "Category created successfully" } });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save category"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="page-card">Loading category...</div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/category")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Category" : "Add Category"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Category &gt; <span>{isEdit ? "Edit Category" : "Add Category"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            <div className="form-field">
              <label>Category Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.categoryName ? "input-error" : ""}
                placeholder="Enter Category Name"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (fieldErrors.categoryName) setFieldErrors((prev) => ({ ...prev, categoryName: "" }));
                }}
              />
              {fieldErrors.categoryName && <span className="field-error-msg">{fieldErrors.categoryName}</span>}
            </div>
            <div className="form-field">
              <label>Remark</label>
              <input type="text" placeholder="Enter Remark" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/category")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryForm;
