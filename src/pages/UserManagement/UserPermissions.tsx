import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserPermissions, saveUserPermissions, getUserById } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import "./UserPermissions.css";

const MODULES_SCHEMA: Record<string, string[]> = {
  "Dashboard": ["Dashboard"],
  "Inventory": ["In Stock", "Reorder Level"],
  "Masters": [
    "Item", "Category", "Sub Category", "Unit", "GST", "HSN Code",
    "Customer", "Suppliers", "Warehouse", "Labour"
  ],
  "Order": ["Enquiry", "Quotation", "Site Visit", "Order"],
  "User Management": ["Users"],
  "Warehouse": ["Warehouse Overview", "Item Inward", "Dispatch"],
};

const ACTIONS = ["Create", "Read", "Update", "Delete", "Export"];

const UserPermissions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3500);
  };

  const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, boolean>>>>({});

  // Accordion state - default open Dashboard and Masters
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Dashboard": true,
    "Masters": true,
  });

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError("");

      Promise.all([getUserById(id), getUserPermissions(id)])
        .then(([userRes, permRes]) => {
          setUserName(`${userRes.user.first_name} ${userRes.user.last_name}`);
          // Merge fetched permissions with our blank schema to ensure all keys exist
          let rawPerms = permRes.permissions;
          if (typeof rawPerms === 'string') {
            try {
              rawPerms = JSON.parse(rawPerms);
            } catch (e) {
              rawPerms = {};
            }
          }
          const merged = initializePermissionsSchema(rawPerms);
          setPermissions(merged);
        })
        .catch((err) => {
          setError(err.message || "Failed to load permissions");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const initializePermissionsSchema = (fetched: any) => {
    const schema: any = {};
    Object.keys(MODULES_SCHEMA).forEach((mod) => {
      schema[mod] = {};
      MODULES_SCHEMA[mod].forEach((sub) => {
        schema[mod][sub] = {};
        ACTIONS.forEach((act) => {
          const val = fetched?.[mod]?.[sub]?.[act];
          schema[mod][sub][act] = val === undefined ? false : Boolean(val);
        });
      });
    });
    return schema;
  };

  // State derivations
  const isSubmoduleAllChecked = (moduleName: string, subModuleName: string) => {
    const subData = permissions[moduleName]?.[subModuleName] || {};
    return ACTIONS.every((act) => Boolean(subData[act]));
  };

  const isModuleAllChecked = (moduleName: string) => {
    const subs = MODULES_SCHEMA[moduleName];
    return subs.every((sub) => isSubmoduleAllChecked(moduleName, sub));
  };

  const isGlobalAllChecked = () => {
    return Object.keys(MODULES_SCHEMA).every((mod) => isModuleAllChecked(mod));
  };

  // Handlers
  const handleToggleAction = (moduleName: string, subModuleName: string, action: string) => {
    setPermissions((prev) => {
      const next = { ...prev };
      next[moduleName] = { ...(next[moduleName] || {}) };
      next[moduleName][subModuleName] = { ...(next[moduleName][subModuleName] || {}) };
      next[moduleName][subModuleName][action] = !next[moduleName][subModuleName][action];
      return next;
    });
  };

  const handleToggleSubmoduleAll = (moduleName: string, subModuleName: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      next[moduleName] = { ...(next[moduleName] || {}) };
      next[moduleName][subModuleName] = { ...(next[moduleName][subModuleName] || {}) };
      ACTIONS.forEach((act) => {
        next[moduleName][subModuleName][act] = checked;
      });
      return next;
    });
  };

  const handleToggleModuleAll = (moduleName: string, checked: boolean) => {
    setPermissions((prev) => {
      const next = { ...prev };
      next[moduleName] = { ...(next[moduleName] || {}) };
      MODULES_SCHEMA[moduleName].forEach((sub) => {
        next[moduleName][sub] = { ...(next[moduleName][sub] || {}) };
        ACTIONS.forEach((act) => {
          next[moduleName][sub][act] = checked;
        });
      });
      return next;
    });
  };

  const handleToggleGlobalAll = (checked: boolean) => {
    const next: any = {};
    Object.keys(MODULES_SCHEMA).forEach((mod) => {
      next[mod] = {};
      MODULES_SCHEMA[mod].forEach((sub) => {
        next[mod][sub] = {};
        ACTIONS.forEach((act) => {
          next[mod][sub][act] = checked;
        });
      });
    });
    setPermissions(next);
  };

  const toggleSection = (moduleName: string) => {
    setOpenSections((prev) => ({ ...prev, [moduleName]: !prev[moduleName] }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await saveUserPermissions(id, permissions);
      setSuccess("Permissions updated successfully!");
      showToast("Permissions saved successfully");
      // Automatically redirect to user list after short delay
      setTimeout(() => {
        navigate("/user-list");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="permissions-loading">
        <div className="loading-spinner"></div>
        <span>Loading permissions for user...</span>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="toast-notification">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="12" fill="#0ab39c" />
            <path d="M8 12l2.5 2.5L16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast({ message: "", visible: false })}>×</button>
          <div className="toast-progress" />
        </div>
      )}
      <div className="page-card">
        {/* Tabs Layout */}
        <div className="custom-tabs-container">
          <div className="custom-tab" onClick={() => navigate(`/users/${id}/edit`)}>
            Basic Details
          </div>
          <div className="custom-tab active">
            Permissions
          </div>
        </div>

        <div className="permissions-header-row">
          <h3 className="permissions-main-title">{userName ? `Permissions for ${userName}` : "Permissions"}</h3>
        </div>

        <div className="permissions-global-check">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={isGlobalAllChecked()}
              onChange={(e) => handleToggleGlobalAll(e.target.checked)}
            />
            <span className="checkmark"></span>
          </label>
          <span className="global-check-label">All Permissions</span>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}
        {success && (
          <Toast message={success} type="success" duration={3000} onClose={() => setSuccess("")} />
        )}

        <div className="accordion-wrapper">
          {Object.keys(MODULES_SCHEMA).map((moduleName) => {
            const isOpen = Boolean(openSections[moduleName]);
            const isModChecked = isModuleAllChecked(moduleName);

            return (
              <div className="accordion-section" key={moduleName}>
                {/* Section Header */}
                <div
                  className={`accordion-header ${isOpen ? "open" : ""}`}
                  onClick={() => toggleSection(moduleName)}
                >
                  <div className="accordion-header-left" onClick={(e) => e.stopPropagation()}>
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={isModChecked}
                        onChange={(e) => handleToggleModuleAll(moduleName, e.target.checked)}
                      />
                      <span className="checkmark"></span>
                    </label>
                    <span className="module-title">{moduleName}</span>
                  </div>
                  <span className="accordion-arrow">{isOpen ? "▲" : "▼"}</span>
                </div>

                {/* Section Body */}
                {isOpen && (
                  <div className="accordion-body">
                    <table className="permissions-table">
                      <thead>
                        <tr>
                          <th>Sub Module</th>
                          <th>All Actions</th>
                          <th>Create</th>
                          <th>Read</th>
                          <th>Update</th>
                          <th>Delete</th>
                          <th>Export</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODULES_SCHEMA[moduleName].map((subName) => {
                          const isSubAll = isSubmoduleAllChecked(moduleName, subName);

                          return (
                            <tr key={subName}>
                              <td className="submodule-name-cell">{subName}</td>
                              <td>
                                <label className="checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={isSubAll}
                                    onChange={(e) => handleToggleSubmoduleAll(moduleName, subName, e.target.checked)}
                                  />
                                  <span className="checkmark"></span>
                                </label>
                              </td>
                              {ACTIONS.map((act) => {
                                const isActChecked = Boolean(permissions[moduleName]?.[subName]?.[act]);
                                return (
                                  <td key={act}>
                                    <label className="checkbox-container">
                                      <input
                                        type="checkbox"
                                        checked={isActChecked}
                                        onChange={() => handleToggleAction(moduleName, subName, act)}
                                      />
                                      <span className="checkmark"></span>
                                    </label>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="permissions-actions">
          <button
            type="button"
            className="btn-wizard-cancel"
            onClick={() => navigate("/user-list")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-wizard-save"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPermissions;
