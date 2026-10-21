import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

const LabourForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [labourName, setLabourName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [panNo, setPanNo] = useState("");
  const [panDoc, setPanDoc] = useState("");
  const [aadharNo, setAadharNo] = useState("");
  const [aadharDoc, setAadharDoc] = useState("");
  const [address, setAddress] = useState("");

  const [country, setCountry] = useState("India");
  const [countryCode, setCountryCode] = useState("IN");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");

  const [pincode, setPincode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("Active");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Cascading location data using country-state-city
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const availableStates = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const availableCities = useMemo(() => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []), [countryCode, stateCode]);

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{
        labour_name: string; mobile_number: string; pan_no: string; pan_doc: string;
        aadhar_no: string; aadhar_doc: string; address: string; country: string;
        state: string; city: string; pincode: string; remarks: string; status: string;
      }>("labours", id)
        .then((res) => {
          const d = res.data;
          setLabourName(d.labour_name || "");
          setMobileNumber(d.mobile_number || "");
          setPanNo(d.pan_no || "");
          setPanDoc(d.pan_doc || "");
          setAadharNo(d.aadhar_no || "");
          setAadharDoc(d.aadhar_doc || "");
          setAddress(d.address || "");
          setPincode(d.pincode || "");
          setRemarks(d.remarks || "");
          setStatus(d.status || "Active");

          // Resolve Country Code
          const matchCountry = d.country
            ? Country.getAllCountries().find(
                (c) => c.name.toLowerCase() === d.country.toLowerCase() || c.isoCode.toLowerCase() === d.country.toLowerCase()
              )
            : null;
          const cCode = matchCountry ? matchCountry.isoCode : "";
          setCountry(matchCountry ? matchCountry.name : (d.country || ""));
          setCountryCode(cCode);

          if (cCode) {
            // Resolve State Code
            const sList = State.getStatesOfCountry(cCode);
            const matchState = sList.find(
              (s) => s.name.toLowerCase() === (d.state || "").toLowerCase() || s.isoCode.toLowerCase() === (d.state || "").toLowerCase()
            );
            const sCode = matchState ? matchState.isoCode : "";
            setState(matchState ? matchState.name : (d.state || ""));
            setStateCode(sCode);
            setCity(d.city || "");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    } else {
      setLabourName("");
      setMobileNumber("");
      setPanNo("");
      setPanDoc("");
      setAadharNo("");
      setAadharDoc("");
      setAddress("");
      setCountry("India");
      setCountryCode("IN");
      setState("");
      setStateCode("");
      setCity("");
      setPincode("");
      setRemarks("");
      setStatus("Active");
    }
  }, [id, isEdit]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setDocState: (val: string) => void, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: "File size must be less than 5MB" }));
      return;
    }

    const allowed = ["pdf", "png", "jpg", "jpeg"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowed.includes(ext)) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: "Invalid file format (PDF, PNG, JPG allowed)" }));
      return;
    }

    setDocState(file.name);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!labourName.trim()) {
      errors.labourName = "Labour name is required";
    }

    if (!mobileNumber.trim()) {
      errors.mobileNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(mobileNumber.trim())) {
      errors.mobileNumber = "Contact number must be 10 digits";
    }

    if (panNo.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(panNo.trim())) {
      errors.panNo = "Invalid PAN format (e.g. ABCDE1234F)";
    }

    if (aadharNo.trim() && !/^\d{12}$/.test(aadharNo.trim())) {
      errors.aadharNo = "Aadhaar number must be 12 digits";
    }

    if (!address.trim()) {
      errors.address = "Address is required";
    }

    if (!country) {
      errors.country = "Country is required";
    }

    if (!state) {
      errors.state = "State is required";
    }

    if (!city) {
      errors.city = "City is required";
    }

    if (!pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errors.pincode = "Pincode must be 6 digits";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true);
      setError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        labourName: labourName.trim(),
        mobileNumber: mobileNumber.trim(),
        panNo: panNo.trim().toUpperCase(),
        panDoc,
        aadharNo: aadharNo.trim(),
        aadharDoc,
        address: address.trim(),
        country,
        state,
        city,
        pincode: pincode.trim(),
        remarks: remarks.trim(),
        status,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("labours", id, payload);
        navigate("/labour", { state: { toastMessage: "Labour updated successfully" } });
      } else {
        await createMasterItem("labours", payload);
        navigate("/labour", { state: { toastMessage: "Labour created successfully" } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save labour details");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-container"><div className="form-card">Loading...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/labour")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Labour" : "Add Labour"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Labour &gt; <span>{isEdit ? "Edit Labour" : "Add Labour"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Row 1: Labour Name & Contact No. (4-column grid) */}
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px 20px" }}>
            <div className="form-field">
              <label>Labour Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.labourName ? "input-error" : ""}
                placeholder="Enter Labour Name"
                value={labourName}
                onChange={(e) => {
                  setLabourName(e.target.value);
                  if (fieldErrors.labourName) setFieldErrors((prev) => ({ ...prev, labourName: "" }));
                }}
              />
              {fieldErrors.labourName && <span className="field-error-msg">{fieldErrors.labourName}</span>}
            </div>

            <div className="form-field">
              <label>Contact No. <span className="required">*</span></label>
              <input
                type="tel"
                maxLength={10}
                className={fieldErrors.mobileNumber ? "input-error" : ""}
                placeholder="Enter Contact No."
                value={mobileNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMobileNumber(val);
                  if (fieldErrors.mobileNumber) setFieldErrors((prev) => ({ ...prev, mobileNumber: "" }));
                }}
              />
              {fieldErrors.mobileNumber && <span className="field-error-msg">{fieldErrors.mobileNumber}</span>}
            </div>

            <div>{/* Row 1 Col 3 empty */}</div>
            <div>{/* Row 1 Col 4 empty */}</div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #edf2f7", margin: "24px 0" }} />

          {/* Rows 2, 3, 4 */}
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px 20px" }}>
            {/* Row 2: PAN Number, PAN Document, Aadhaar Number, Aadhaar Document */}
            <div className="form-field">
              <label>PAN Number</label>
              <input
                type="text"
                maxLength={10}
                className={fieldErrors.panNo ? "input-error" : ""}
                placeholder="Enter PAN Number"
                value={panNo}
                onChange={(e) => {
                  setPanNo(e.target.value.toUpperCase());
                  if (fieldErrors.panNo) setFieldErrors((prev) => ({ ...prev, panNo: "" }));
                }}
              />
              {fieldErrors.panNo && <span className="field-error-msg">{fieldErrors.panNo}</span>}
            </div>

            <div className="form-field">
              <label>PAN Document</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Upload File"
                  value={panDoc}
                  readOnly
                  className={fieldErrors.panDoc ? "input-error" : ""}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.png,.jpg,.jpeg";
                    input.onchange = (e: any) => handleFileUpload(e, setPanDoc, "panDoc");
                    input.click();
                  }}
                  style={{ cursor: "pointer", paddingRight: "36px" }}
                />
                <span
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.png,.jpg,.jpeg";
                    input.onchange = (e: any) => handleFileUpload(e, setPanDoc, "panDoc");
                    input.click();
                  }}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6b7280", fontSize: "16px" }}
                >
                  ↑
                </span>
              </div>
              {fieldErrors.panDoc && <span className="field-error-msg">{fieldErrors.panDoc}</span>}
            </div>

            <div className="form-field">
              <label>Aadhaar Number</label>
              <input
                type="text"
                maxLength={12}
                className={fieldErrors.aadharNo ? "input-error" : ""}
                placeholder="Enter Aadhaar Number"
                value={aadharNo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setAadharNo(val);
                  if (fieldErrors.aadharNo) setFieldErrors((prev) => ({ ...prev, aadharNo: "" }));
                }}
              />
              {fieldErrors.aadharNo && <span className="field-error-msg">{fieldErrors.aadharNo}</span>}
            </div>

            <div className="form-field">
              <label>Aadhaar Document</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Upload File"
                  value={aadharDoc}
                  readOnly
                  className={fieldErrors.aadharDoc ? "input-error" : ""}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.png,.jpg,.jpeg";
                    input.onchange = (e: any) => handleFileUpload(e, setAadharDoc, "aadharDoc");
                    input.click();
                  }}
                  style={{ cursor: "pointer", paddingRight: "36px" }}
                />
                <span
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf,.png,.jpg,.jpeg";
                    input.onchange = (e: any) => handleFileUpload(e, setAadharDoc, "aadharDoc");
                    input.click();
                  }}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6b7280", fontSize: "16px" }}
                >
                  ↑
                </span>
              </div>
              {fieldErrors.aadharDoc && <span className="field-error-msg">{fieldErrors.aadharDoc}</span>}
            </div>

            {/* Row 3: Address, Country, State, City */}
            <div className="form-field">
              <label>Address <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.address ? "input-error" : ""}
                placeholder="Enter Address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: "" }));
                }}
              />
              {fieldErrors.address && <span className="field-error-msg">{fieldErrors.address}</span>}
            </div>

            {/* Country Dropdown */}
            <div className="form-field">
              <label>Country <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.country ? "input-error" : ""}
                value={country}
                placeholder="Select Country"
                options={allCountries.map((c) => ({ value: c.name, label: c.name }))}
                onChange={(e) => {
                  const val = e.target.value;
                  const cObj = allCountries.find((c) => c.name === val || c.isoCode === val);
                  setCountry(cObj ? cObj.name : val);
                  setCountryCode(cObj ? cObj.isoCode : "");
                  setState("");
                  setStateCode("");
                  setCity("");
                  if (fieldErrors.country) setFieldErrors((prev) => ({ ...prev, country: "" }));
                }}
                onClear={() => {
                  setCountry("");
                  setCountryCode("");
                  setState("");
                  setStateCode("");
                  setCity("");
                  if (fieldErrors.country) setFieldErrors((prev) => ({ ...prev, country: "" }));
                }}
              />
              {fieldErrors.country && <span className="field-error-msg">{fieldErrors.country}</span>}
            </div>

            {/* State Dropdown */}
            <div className="form-field">
              <label>State <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.state ? "input-error" : ""}
                value={state}
                disabled={!countryCode}
                placeholder={countryCode ? "Select State" : "Select Country First"}
                options={availableStates.map((s) => ({ value: s.name, label: s.name }))}
                onChange={(e) => {
                  const val = e.target.value;
                  const sObj = availableStates.find((s) => s.name === val || s.isoCode === val);
                  setState(sObj ? sObj.name : val);
                  setStateCode(sObj ? sObj.isoCode : "");
                  setCity("");
                  if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: "" }));
                }}
                onClear={() => {
                  setState("");
                  setStateCode("");
                  setCity("");
                  if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: "" }));
                }}
              />
              {fieldErrors.state && <span className="field-error-msg">{fieldErrors.state}</span>}
            </div>

            {/* City Dropdown */}
            <div className="form-field">
              <label>City <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.city ? "input-error" : ""}
                value={city}
                disabled={!countryCode || !stateCode}
                placeholder={
                  !countryCode
                    ? "Select Country First"
                    : !stateCode
                    ? "Select State First"
                    : "Select City"
                }
                options={availableCities.map((ct) => ({ value: ct.name, label: ct.name }))}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: "" }));
                }}
                onClear={() => {
                  setCity("");
                  if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: "" }));
                }}
              />
              {fieldErrors.city && <span className="field-error-msg">{fieldErrors.city}</span>}
            </div>

            {/* Row 4: Pincode, Remark */}
            <div className="form-field">
              <label>Pincode <span className="required">*</span></label>
              <input
                type="text"
                maxLength={6}
                className={fieldErrors.pincode ? "input-error" : ""}
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPincode(val);
                  if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: "" }));
                }}
              />
              {fieldErrors.pincode && <span className="field-error-msg">{fieldErrors.pincode}</span>}
            </div>

            <div className="form-field">
              <label>Remark</label>
              <input
                type="text"
                placeholder="-"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div>{/* Row 4 Col 3 empty */}</div>
            <div>{/* Row 4 Col 4 empty */}</div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", borderTop: "none", paddingTop: 0 }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/labour")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabourForm;
