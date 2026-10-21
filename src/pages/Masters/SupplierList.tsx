import React, { useState } from "react";
import MasterListTable, { type ColumnDef, formatAuditData } from "../../components/MasterListTable/MasterListTable";
import { fetchMasterById } from "../../services/api";

interface Supplier {
  id: number;
  supplier_name: string;
  company_name?: string;
  supplier_type?: string;
  supplier_code?: string;
  email: string;
  mobile_number: string;
  contact_person: string;
  contact_person_mobile: string;
  address: string;
  state: string;
  city: string;
  country: string;
  pincode: string;
  aadhaar_no?: string;
  gst_no?: string;
  gstin?: string;
  status: string;
  remarks?: string;
  transporter_name_1?: string;
  contact_person_name_1?: string;
  contact_person_mobile_1?: string;
  transporter_name_2?: string;
  contact_person_name_2?: string;
  contact_person_mobile_2?: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

const formatPhone = (phone?: string) => {
  if (!phone || !phone.trim()) return "-";
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return trimmed;
  return `+91-${trimmed}`;
};

const SupplierList: React.FC = () => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const currentUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  }, []);

  const handleDetailsClick = (row: Supplier) => {
    setSelectedSupplier(row);
    if (row.id) {
      fetchMasterById<Supplier>("suppliers", String(row.id))
        .then((res) => {
          if (res.data) setSelectedSupplier(res.data);
        })
        .catch(() => {});
    }
  };

  const columns: ColumnDef<Supplier>[] = [
    { header: "Supplier Name", accessorKey: "supplier_name", sortable: true, filterable: true },
    { header: "Supplier Code", accessorKey: "supplier_code", sortable: true, filterable: true },
    { header: "Email", accessorKey: "email", sortable: true, filterable: true },
    { header: "Contact No.", accessorKey: "mobile_number", sortable: true, filterable: true },
    { header: "GST No.", accessorKey: "gst_no", sortable: true, filterable: true },
    { header: "Address", accessorKey: "address", sortable: false, filterable: true },
    { header: "City", accessorKey: "city", sortable: true, filterable: true },
    { header: "State", accessorKey: "state", sortable: true, filterable: true },
    { header: "Pincode", accessorKey: "pincode", sortable: true, filterable: true },
    { header: "Contact Person Name", accessorKey: "contact_person", sortable: true, filterable: true },
    { header: "Contact Person Phone No.", accessorKey: "contact_person_mobile", sortable: true, filterable: true },
    { header: "Status", accessorKey: "status", sortable: false, filterable: false, isStatusToggle: true },
    {
      header: "Created By/Date", sortable: true, filterable: true,
      cell: (row) => formatAuditData(row.created_by, row.created_at, currentUser)
    },
    {
      header: "Updated By/Date", sortable: true, filterable: true,
      cell: (row) => formatAuditData(row.updated_by, row.updated_at, currentUser)
    },
  ];

  return (
    <>
      <MasterListTable<Supplier>
        title="Supplier"
        endpoint="suppliers"
        createPath="/add-supplier"
        editPathPrefix="/edit-supplier"
        onDetailsClick={handleDetailsClick}
        columns={columns}
        entityName="Supplier"
      />

      {selectedSupplier && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedSupplier(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "20px"
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              width: "850px",
              maxWidth: "95vw",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e5e7eb",
                padding: "20px 32px",
                backgroundColor: "#ffffff"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>Supplier Information</h3>
              <button
                onClick={() => setSelectedSupplier(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div style={{ padding: "24px 32px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "20px", fontSize: "14px", color: "#374151" }}>
              {/* Supplier Information */}
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#111827" }}>Supplier Information</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
                  <div><strong>Supplier Name: </strong>{selectedSupplier.supplier_name || "-"}</div>
                  <div><strong>Supplier Code: </strong>{selectedSupplier.supplier_code || "-"}</div>
                  <div><strong>GSTIN: </strong>{selectedSupplier.gstin || selectedSupplier.gst_no || "-"}</div>
                  {selectedSupplier.company_name && <div><strong>Company Name: </strong>{selectedSupplier.company_name}</div>}
                  {selectedSupplier.supplier_type && <div><strong>Supplier Type: </strong>{selectedSupplier.supplier_type}</div>}
                  {selectedSupplier.aadhaar_no && <div><strong>Aadhaar No: </strong>{selectedSupplier.aadhaar_no}</div>}
                </div>
              </div>

              {/* Contact Details */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#111827" }}>Contact Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
                  <div><strong>Email: </strong>{selectedSupplier.email || "-"}</div>
                  <div><strong>Phone Number: </strong>{formatPhone(selectedSupplier.mobile_number)}</div>
                  <div><strong>Address: </strong>{selectedSupplier.address || "-"}</div>
                  <div><strong>City: </strong>{selectedSupplier.city || "-"}</div>
                  <div><strong>State: </strong>{selectedSupplier.state || "-"}</div>
                  <div><strong>Pincode: </strong>{selectedSupplier.pincode || "-"}</div>
                  <div><strong>Country: </strong>{selectedSupplier.country || "India"}</div>
                </div>
              </div>

              {/* Contact Person */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#111827" }}>Contact Person</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
                  <div><strong>Contact Person Name: </strong>{selectedSupplier.contact_person || "-"}</div>
                  <div><strong>Phone No: </strong>{formatPhone(selectedSupplier.contact_person_mobile)}</div>
                </div>
              </div>

              {/* Transporter Details */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#111827" }}>Transporter Details</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px", marginBottom: "12px" }}>
                  <div><strong>Transporter Name 1: </strong>{selectedSupplier.transporter_name_1 || "-"}</div>
                  <div><strong>Contact Person Name: </strong>{selectedSupplier.contact_person_name_1 || "-"}</div>
                  <div><strong>Phone No: </strong>{formatPhone(selectedSupplier.contact_person_mobile_1)}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px 24px" }}>
                  <div><strong>Transporter Name 2: </strong>{selectedSupplier.transporter_name_2 || "-"}</div>
                  <div><strong>Contact Person Name: </strong>{selectedSupplier.contact_person_name_2 || "-"}</div>
                  <div><strong>Phone No: </strong>{formatPhone(selectedSupplier.contact_person_mobile_2)}</div>
                </div>
              </div>

              {selectedSupplier.remarks && (
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "#111827" }}>Remarks</h4>
                  <div>{selectedSupplier.remarks}</div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 32px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "center", backgroundColor: "#ffffff" }}>
              <button
                type="button"
                className="btn-wizard-cancel"
                onClick={() => setSelectedSupplier(null)}
                style={{ padding: "8px 28px" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupplierList;
