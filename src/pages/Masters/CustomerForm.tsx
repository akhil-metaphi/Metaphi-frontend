import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  // Main Customer Details
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");

  // Contact Person Details
  const [contactPerson, setContactPerson] = useState("");
  const [contactPersonMobile, setContactPersonMobile] = useState("");

  // Address Details
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [gstin, setGstin] = useState("");

  // Transporter Details (Optional)
  const [customerNameTransport, setCustomerNameTransport] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [transporterContactPersonName, setTransporterContactPersonName] = useState("");
  const [transporterContactPersonMobile, setTransporterContactPersonMobile] = useState("");
  const [transporterAddress, setTransporterAddress] = useState("");
  const [transporterCountry, setTransporterCountry] = useState("");
  const [transporterCountryCode, setTransporterCountryCode] = useState("");
  const [transporterState, setTransporterState] = useState("");
  const [transporterStateCode, setTransporterStateCode] = useState("");
  const [transporterCity, setTransporterCity] = useState("");
  const [transporterPincode, setTransporterPincode] = useState("");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Country/State/City arrays via country-state-city (source of truth matching UserForm)
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  
  // Primary Address lists
  const availableStates = useMemo(() => (countryCode ? State.getStatesOfCountry(countryCode) : []), [countryCode]);
  const availableCities = useMemo(() => (countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []), [countryCode, stateCode]);

  // Transporter Address lists
  const transporterAvailableStates = useMemo(() => (transporterCountryCode ? State.getStatesOfCountry(transporterCountryCode) : []), [transporterCountryCode]);
  const transporterAvailableCities = useMemo(() => (transporterCountryCode && transporterStateCode ? City.getCitiesOfState(transporterCountryCode, transporterStateCode) : []), [transporterCountryCode, transporterStateCode]);

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{
        customer_name: string; company_name: string; customer_type: string; email: string;
        mobile_number: string; aadhaar_no: string; gstin: string; gst_no: string;
        contact_person: string; contact_person_mobile: string;
        address: string; state: string; city: string; country: string; pincode: string;
        customer_name_transport: string; transporter_name: string;
        transporter_contact_person_name: string; transporter_contact_person_mobile: string;
        transporter_address: string; transporter_country: string; transporter_state: string;
        transporter_city: string; transporter_pincode: string;
      }>("customers", id)
        .then((res) => {
          const d = res.data;
          setCustomerName(d.customer_name || "");
          setCompanyName(d.company_name || "");
          setCustomerType(d.customer_type || "");
          setEmail(d.email || "");
          setMobileNumber(d.mobile_number || "");
          setAadhaarNo(d.aadhaar_no || "");
          setGstin(d.gstin || d.gst_no || "");
          setContactPerson(d.contact_person || "");
          setContactPersonMobile(d.contact_person_mobile || "");
          setAddress(d.address || "");
          setPincode(d.pincode || "");

          // Resolve Primary Location codes
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

          // Transporter details
          setCustomerNameTransport(d.customer_name_transport || "");
          setTransporterName(d.transporter_name || "");
          setTransporterContactPersonName(d.transporter_contact_person_name || "");
          setTransporterContactPersonMobile(d.transporter_contact_person_mobile || "");
          setTransporterAddress(d.transporter_address || "");
          setTransporterPincode(d.transporter_pincode || "");

          // Resolve Transporter Location codes
          if (d.transporter_country) {
            const matchTCountry = Country.getAllCountries().find(
              (c) => c.name.toLowerCase() === d.transporter_country.toLowerCase() || c.isoCode === d.transporter_country
            );
            const tcCode = matchTCountry ? matchTCountry.isoCode : "";
            setTransporterCountry(matchTCountry ? matchTCountry.name : d.transporter_country);
            setTransporterCountryCode(tcCode);

            if (tcCode) {
              const tsList = State.getStatesOfCountry(tcCode);
              const matchTState = tsList.find(
                (s) => s.name.toLowerCase() === (d.transporter_state || "").toLowerCase() || s.isoCode === d.transporter_state
              );
              const tsCode = matchTState ? matchTState.isoCode : "";
              setTransporterState(matchTState ? matchTState.name : (d.transporter_state || ""));
              setTransporterStateCode(tsCode);
              setTransporterCity(d.transporter_city || "");
            }
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = "Customer name is required";
    }

    if (!customerType) {
      errors.customerType = "Customer type is required";
    }

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

    if (!aadhaarNo.trim()) {
      errors.aadhaarNo = "Aadhaar number is required";
    } else if (!/^\d{12}$/.test(aadhaarNo.trim())) {
      errors.aadhaarNo = "Aadhaar must be 12 digits";
    }

    if (!contactPerson.trim()) {
      errors.contactPerson = "Contact person name is required";
    }

    if (!contactPersonMobile.trim()) {
      errors.contactPersonMobile = "Contact person number is required";
    } else if (!/^\d{10}$/.test(contactPersonMobile.trim())) {
      errors.contactPersonMobile = "Valid 10-digit number required";
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
      errors.pincode = "6-digit pincode is required";
    }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstin.trim()) {
      errors.gstin = "GSTIN is required";
    } else if (!gstinRegex.test(gstin.trim())) {
      errors.gstin = "GSTIN must follow the correct format";
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
        customerName: customerName.trim(),
        companyName: companyName.trim(),
        customerType,
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        aadhaarNo: aadhaarNo.trim(),
        gstin: gstin.trim().toUpperCase(),
        gstNo: gstin.trim().toUpperCase(),
        status: "Active",
        contactPerson: contactPerson.trim(),
        contactPersonMobile: contactPersonMobile.trim(),
        address: address.trim(),
        country,
        state,
        city,
        pincode: pincode.trim(),
        customerNameTransport: customerNameTransport.trim(),
        transporterName: transporterName.trim(),
        transporterContactPersonName: transporterContactPersonName.trim(),
        transporterContactPersonMobile: transporterContactPersonMobile.trim(),
        transporterAddress: transporterAddress.trim(),
        transporterCountry,
        transporterState,
        transporterCity,
        transporterPincode: transporterPincode.trim(),
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("customers", id, payload);
        navigate("/customer", { state: { toastMessage: "Customer updated successfully" } });
      } else {
        await createMasterItem("customers", payload);
        navigate("/customer", { state: { toastMessage: "Customer created successfully" } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="page-container"><div className="page-card">Loading...</div></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/customer")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Customer" : "Add Customer"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Customer &gt; <span>{isEdit ? "Edit Customer" : "Add Customer"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Customer Details */}
          <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Customer Details</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "20px" }}>
            <div className="form-field">
              <label>Customer Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.customerName ? "input-error" : ""}
                placeholder="Enter Customer Name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (fieldErrors.customerName) setFieldErrors((prev) => ({ ...prev, customerName: "" }));
                }}
              />
              {fieldErrors.customerName && <span className="field-error-msg">{fieldErrors.customerName}</span>}
            </div>
            <div className="form-field">
              <label>Company Name</label>
              <input type="text" placeholder="Enter Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Customer Type <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.customerType ? "input-error" : ""}
                value={customerType}
                placeholder="Select Customer Type"
                options={[
                  { value: "B2B", label: "B2B" },
                  { value: "B2C", label: "B2C" },
                  { value: "Retail", label: "Retail" },
                  { value: "Wholesale", label: "Wholesale" },
                  { value: "Corporate", label: "Corporate" },
                  { value: "Individual", label: "Individual" },
                  { value: "Company", label: "Company" },
                  { value: "Proprietorship", label: "Proprietorship" },
                  { value: "Partnership", label: "Partnership" },
                  { value: "LLP", label: "LLP" },
                  { value: "Other", label: "Other" },
                ]}
                onChange={(e) => {
                  setCustomerType(e.target.value);
                  if (fieldErrors.customerType) setFieldErrors((prev) => ({ ...prev, customerType: "" }));
                }}
                onClear={() => {
                  setCustomerType("");
                  if (fieldErrors.customerType) setFieldErrors((prev) => ({ ...prev, customerType: "" }));
                }}
              />
              {fieldErrors.customerType && <span className="field-error-msg">{fieldErrors.customerType}</span>}
            </div>
            <div className="form-field">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                className={fieldErrors.email ? "input-error" : ""}
                placeholder="Enter Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
              />
              {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>Contact <span className="required">*</span></label>
              <input
                type="tel"
                maxLength={10}
                className={fieldErrors.mobileNumber ? "input-error" : ""}
                placeholder="10-digit number"
                value={mobileNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMobileNumber(val);
                  if (fieldErrors.mobileNumber) setFieldErrors((prev) => ({ ...prev, mobileNumber: "" }));
                }}
              />
              {fieldErrors.mobileNumber && <span className="field-error-msg">{fieldErrors.mobileNumber}</span>}
            </div>
            <div className="form-field">
              <label>Aadhaar No. <span className="required">*</span></label>
              <input
                type="text"
                maxLength={12}
                className={fieldErrors.aadhaarNo ? "input-error" : ""}
                placeholder="12-digit number"
                value={aadhaarNo}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setAadhaarNo(val);
                  if (fieldErrors.aadhaarNo) setFieldErrors((prev) => ({ ...prev, aadhaarNo: "" }));
                }}
              />
              {fieldErrors.aadhaarNo && <span className="field-error-msg">{fieldErrors.aadhaarNo}</span>}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />

          {/* Section 2: Contact Person Details */}
          <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Contact Person Details</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>Contact Person Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.contactPerson ? "input-error" : ""}
                placeholder="Enter Name"
                value={contactPerson}
                onChange={(e) => {
                  setContactPerson(e.target.value);
                  if (fieldErrors.contactPerson) setFieldErrors((prev) => ({ ...prev, contactPerson: "" }));
                }}
              />
              {fieldErrors.contactPerson && <span className="field-error-msg">{fieldErrors.contactPerson}</span>}
            </div>
            <div className="form-field">
              <label>Contact Person Number <span className="required">*</span></label>
              <input
                type="tel"
                maxLength={10}
                className={fieldErrors.contactPersonMobile ? "input-error" : ""}
                placeholder="10-digit number"
                value={contactPersonMobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setContactPersonMobile(val);
                  if (fieldErrors.contactPersonMobile) setFieldErrors((prev) => ({ ...prev, contactPersonMobile: "" }));
                }}
              />
              {fieldErrors.contactPersonMobile && <span className="field-error-msg">{fieldErrors.contactPersonMobile}</span>}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />

          {/* Section 3: Customer Address Details */}
          <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Customer Address Details</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "20px" }}>
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
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>Pincode <span className="required">*</span></label>
              <input
                type="text"
                maxLength={6}
                className={fieldErrors.pincode ? "input-error" : ""}
                placeholder="6-digit Pincode"
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
              <label>GSTIN <span className="required">*</span></label>
              <input
                type="text"
                maxLength={15}
                className={fieldErrors.gstin ? "input-error" : ""}
                placeholder="Enter GSTIN"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  if (fieldErrors.gstin) setFieldErrors((prev) => ({ ...prev, gstin: "" }));
                }}
              />
              {fieldErrors.gstin && <span className="field-error-msg">{fieldErrors.gstin}</span>}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "28px 0" }} />

          {/* Section 4: Transporter Details (Optional) */}
          <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Transporter Details (Optional)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "20px" }}>
            <div className="form-field">
              <label>Customer Name For Transport</label>
              <input type="text" placeholder="Enter Customer Name For Transport" value={customerNameTransport} onChange={(e) => setCustomerNameTransport(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Transporter Name</label>
              <input type="text" placeholder="Enter Transporter Name" value={transporterName} onChange={(e) => setTransporterName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Contact Person Name</label>
              <input type="text" placeholder="Enter Contact Person Name" value={transporterContactPersonName} onChange={(e) => setTransporterContactPersonName(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Contact Person Number</label>
              <input
                type="tel"
                maxLength={10}
                placeholder="Enter Contact Person Number"
                value={transporterContactPersonMobile}
                onChange={(e) => setTransporterContactPersonMobile(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "20px" }}>
            <div className="form-field" style={{ gridColumn: "span 2" }}>
              <label>Address</label>
              <input type="text" placeholder="Enter Address" value={transporterAddress} onChange={(e) => setTransporterAddress(e.target.value)} />
            </div>
            <div className="form-field">
              <label>Country</label>
              <SelectWithClear
                value={transporterCountry}
                placeholder="Select Country"
                options={allCountries.map((c) => ({ value: c.name, label: c.name }))}
                onChange={(e) => {
                  const val = e.target.value;
                  const cObj = allCountries.find((c) => c.name === val || c.isoCode === val);
                  setTransporterCountry(cObj ? cObj.name : val);
                  setTransporterCountryCode(cObj ? cObj.isoCode : "");
                  setTransporterState("");
                  setTransporterStateCode("");
                  setTransporterCity("");
                }}
                onClear={() => {
                  setTransporterCountry("");
                  setTransporterCountryCode("");
                  setTransporterState("");
                  setTransporterStateCode("");
                  setTransporterCity("");
                }}
              />
            </div>
            <div className="form-field">
              <label>State</label>
              <SelectWithClear
                value={transporterState}
                disabled={!transporterCountryCode}
                placeholder={transporterCountryCode ? "Select State" : "Select Country First"}
                options={transporterAvailableStates.map((s) => ({ value: s.name, label: s.name }))}
                onChange={(e) => {
                  const val = e.target.value;
                  const sObj = transporterAvailableStates.find((s) => s.name === val || s.isoCode === val);
                  setTransporterState(sObj ? sObj.name : val);
                  setTransporterStateCode(sObj ? sObj.isoCode : "");
                  setTransporterCity("");
                }}
                onClear={() => {
                  setTransporterState("");
                  setTransporterStateCode("");
                  setTransporterCity("");
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            <div className="form-field">
              <label>City</label>
              <SelectWithClear
                value={transporterCity}
                disabled={!transporterStateCode}
                placeholder={transporterStateCode ? "Select City" : "Select State First"}
                options={transporterAvailableCities.map((ct) => ({ value: ct.name, label: ct.name }))}
                onChange={(e) => setTransporterCity(e.target.value)}
                onClear={() => setTransporterCity("")}
              />
            </div>
            <div className="form-field">
              <label>Pincode</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit Pincode"
                value={transporterPincode}
                onChange={(e) => setTransporterPincode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/customer")}>Cancel</button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Add"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
