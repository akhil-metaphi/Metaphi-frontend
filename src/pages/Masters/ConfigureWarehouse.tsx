import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUsers, getWarehouseUsers, assignUserToWarehouse, removeUserFromWarehouse, type WarehouseAssignedUser, type UserItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import SelectWithClear from "../../components/SelectWithClear/SelectWithClear";
import "../UserManagement/UserForm.css";

const ConfigureWarehouse: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [availableUsers, setAvailableUsers] = useState<UserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignedUsers, setAssignedUsers] = useState<WarehouseAssignedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [toastSuccess, setToastSuccess] = useState("");

  const loadUsersAndAssignments = async () => {
    if (!id) return;
    setFetching(true);
    try {
      const [usersRes, assignedRes] = await Promise.all([
        getUsers({ limit: 1000 }),
        getWarehouseUsers(id)
      ]);

      if (usersRes.data && usersRes.data.users) {
        setAvailableUsers(usersRes.data.users.filter(u => u.is_active !== false));
      }
      if (assignedRes.data) {
        setAssignedUsers(assignedRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load warehouse configurations");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadUsersAndAssignments();
  }, [id]);

  const getUserDisplayName = (u: { first_name?: string; last_name?: string; username?: string }) => {
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
    if (fullName && u.username) {
      return `${fullName} (${u.username})`;
    }
    return fullName || u.username || "User";
  };

  const handleAddUser = async () => {
    if (!selectedUserId) {
      setError("Please select a user to assign");
      return;
    }

    if (!id) return;

    // Check duplicate assignment
    const isAlreadyAssigned = assignedUsers.some((u) => String(u.user_id) === String(selectedUserId));
    if (isAlreadyAssigned) {
      setError("User is already assigned to this warehouse");
      return;
    }

    try {
      setLoading(true);
      await assignUserToWarehouse(id, selectedUserId);
      setToastSuccess("User configuration added successfully");
      setSelectedUserId("");

      // Refresh assigned users list
      const updated = await getWarehouseUsers(id);
      if (updated.data) setAssignedUsers(updated.data);
    } catch (err: any) {
      setError(err.message || "Failed to assign user to warehouse");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!id) return;

    try {
      setLoading(true);
      await removeUserFromWarehouse(id, userId);
      setToastSuccess("User configuration deleted successfully");
      setAssignedUsers(assignedUsers.filter((u) => Number(u.user_id) !== Number(userId)));
    } catch (err: any) {
      setError(err.message || "Failed to remove user assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-card" style={{ padding: "32px" }}>
        {/* Header */}
        <div className="form-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div className="form-header-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="back-arrow" onClick={() => navigate("/warehouse-list")} style={{ cursor: "pointer", fontSize: "18px", fontWeight: "bold" }}>←</span>
            <h3 className="page-title" style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#111827" }}>Configure Warehouse</h3>
          </div>
          <div className="breadcrumb" style={{ fontSize: "13px", color: "#878a99" }}>
            Warehouse &gt; <span style={{ color: "#495057" }}>Configure Warehouse</span>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}
        {toastSuccess && (
          <Toast message={toastSuccess} type="success" duration={3000} onClose={() => setToastSuccess("")} />
        )}

        <div style={{ padding: "0 4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "32px", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f8", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "14px 20px", fontWeight: 700, color: "#495057", width: "120px" }}>Sr No.</th>
                <th style={{ textAlign: "left", padding: "14px 20px", fontWeight: 700, color: "#495057" }}>User</th>
                <th style={{ textAlign: "right", padding: "14px 20px", fontWeight: 700, color: "#495057", width: "140px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Add User Control Row */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "14px 20px" }}></td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ maxWidth: "520px" }}>
                    <SelectWithClear
                      value={selectedUserId}
                      disabled={fetching || loading}
                      placeholder="Select user"
                      options={availableUsers.map((u) => ({ value: u.id, label: getUserDisplayName(u) }))}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      onClear={() => setSelectedUserId("")}
                    />
                  </div>
                </td>
                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={handleAddUser}
                    style={{
                      backgroundColor: "#405189",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "9px 32px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: loading || fetching ? "not-allowed" : "pointer",
                      opacity: loading || fetching ? 0.7 : 1
                    }}
                    disabled={loading || fetching}
                  >
                    {loading ? "Adding..." : "Add"}
                  </button>
                </td>
              </tr>

              {/* Assigned Users List */}
              {fetching ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                    Loading user assignments...
                  </td>
                </tr>
              ) : assignedUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "36px", color: "#878a99", fontSize: "14px" }}>
                    No configurations found
                  </td>
                </tr>
              ) : (
                assignedUsers.map((user, idx) => (
                  <tr key={user.assignment_id || user.user_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "16px 20px", color: "#374151", fontSize: "14px" }}>{idx + 1}</td>
                    <td style={{ padding: "16px 20px", color: "#374151", fontSize: "14px" }}>{getUserDisplayName(user)}</td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user.user_id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#ef4444",
                          padding: "4px 8px",
                          borderRadius: "4px"
                        }}
                        title="Remove User"
                        disabled={loading}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Bottom Cancel Button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "36px", paddingBottom: "8px" }}>
            <button
              type="button"
              onClick={() => navigate("/warehouse-list")}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
                color: "#374151",
                borderRadius: "6px",
                padding: "8px 32px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigureWarehouse;
