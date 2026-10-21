import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import "../UserManagement/UserForm.css";

const GstForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [rate, setRate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toastError, setToastError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{ gst_name: string; rate: string; status: string; remarks: string }>("gst", id)
        .then((res) => {
          const fetchedRate = res.data.rate !== undefined && res.data.rate !== null ? String(res.data.rate) : (res.data.gst_name ? res.data.gst_name.replace("%", "") : "");
          setRate(fetchedRate);
          setRemarks(res.data.remarks || "");
          setStatus(res.data.status || "Active");
        })
        .catch((err) => setToastError(err.message))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRate = rate.trim();
    if (!cleanRate) {
      setFieldErrors({ rate: "GST rate is required" });
      return;
    }
    const numRate = Number(cleanRate);
    if (isNaN(numRate) || numRate < 0 || numRate > 100) {
      setFieldErrors({ rate: "Enter valid GST percentage (0 to 100)" });
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true); setToastError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        gstName: `${cleanRate}%`,
        rate: numRate,
        cgst: numRate / 2,
        sgst: numRate / 2,
        igst: numRate,
        remarks,
        status,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("gst", id, payload);
        navigate("/gst", { state: { toastMessage: "GST updated successfully" } });
      } else {
        await createMasterItem("gst", payload);
        navigate("/gst", { state: { toastMessage: "GST created successfully" } });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to save GST rate";
      setToastError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-container"><div className="page-card">Loading GST...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/gst")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit GST" : "Add GST"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            GST &gt; <span>{isEdit ? "Edit GST" : "Add GST"}</span>
          </div>
        </div>

        {toastError && (
          <Toast message={toastError} type="error" duration={3000} onClose={() => setToastError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
            <div className="form-field">
              <label>GST % <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.rate ? "input-error" : ""}
                placeholder="Enter GST %"
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  if (fieldErrors.rate) setFieldErrors((prev) => ({ ...prev, rate: "" }));
                }}
              />
              {fieldErrors.rate && <span className="field-error-msg">{fieldErrors.rate}</span>}
            </div>
            <div className="form-field">
              <label>Remark</label>
              <input
                type="text"
                placeholder="Enter Remark"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/gst")}>
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

export default GstForm;
