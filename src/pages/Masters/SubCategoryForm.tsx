import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMasterItem, fetchMasterById, fetchMasterList, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

interface Category { id: number; category_name: string; status?: string; }

const SubCategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMasterList<Category>("categories", { limit: 100 }).then((res) => setCategories(res.data.items));
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{ category_id: number; sub_category_name: string; description: string; status: string; remarks: string }>("sub-categories", id)
        .then((res) => {
          setCategoryId(String(res.data.category_id || ""));
          setSubCategoryName(res.data.sub_category_name || "");
          setDescription(res.data.description || "");
          setRemarks(res.data.remarks || "");
          setStatus(res.data.status || "Active");
        })
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!subCategoryName.trim()) errors.subCategoryName = "Sub category name is required";
    if (!categoryId) {
      errors.categoryId = "Category is required";
    } else {
      const selectedCat = categories.find((c) => String(c.id) === categoryId);
      if (selectedCat && selectedCat.status === "Inactive") {
        errors.categoryId = "Selected category is inactive. Please choose an active category";
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      setLoading(true); setError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = { categoryId: Number(categoryId), subCategoryName, description, remarks, status, createdBy: currentUser?.id, updatedBy: currentUser?.id };
      if (isEdit && id) {
        await updateMasterItem("sub-categories", id, payload);
        navigate("/sub-category", { state: { toastMessage: "Sub-category updated successfully" } });
      } else {
        await createMasterItem("sub-categories", payload);
        navigate("/sub-category", { state: { toastMessage: "Sub-category created successfully" } });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save sub category"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="page-container"><div className="form-card">Loading sub category...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/sub-category")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Sub Category" : "Add Sub Category"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Sub Category &gt; <span>{isEdit ? "Edit Sub Category" : "Add Sub Category"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            <div className="form-field">
              <label>Sub Category Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.subCategoryName ? "input-error" : ""}
                placeholder="Enter Sub Category name"
                value={subCategoryName}
                onChange={(e) => {
                  setSubCategoryName(e.target.value);
                  if (fieldErrors.subCategoryName) setFieldErrors((prev) => ({ ...prev, subCategoryName: "" }));
                }}
              />
              {fieldErrors.subCategoryName && <span className="field-error-msg">{fieldErrors.subCategoryName}</span>}
            </div>
            <div className="form-field">
              <label>Category <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.categoryId ? "input-error" : ""}
                value={categoryId}
                placeholder="Select Categories"
                options={categories
                  .filter((c) => c.status !== "Inactive")
                  .map((c) => ({ value: c.id, label: c.category_name }))}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (fieldErrors.categoryId) setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                }}
                onClear={() => {
                  setCategoryId("");
                  if (fieldErrors.categoryId) setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                }}
              />
              {fieldErrors.categoryId && <span className="field-error-msg">{fieldErrors.categoryId}</span>}
            </div>
            <div className="form-field">
              <label>Remark</label>
              <input
                type="text"
                placeholder="Enter Remark"
                value={remarks || description}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setDescription(e.target.value);
                }}
              />
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/sub-category")}>
              Cancel
            </button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubCategoryForm;
