import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createUser, getUserById, updateUser } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import { Country, State, City } from "country-state-city";
import "./UserForm.css";

const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    designation: "",
    userType: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobileNumber: "",
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Country/State/City codes for fetching sub-regions
  const [countryCode, setCountryCode] = useState<string>("");
  const [stateCode, setStateCode] = useState<string>("");

  // Country/State/City arrays via country-state-city (source of truth matching Master forms)
  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const availableStates = useMemo(
    () => (formData.country && countryCode ? State.getStatesOfCountry(countryCode) : []),
    [formData.country, countryCode]
  );
  const availableCities = useMemo(
    () => (formData.country && countryCode && formData.state && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []),
    [formData.country, countryCode, formData.state, stateCode]
  );

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      getUserById(id)
        .then((res) => {
          const u = res.user;
          setFormData({
            firstName: u.first_name || "",
            lastName: u.last_name || "",
            username: u.username || "",
            designation: u.designation || "",
            userType: u.user_type || "Staff",
            email: u.email || "",
            password: "",
            confirmPassword: "",
            mobileNumber: u.mobile_number || "",
            address: u.address || "",
            country: u.country || "",
            state: u.state || "",
            city: u.city || "",
            pincode: u.pincode || "",
          });

          // Resolve country code
          const cList = Country.getAllCountries();
          const matchCountry = cList.find(
            (c) => c.name.toLowerCase() === (u.country || "").toLowerCase() || c.isoCode.toLowerCase() === (u.country || "").toLowerCase()
          );
          if (matchCountry) {
            setCountryCode(matchCountry.isoCode);

            // Resolve state code
            const sList = State.getStatesOfCountry(matchCountry.isoCode);
            const matchState = sList.find(
              (s) => s.name.toLowerCase() === (u.state || "").toLowerCase() || s.isoCode.toLowerCase() === (u.state || "").toLowerCase()
            );
            if (matchState) {
              setStateCode(matchState.isoCode);
            }
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load user details");
        });
    } else {
      // Reset form data completely when entering Create User mode
      setFormData({
        firstName: "",
        lastName: "",
        username: "",
        designation: "",
        userType: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobileNumber: "",
        address: "",
        country: "",
        state: "",
        city: "",
        pincode: "",
      });
      setCountryCode("");
      setStateCode("");
    }
  }, [id, isEdit]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.username.trim()) errors.username = "User name is required";
    if (!formData.designation.trim()) errors.designation = "Designation is required";
    if (!formData.userType.trim()) errors.userType = "User type is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = "Mobile number must be exactly 10 digits.";
    }

    if (!isEdit) {
      if (!formData.password) {
        errors.password = "Password is required.";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters long.";
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = "Confirm password is required.";
      } else if (formData.password && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Password and Confirm Password do not match.";
      }
    }

    if (formData.pincode && !/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = "Pincode must be a 6-digit number.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true);

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        designation: formData.designation.trim(),
        userType: formData.userType.trim(),
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        address: formData.address.trim(),
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        pincode: formData.pincode.trim(),
        ...(isEdit ? {} : { password: formData.password }),
      };

      if (isEdit && id) {
        await updateUser(id, payload as any);
        navigate(`/users/${id}/permissions`);
      } else {
        const createdRes = await createUser(payload as any);
        navigate(`/users/${createdRes.user.id}/permissions`);
      }
    } catch (err: any) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to save user details");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-card">
        {/* Tabs Layout */}
        <div className="custom-tabs-container">
          <div className="custom-tab active">Basic Details</div>
          <div
            className={`custom-tab ${!isEdit ? 'disabled' : ''}`}
            onClick={() => isEdit && navigate(`/users/${id}/permissions`)}
          >
            Permissions
          </div>
        </div>

        <div className="form-header-row">
          <div className="form-header-left">
            <span className="back-arrow" onClick={() => navigate("/user-list")}>←</span>
            <h3 className="page-title">{isEdit ? "Edit User" : "Create User"}</h3>
          </div>
          <div className="breadcrumb">
            User &gt; <span>{isEdit ? "Edit User" : "Add User"}</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Hidden fields to prevent aggressive browser autofill */}
          <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" />
          <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} aria-hidden="true" autoComplete="new-password" />
          
          {/* Section 1: User Details */}
          <h4 className="form-section-heading">User Details</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                className={fieldErrors.firstName ? "input-error" : ""}
                placeholder="Enter First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              {fieldErrors.firstName && <span className="field-error-msg">{fieldErrors.firstName}</span>}
            </div>

            <div className="form-field">
              <label>
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                className={fieldErrors.lastName ? "input-error" : ""}
                placeholder="Enter Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
              {fieldErrors.lastName && <span className="field-error-msg">{fieldErrors.lastName}</span>}
            </div>

            <div className="form-field">
              <label>
                User Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="username"
                className={fieldErrors.username ? "input-error" : ""}
                placeholder="Enter Username"
                value={formData.username}
                onChange={handleChange}
              />
              {fieldErrors.username && <span className="field-error-msg">{fieldErrors.username}</span>}
            </div>

            <div className="form-field">
              <label>
                Designation <span className="required">*</span>
              </label>
              <input
                type="text"
                name="designation"
                className={fieldErrors.designation ? "input-error" : ""}
                placeholder="Enter Designation"
                value={formData.designation}
                onChange={handleChange}
              />
              {fieldErrors.designation && <span className="field-error-msg">{fieldErrors.designation}</span>}
            </div>

            <div className="form-field">
              <label>
                User Type <span className="required">*</span>
              </label>
              <SelectWithClear
                className={fieldErrors.userType ? "input-error" : ""}
                value={formData.userType}
                placeholder="Select User Type"
                options={[
                  { value: "Admin", label: "Admin" },
                  { value: "Staff", label: "Staff" },
                ]}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, userType: e.target.value }));
                  if (fieldErrors.userType) setFieldErrors((prev) => ({ ...prev, userType: "" }));
                }}
                onClear={() => {
                  setFormData((prev) => ({ ...prev, userType: "" }));
                  if (fieldErrors.userType) setFieldErrors((prev) => ({ ...prev, userType: "" }));
                }}
              />
              {fieldErrors.userType && <span className="field-error-msg">{fieldErrors.userType}</span>}
            </div>

            <div className="form-field">
              <label>
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className={fieldErrors.email ? "input-error" : ""}
                placeholder="Enter Email Address"
                value={formData.email}
                onChange={handleChange}
              />
              {fieldErrors.email && <span className="field-error-msg">{fieldErrors.email}</span>}
            </div>

            <div className="form-field">
              <label>
                Mobile Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="mobileNumber"
                maxLength={10}
                className={fieldErrors.mobileNumber ? "input-error" : ""}
                placeholder="Enter 10-digit Mobile Number"
                value={formData.mobileNumber}
                onChange={handleChange}
                autoComplete="off"
              />
              {fieldErrors.mobileNumber && <span className="field-error-msg">{fieldErrors.mobileNumber}</span>}
            </div>

            {!isEdit && (
              <>
                <div className="form-field pass-field-container">
                  <label>
                    Password <span className="required">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className={fieldErrors.password ? "input-error" : ""}
                      placeholder="Enter Password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <span
                      className="password-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>
                  {fieldErrors.password && <span className="field-error-msg">{fieldErrors.password}</span>}
                </div>

                <div className="form-field pass-field-container">
                  <label>
                    Confirm Password <span className="required">*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      className={fieldErrors.confirmPassword ? "input-error" : ""}
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                    />
                    <span
                      className="password-eye-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                    </span>
                  </div>
                  {fieldErrors.confirmPassword && <span className="field-error-msg">{fieldErrors.confirmPassword}</span>}
                </div>
              </>
            )}
          </div>

          {/* Section 2: Address Details */}
          <h4 className="form-section-heading">Address Details</h4>
          <div className="form-grid">
            <div className="form-field">
              <label>Country</label>
              <SelectWithClear
                value={formData.country}
                placeholder="Select Country"
                options={allCountries.map((c) => ({ value: c.name, label: c.name }))}
                onChange={(e) => {
                  const val = e.target.value;
                  const cObj = allCountries.find((c) => c.name === val || c.isoCode === val);
                  setFormData((prev) => ({
                    ...prev,
                    country: cObj ? cObj.name : val,
                    state: "",
                    city: "",
                  }));
                  setCountryCode(cObj ? cObj.isoCode : "");
                  setStateCode("");
                }}
                onClear={() => {
                  setFormData((prev) => ({ ...prev, country: "", state: "", city: "" }));
                  setCountryCode("");
                  setStateCode("");
                }}
              />
            </div>

            <div className="form-field">
              <label>State</label>
              <SelectWithClear
                value={formData.state}
                disabled={!formData.country || !countryCode}
                placeholder={formData.country && countryCode ? "Select State" : "Select Country First"}
                options={availableStates.map((s) => ({ value: s.name, label: s.name }))}
                onChange={(e) => {
                  const val = e.target.value;
                  const sObj = availableStates.find((s) => s.name === val || s.isoCode === val);
                  setFormData((prev) => ({
                    ...prev,
                    state: sObj ? sObj.name : val,
                    city: "",
                  }));
                  setStateCode(sObj ? sObj.isoCode : "");
                }}
                onClear={() => {
                  setFormData((prev) => ({ ...prev, state: "", city: "" }));
                  setStateCode("");
                }}
              />
            </div>

            <div className="form-field">
              <label>City</label>
              <SelectWithClear
                value={formData.city}
                disabled={!formData.country || !countryCode || !formData.state || !stateCode}
                placeholder={
                  !formData.country || !countryCode
                    ? "Select Country First"
                    : !formData.state || !stateCode
                    ? "Select State First"
                    : "Select City"
                }
                options={availableCities.map((ct) => ({ value: ct.name, label: ct.name }))}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, city: e.target.value }));
                }}
                onClear={() => {
                  setFormData((prev) => ({ ...prev, city: "" }));
                }}
              />
            </div>

            <div className="form-field">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                maxLength={6}
                placeholder="6-digit Pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
              {fieldErrors.pincode && <span className="field-error-msg">{fieldErrors.pincode}</span>}
            </div>

            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label>Address</label>
              <textarea
                name="address"
                rows={3}
                placeholder="Enter Complete Address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-wizard-cancel"
              onClick={() => navigate("/user-list")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-wizard-next" disabled={loading}>
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update & Proceed"
                  : "Create User & Proceed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;