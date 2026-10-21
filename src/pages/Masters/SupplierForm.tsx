import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

const SupplierForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [supplierName, setSupplierName] = useState("");
  const [supplierCode, setSupplierCode] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");

  const [contactPerson, setContactPerson] = useState("");
  const [contactPersonMobile, setContactPersonMobile] = useState("");

  const [transporterName1, setTransporterName1] = useState("");
  const [contactPersonName1, setContactPersonName1] = useState("");
  const [contactPersonMobile1, setContactPersonMobile1] = useState("");
  const [transporterName2, setTransporterName2] = useState("");
  const [contactPersonName2, setContactPersonName2] = useState("");
  const [contactPersonMobile2, setContactPersonMobile2] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const availableStates = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const availableCities = useMemo(() => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []), [countryCode, stateCode]);

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{
        supplier_name: string; supplier_code: string; email: string; mobile_number: string;
        address: string; country: string; state: string; city: string; pincode: string; gstin: string; gst_no: string;
        contact_person: string; contact_person_mobile: string;
        transporter_name_1?: string; contact_person_name_1?: string; contact_person_mobile_1?: string;
        transporter_name_2?: string; contact_person_name_2?: string; contact_person_mobile_2?: string;
      }>("suppliers", id)
        .then((res) => {
          const d = res.data;
          setSupplierName(d.supplier_name || "");
          setSupplierCode(d.supplier_code || "");
          setEmail(d.email || "");
          setMobileNumber(d.mobile_number || "");
          setAddress(d.address || "");
          setPincode(d.pincode || "");
          setGstin(d.gstin || d.gst_no || "");
          setContactPerson(d.contact_person || "");
          setContactPersonMobile(d.contact_person_mobile || "");
          setTransporterName1(d.transporter_name_1 || "");
          setContactPersonName1(d.contact_person_name_1 || "");
          setContactPersonMobile1(d.contact_person_mobile_1 || "");
          setTransporterName2(d.transporter_name_2 || "");
          setContactPersonName2(d.contact_person_name_2 || "");
          setContactPersonMobile2(d.contact_person_mobile_2 || "");

          const matchCountry = d.country
            ? Country.getAllCountries().find(
                (c) => c.name.toLowerCase() === d.country.toLowerCase() || c.isoCode.toLowerCase() === d.country.toLowerCase()
              )
            : null;
          const cCode = matchCountry ? matchCountry.isoCode : "";
          setCountry(matchCountry ? matchCountry.name : (d.country || ""));
          setCountryCode(cCode);

          if (cCode) {
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
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!supplierName.trim()) errors.supplierName = "Supplier name is required";
    if (!supplierCode.trim()) errors.supplierCode = "Supplier code is required";

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Valid email address is required";
    }

    if (!mobileNumber.trim()) {
      errors.mobileNumber = "Contact number is required";
    } else if (!/^\d{10}$/.test(mobileNumber.trim())) {
      errors.mobileNumber = "Valid 10-digit contact number required";
    }

    if (!address.trim()) errors.address = "Address is required";
    if (!country) errors.country = "Country is required";
    if (!state) errors.state = "State is required";
    if (!city) errors.city = "City is required";

    if (!pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errors.pincode = "6-digit pincode is required";
    }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstin.trim()) {
      errors.gstin = "GSTIN is required";
    } else if (!gstinRegex.test(gstin.trim())) {
      errors.gstin = "GSTIN must follow the correct format";
    }

    if (!contactPerson.trim()) errors.contactPerson = "Contact person name is required";

    if (!contactPersonMobile.trim()) {
      errors.contactPersonMobile = "Contact person mobile number is required";
    } else if (!/^\d{10}$/.test(contactPersonMobile.trim())) {
      errors.contactPersonMobile = "Valid 10-digit number required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true); setError("");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const payload = {
        supplierName: supplierName.trim(),
        supplierCode: supplierCode.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        country,
        state,
        city,
        pincode: pincode.trim(),
        gstin: gstin.trim().toUpperCase(),
        gstNo: gstin.trim().toUpperCase(),
        contactPerson: contactPerson.trim(),
        contactPersonMobile: contactPersonMobile.trim(),
        transporterName1: transporterName1.trim(),
        contactPersonName1: contactPersonName1.trim(),
        contactPersonMobile1: contactPersonMobile1.trim(),
        transporterName2: transporterName2.trim(),
        contactPersonName2: contactPersonName2.trim(),
        contactPersonMobile2: contactPersonMobile2.trim(),
        createdBy: currentUser?.id, updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("suppliers", id, payload);
        navigate("/supplier-list", { state: { toastMessage: "Supplier updated successfully" } });
      } else {
        await createMasterItem("suppliers", payload);
        navigate("/supplier-list", { state: { toastMessage: "Supplier created successfully" } });
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save supplier"); }
    finally { setLoading(false); }
  };

  if (fetching) return <div className="page-container"><div className="page-card">Loading...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/supplier-list")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Supplier" : "Add Supplier"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Supplier &gt; <span>{isEdit ? "Edit Supplier" : "Add Supplier"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>Supplier Name <span className="required">*</span></label>
              <input type="text" className={fieldErrors.supplierName ? "input-error" : ""} placeholder="Enter Supplier Name" value={supplierName} onChange={(e) => { setSupplierName(e.target.value); if (fieldErrors.supplierName) setFieldErrors((prev) => ({ ...prev, supplierName: "" })); }} />
              {fieldErrors.supplierName && <span className="field-error-msg">{fieldErrors.supplierName}</span>}
            </div>
            <div className="form-field">
              <label>Supplier Code <span className="required">*</span></label>
              <input type="text" className={fieldErrors.supplierCode ? "input-error" : ""} placeholder="Enter Supplier Code" value={supplierCode} onChange={(e) => { setSupplierCode(e.target.value); if (fieldErrors.supplierCode) setFieldErrors((prev) => ({ ...prev, supplierCode: "" })); }} />
              {fieldErrors.supplierCode && <span className="field-error-msg">{fieldErrors.supplierCode}</span>}
            </div>
            <div className="form-field">
              <label>Email <span className="required">*</span></label>
              <input type="email" className={fieldErrors.email ? "input-error" : ""} placeholder="Enter Email" value={email} onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" })); }} />
              {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
            </div>
            <div className="form-field">
              <label>Contact No. <span className="required">*</span></label>
              <input type="tel" maxLength={10} className={fieldErrors.mobileNumber ? "input-error" : ""} placeholder="Enter Contact No." value={mobileNumber} onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, "")); if (fieldErrors.mobileNumber) setFieldErrors((prev) => ({ ...prev, mobileNumber: "" })); }} />
              {fieldErrors.mobileNumber && <span className="field-error-msg">{fieldErrors.mobileNumber}</span>}
            </div>
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Address <span className="required">*</span></label>
              <input type="text" className={fieldErrors.address ? "input-error" : ""} placeholder="Enter Address" value={address} onChange={(e) => { setAddress(e.target.value); if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: "" })); }} />
              {fieldErrors.address && <span className="field-error-msg">{fieldErrors.address}</span>}
            </div>
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
            <div className="form-field">
              <label>City <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.city ? "input-error" : ""}
                value={city}
                disabled={!stateCode}
                placeholder={stateCode ? "Select City" : "Select State First"}
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
            <div className="form-field">
              <label>Pincode <span className="required">*</span></label>
              <input type="text" maxLength={6} className={fieldErrors.pincode ? "input-error" : ""} placeholder="6-digit Pincode" value={pincode} onChange={(e) => { setPincode(e.target.value.replace(/\D/g, "")); if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: "" })); }} />
              {fieldErrors.pincode && <span className="field-error-msg">{fieldErrors.pincode}</span>}
            </div>
            <div className="form-field">
              <label>GSTIN <span className="required">*</span></label>
              <input type="text" maxLength={15} className={fieldErrors.gstin ? "input-error" : ""} placeholder="Enter GSTIN" value={gstin} onChange={(e) => { setGstin(e.target.value.toUpperCase()); if (fieldErrors.gstin) setFieldErrors((prev) => ({ ...prev, gstin: "" })); }} />
              {fieldErrors.gstin && <span className="field-error-msg">{fieldErrors.gstin}</span>}
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />
          <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Contact Person Details</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>Contact Person Name <span className="required">*</span></label>
              <input type="text" className={fieldErrors.contactPerson ? "input-error" : ""} placeholder="Enter Contact Person Name" value={contactPerson} onChange={(e) => { setContactPerson(e.target.value); if (fieldErrors.contactPerson) setFieldErrors((prev) => ({ ...prev, contactPerson: "" })); }} />
              {fieldErrors.contactPerson && <span className="field-error-msg">{fieldErrors.contactPerson}</span>}
            </div>
            <div className="form-field">
              <label>Contact Person Mobile Number <span className="required">*</span></label>
              <input type="tel" maxLength={10} className={fieldErrors.contactPersonMobile ? "input-error" : ""} placeholder="Enter Contact Person Mobile Number" value={contactPersonMobile} onChange={(e) => { setContactPersonMobile(e.target.value.replace(/\D/g, "")); if (fieldErrors.contactPersonMobile) setFieldErrors((prev) => ({ ...prev, contactPersonMobile: "" })); }} />
              {fieldErrors.contactPersonMobile && <span className="field-error-msg">{fieldErrors.contactPersonMobile}</span>}
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />
          <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Transporter Details (Optional)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px" }}>
            <div className="form-field">
              <label>Transporter Name 1</label>
              <input type="text" placeholder="Enter Transporter Name 1" value={transporterName1} onChange={(e) => setTransporterName1(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Contact Person Name 1</label>
              <input type="text" placeholder="Enter Contact Person Name 1" value={contactPersonName1} onChange={(e) => setContactPersonName1(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Contact Person Mobile 1</label>
              <input type="tel" maxLength={10} placeholder="Enter Contact Person Mobile 1" value={contactPersonMobile1} onChange={(e) => setContactPersonMobile1(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>Transporter Name 2</label>
              <input type="text" placeholder="Enter Transporter Name 2" value={transporterName2} onChange={(e) => setTransporterName2(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Contact Person Name 2</label>
              <input type="text" placeholder="Enter Contact Person Name 2" value={contactPersonName2} onChange={(e) => setContactPersonName2(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Contact Person Mobile 2</label>
              <input type="tel" maxLength={10} placeholder="Enter Contact Person Mobile 2" value={contactPersonMobile2} onChange={(e) => setContactPersonMobile2(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/supplier-list")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierForm;
