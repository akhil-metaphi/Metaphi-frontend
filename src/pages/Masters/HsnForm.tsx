import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMasterItem, fetchMasterById, fetchMasterList, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

interface GstOption {
  id: number;
  rate: number;
  gst_name: string;
  status?: string;
}

const HsnForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [gstRates, setGstRates] = useState<GstOption[]>([]);
  const [gstId, setGstId] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toastError, setToastError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMasterList<GstOption>("gst", { limit: 100 })
      .then((res) => setGstRates(res.data.items))
      .catch(() => {});

    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{ hsn_code: string; description: string; status: string; gst_id?: number }>("hsn", id)
        .then((res) => {
          setHsnCode(res.data.hsn_code || "");
          setDescription(res.data.description || "");
          setGstId(res.data.gst_id ? String(res.data.gst_id) : "");
          setStatus(res.data.status || "Active");
        })
        .catch((err) => setToastError(err.message))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!gstId) {
      errors.gstId = "GST percent is required";
    } else {
      const selectedGst = gstRates.find((g) => String(g.id) === gstId);
      if (selectedGst && selectedGst.status === "Inactive") {
        errors.gstId = "Selected GST rate is inactive. Please select an active GST rate";
      }
    }
    const cleanHsn = hsnCode.trim();
    if (!cleanHsn) {
      errors.hsnCode = "HSN code is required";
    } else if (!/^\d+$/.test(cleanHsn) || ![4, 6, 8].includes(cleanHsn.length)) {
      errors.hsnCode = "Enter valid format for HSN code";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true); setToastError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        hsnCode: cleanHsn,
        description,
        gstId: Number(gstId),
        status,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("hsn", id, payload);
        navigate("/hsn-codes", { state: { toastMessage: "HSN Code updated successfully" } });
      } else {
        await createMasterItem("hsn", payload);
        navigate("/hsn-codes", { state: { toastMessage: "HSN Code created successfully" } });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save HSN Code";
      setToastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-container"><div className="page-card">Loading HSN Code...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/hsn-codes")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit HSN Code" : "Add HSN Code"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            HSN Code &gt; <span>{isEdit ? "Edit HSN Code" : "Add HSN Code"}</span>
          </div>
        </div>

        {toastError && (
          <Toast message={toastError} type="error" duration={3000} onClose={() => setToastError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            <div className="form-field">
              <label>GST% <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.gstId ? "input-error" : ""}
                value={gstId}
                placeholder="Select GST"
                options={gstRates
                  .filter((g) => g.status !== "Inactive")
                  .map((g) => ({
                    value: g.id,
                    label: g.rate != null ? `${parseFloat(String(g.rate))}%` : g.gst_name || `GST ${g.id}`,
                  }))}
                onChange={(e) => {
                  setGstId(e.target.value);
                  if (fieldErrors.gstId) setFieldErrors((prev) => ({ ...prev, gstId: "" }));
                }}
                onClear={() => {
                  setGstId("");
                  if (fieldErrors.gstId) setFieldErrors((prev) => ({ ...prev, gstId: "" }));
                }}
              />
              {fieldErrors.gstId && <span className="field-error-msg">{fieldErrors.gstId}</span>}
            </div>
            <div className="form-field">
              <label>HSN Code <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.hsnCode ? "input-error" : ""}
                placeholder="Enter HSN Code (4, 6 or 8 digits)"
                value={hsnCode}
                onChange={(e) => {
                  setHsnCode(e.target.value);
                  if (fieldErrors.hsnCode) setFieldErrors((prev) => ({ ...prev, hsnCode: "" }));
                }}
              />
              {fieldErrors.hsnCode && <span className="field-error-msg">{fieldErrors.hsnCode}</span>}
            </div>
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label>HSN Code Description</label>
              <input
                type="text"
                placeholder="Enter Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/hsn-codes")}>
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

export default HsnForm;
