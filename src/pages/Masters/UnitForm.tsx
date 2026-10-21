import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import "../UserManagement/UserForm.css";

const UnitForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [unitName, setUnitName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{ unit_name: string; unit_code: string; unit_symbol: string; status: string }>("units", id)
        .then((res) => {
          setUnitName(res.data.unit_name || "");
          setUnitSymbol(res.data.unit_symbol || res.data.unit_code || "");
          setStatus(res.data.status || "Active");
        })
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!unitName.trim()) errors.unitName = "Unit name is required";
    if (!unitSymbol.trim()) errors.unitSymbol = "Unit symbol is required";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      setLoading(true); setError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        unitName,
        unitCode: unitSymbol,
        unitSymbol,
        status,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("units", id, payload);
        navigate("/unit", { state: { toastMessage: "Unit updated successfully" } });
      } else {
        await createMasterItem("units", payload);
        navigate("/unit", { state: { toastMessage: "Unit created successfully" } });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save unit"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="page-container"><div className="page-card">Loading unit...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/unit")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Unit" : "Add Unit"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Unit &gt; <span>{isEdit ? "Edit Unit" : "Add Unit"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            <div className="form-field">
              <label>Unit Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.unitName ? "input-error" : ""}
                placeholder="Enter Unit Name"
                value={unitName}
                onChange={(e) => {
                  setUnitName(e.target.value);
                  if (fieldErrors.unitName) setFieldErrors((prev) => ({ ...prev, unitName: "" }));
                }}
              />
              {fieldErrors.unitName && <span className="field-error-msg">{fieldErrors.unitName}</span>}
            </div>
            <div className="form-field">
              <label>Unit Symbol <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.unitSymbol ? "input-error" : ""}
                placeholder="Enter Unit Symbol"
                value={unitSymbol}
                onChange={(e) => {
                  setUnitSymbol(e.target.value);
                  if (fieldErrors.unitSymbol) setFieldErrors((prev) => ({ ...prev, unitSymbol: "" }));
                }}
              />
              {fieldErrors.unitSymbol && <span className="field-error-msg">{fieldErrors.unitSymbol}</span>}
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/unit")}>
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

export default UnitForm;
