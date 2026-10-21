import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMasterById } from "../../services/api";
import "../UserManagement/UserForm.css";

interface CustomerData {
  id: number;
  customer_name: string;
  company_name: string;
  customer_type: string;
  email: string;
  mobile_number: string;
  aadhaar_no: string;
  gstin: string;
  contact_person: string;
  contact_person_mobile: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

const CustomerDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchMasterById<CustomerData>("customers", id)
        .then((res) => {
          setCustomer(res.data);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="page-container"><div className="form-card">Loading Customer Details...</div></div>;
  if (error || !customer) return <div className="page-container"><div className="form-card">Error: {error || "Customer not found"}</div></div>;

  return (
    <div className="page-container">
      <div className="form-card" style={{ padding: "32px" }}>
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/customer-list")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title" style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Customer Details</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Customer &gt; <span>Customer Details</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "14px", color: "#374151" }}>
          {/* Top Main Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div><strong>Customer Name : </strong>{customer.customer_name || "-"}</div>
            <div><strong>Cutomer Type : </strong>{customer.customer_type || "-"}</div>
            <div><strong>Aadhar No. : </strong>{customer.aadhaar_no || "-"}</div>
            <div><strong>GSTIN : </strong>{customer.gstin || "-"}</div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />

          {/* Contact Details */}
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Contact Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div><strong>Email ID: </strong>{customer.email || "-"}</div>
              <div><strong>Phone Number: </strong>{customer.mobile_number || "-"}</div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />

          {/* Contact Person Details */}
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Contact Person Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div><strong>Contact Person Name : </strong>{customer.contact_person || "-"}</div>
              <div><strong>Phone Number: </strong>{customer.contact_person_mobile || "-"}</div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "8px 0" }} />

          {/* Customer Address Details */}
          <div>
            <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>Customer Address Details</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "12px" }}>
              <div><strong>Address: </strong>{customer.address || "-"}</div>
              <div><strong>City: </strong>{customer.city || "-"}</div>
              <div><strong>State: </strong>{customer.state || "-"}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              <div><strong>Country: </strong>{customer.country || "India"}</div>
              <div><strong>Pin Code: </strong>{customer.pincode || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
