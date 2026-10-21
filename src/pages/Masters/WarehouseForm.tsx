import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import { createMasterItem, fetchMasterById, updateMasterItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

const WarehouseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseType, setWarehouseType] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [countryCode, setCountryCode] = useState("IN");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("Active");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const availableStates = useMemo(
    () => (country && countryCode ? State.getStatesOfCountry(countryCode) : []),
    [country, countryCode]
  );
  const availableCities = useMemo(
    () => (country && countryCode && state && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [country, countryCode, state, stateCode]
  );

  useEffect(() => {
    if (isEdit && id) {
      setFetching(true);
      fetchMasterById<{
        warehouse_name: string; warehouse_code: string; warehouse_type: string; address: string; city: string;
        state: string; country: string; pincode: string; remarks: string; status: string;
        contact_person: string; contact_number: string; capacity: string;
      }>("warehouses", id)
        .then((res) => {
          const d = res.data;
          setWarehouseName(d.warehouse_name || "");
          setWarehouseCode(d.warehouse_code || "");
          setWarehouseType(d.warehouse_type || "");
          setAddress(d.address || "");
          setPincode(d.pincode || "");
          setRemarks(d.remarks || "");
          setStatus(d.status || "Active");
          setContactPerson(d.contact_person || "");
          setContactNumber(d.contact_number || "");
          setCapacity(d.capacity || "");

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
    } else {
      setWarehouseName("");
      setWarehouseCode("");
      setWarehouseType("");
      setAddress("");
      setCountry("India");
      setCountryCode("IN");
      setState("");
      setStateCode("");
      setCity("");
      setPincode("");
      setRemarks("");
      setStatus("Active");
      setContactPerson("");
      setContactNumber("");
      setCapacity("");
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!warehouseName.trim()) errors.warehouseName = "Warehouse name is required";
    if (!warehouseType) errors.warehouseType = "Warehouse type is required";
    if (!country) errors.country = "Country is required";
    if (!state) errors.state = "State is required";
    if (!city) errors.city = "City is required";
    if (!address.trim()) errors.address = "Address is required";

    if (!pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(pincode.trim())) {
      errors.pincode = "6-digit pincode is required";
    }

    if (contactNumber.trim() && !/^\d{10}$/.test(contactNumber.trim())) {
      errors.contactNumber = "Valid 10-digit number required";
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
        warehouseName: warehouseName.trim(),
        warehouseCode: warehouseCode.trim(),
        warehouseType,
        address: address.trim(),
        city,
        state,
        country,
        pincode: pincode.trim(),
        remarks: remarks.trim(),
        status,
        contactPerson: contactPerson.trim(),
        contactNumber: contactNumber.trim(),
        capacity: capacity.trim(),
        location: city,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id
      };
      if (isEdit && id) {
        await updateMasterItem("warehouses", id, payload);
        navigate("/warehouse-list", { state: { toastMessage: "Warehouse updated successfully" } });
      } else {
        await createMasterItem("warehouses", payload);
        navigate("/warehouse-list", { state: { toastMessage: "Warehouse created successfully" } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save warehouse");
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
            <span className="back-arrow" onClick={() => navigate("/warehouse-list")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title">{isEdit ? "Edit Warehouse" : "Add Warehouse"}</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Warehouse &gt; <span>{isEdit ? "Edit Warehouse" : "Add Warehouse"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px 20px" }}>
            {/* Row 1 */}
            <div className="form-field">
              <label>Warehouse Name <span className="required">*</span></label>
              <input
                type="text"
                className={fieldErrors.warehouseName ? "input-error" : ""}
                placeholder="Enter Warehouse Name"
                value={warehouseName}
                onChange={(e) => {
                  setWarehouseName(e.target.value);
                  if (fieldErrors.warehouseName) setFieldErrors((prev) => ({ ...prev, warehouseName: "" }));
                }}
              />
              {fieldErrors.warehouseName && <span className="field-error-msg">{fieldErrors.warehouseName}</span>}
            </div>

            <div className="form-field">
              <label>Warehouse Type <span className="required">*</span></label>
              <SelectWithClear
                className={fieldErrors.warehouseType ? "input-error" : ""}
                value={warehouseType}
                placeholder="Select Warehouse Type"
                options={[
                  { value: "Main", label: "Main" },
                  { value: "Retail", label: "Retail" },
                  { value: "Cold Storage", label: "Cold Storage" },
                  { value: "Distribution", label: "Distribution" },
                  { value: "Other", label: "Other" },
                ]}
                onChange={(e) => {
                  setWarehouseType(e.target.value);
                  if (fieldErrors.warehouseType) setFieldErrors((prev) => ({ ...prev, warehouseType: "" }));
                }}
                onClear={() => {
                  setWarehouseType("");
                  if (fieldErrors.warehouseType) setFieldErrors((prev) => ({ ...prev, warehouseType: "" }));
                }}
              />
              {fieldErrors.warehouseType && <span className="field-error-msg">{fieldErrors.warehouseType}</span>}
            </div>

            <div>{/* Row 1 Col 3 empty */}</div>
            <div>{/* Row 1 Col 4 empty */}</div>

            {/* Row 2 */}
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
                disabled={!country || !countryCode}
                placeholder={country && countryCode ? "Select State" : "Select Country First"}
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
                disabled={!country || !countryCode || !state || !stateCode}
                placeholder={
                  !country || !countryCode
                    ? "Select Country First"
                    : !state || !stateCode
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

            {/* Row 3 */}
            <div className="form-field">
              <label>Pincode <span className="required">*</span></label>
              <input
                type="text"
                maxLength={6}
                className={fieldErrors.pincode ? "input-error" : ""}
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ""));
                  if (fieldErrors.pincode) setFieldErrors((prev) => ({ ...prev, pincode: "" }));
                }}
              />
              {fieldErrors.pincode && <span className="field-error-msg">{fieldErrors.pincode}</span>}
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

            <div>{/* Row 3 Col 3 empty */}</div>
            <div>{/* Row 3 Col 4 empty */}</div>
          </div>

          <div className="form-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "32px", borderTop: "none", paddingTop: 0 }}>
            <button type="button" className="btn-wizard-cancel" onClick={() => navigate("/warehouse-list")}>
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

export default WarehouseForm;
