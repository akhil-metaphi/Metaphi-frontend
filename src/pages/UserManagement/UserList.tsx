import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { getUsers, deleteUser, updateUserStatus, type UserItem } from "../../services/api";
import Toast from "../../components/Toast/Toast";
import "./UserList.css";

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("DESC");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter Popover States
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchUserList = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getUsers({ page, limit, search, sortBy, sortOrder, filters });
      setUsers(res.data.users);
      setTotalRecords(res.data.totalRecords);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch users");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserList();
  }, [page, limit, search, sortBy, sortOrder, filters]);

  // Click outside listener for filter popovers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    const handleScroll = (event: Event) => {
      if (popoverRef.current && popoverRef.current.contains(event.target as Node)) {
        return;
      }
      if (activeFilterCol) setActiveFilterCol(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // true for capture phase to catch nested scrolls
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activeFilterCol]);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      try {
        await deleteUser(id);
        fetchUserList();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete user");
      }
    }
  };

  const handleStatusToggle = async (user: UserItem, newChecked: boolean) => {
    // Frontend enforcement for protected user
    if (user.mobile_number === "9876543210") {
      alert("Status of the primary administrator account cannot be changed.");
      return;
    }

    try {
      await updateUserStatus(user.id, newChecked);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newChecked } : u))
      );

      // Auto-logout if a user disables their own account
      if (!newChecked && currentUser && currentUser.id === user.id) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to toggle status");
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      if (sortOrder === "ASC") {
        setSortOrder("DESC");
      } else {
        setSortBy("id");
        setSortOrder("DESC");
      }
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
    setPage(1);
  };

  const handleOpenFilter = (e: React.MouseEvent, column: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverCoords({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX - 24,
    });
    setActiveFilterCol(column);
    const initialVal = filters[column] || "";

    setFilterSearchQuery(initialVal);
    setIsSelectOpen(false);
  };

  const handleApplyFilter = () => {
    setFilters((prev) => {
      const next = { ...prev };
      if (filterSearchQuery.trim() === "") {
        delete next[activeFilterCol!];
      } else {
        next[activeFilterCol!] = filterSearchQuery.trim();
      }
      return next;
    });
    setActiveFilterCol(null);
    setPage(1);
  };

  const handleCancelFilter = () => {
    setActiveFilterCol(null);
  };

  const getUniqueValuesForCol = (colKey: string): string[] => {
    if (colKey === "status") {
      return ["Active", "Inactive"];
    }
    const valuesSet = new Set<string>();
    users.forEach((u: any) => {
      const val = u[colKey];
      if (val !== null && val !== undefined && val !== "") {
        valuesSet.add(String(val));
      }
    });
    return Array.from(valuesSet);
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const formatAuditData = (by: string | number | null | undefined, dateStr: string | null | undefined) => {
    let name = "N/A";
    if (by) {
      const byStr = String(by);
      if (byStr === "1" || byStr.toLowerCase() === "admin") {
        name = "admin";
      } else if (currentUser && String(currentUser.id) === byStr) {
        name = currentUser.username || byStr;
      } else {
        const found = users.find((u) => String(u.id) === byStr);
        if (found && found.username) {
          name = found.username;
        } else if (isNaN(Number(byStr))) {
          name = byStr; // It's likely already a username string
        } else {
          name = "Unknown"; // Fallback to avoid displaying raw numeric ID
        }
      }
    }

    let date = "N/A";
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        date = `${year}-${month}-${day}`;
      }
    }

    if (name === "N/A" && date === "N/A") {
      return "N/A";
    }

    return `${name} - ${date}`;
  };

  const handleExportCSV = () => {
    if (!users.length) return;
    const headers = [
      "Sr. No.",
      "First Name",
      "Last Name",
      "User Name",
      "Designation",
      "User Type",
      "Email",
      "Mobile No",
      "Status",
      "Address",
      "City",
      "State",
      "Country",
      "Pincode",
      "Created By",
      "Created Date",
      "Updated By",
      "Updated Date",
    ];

    const rows = users.map((u) => {
      const srNo = u.id;
      const statusText = u.is_active ? "Active" : "Inactive";
      const createdDate = formatDateTime(u.created_at);
      const updatedDate = formatDateTime(u.updated_at);
      return [
        `"${srNo}"`,
        `"${u.first_name || ""}"`,
        `"${u.last_name || ""}"`,
        `"${u.username || ""}"`,
        `"${u.designation || ""}"`,
        `"${u.user_type || ""}"`,
        `"${u.email || ""}"`,
        `"${u.mobile_number || ""}"`,
        `"${statusText}"`,
        `"${(u.address || "").replace(/"/g, '""')}"`,
        `"${u.city || ""}"`,
        `"${u.state || ""}"`,
        `"${u.country || ""}"`,
        `"${u.pincode || ""}"`,
        `"${u.created_by || "Admin"}"`,
        `"${createdDate}"`,
        `"${u.updated_by || "Admin"}"`,
        `"${updatedDate}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columnsDef = [
    { key: "first_name", label: "First Name", sortable: true, filterable: true },
    { key: "last_name", label: "Last Name", sortable: true, filterable: true },
    { key: "username", label: "User Name", sortable: true, filterable: true },
    { key: "designation", label: "Designation", sortable: true, filterable: true },
    { key: "user_type", label: "User Type", sortable: true, filterable: true },
    { key: "email", label: "Email", sortable: true, filterable: true },
    { key: "mobile_number", label: "Mobile No", sortable: true, filterable: true },
    { key: "status", label: "Status", sortable: true, filterable: true },
    { key: "address", label: "Address", sortable: false, filterable: false },
    { key: "city", label: "City", sortable: true, filterable: true },
    { key: "state", label: "State", sortable: true, filterable: true },
    { key: "country", label: "Country", sortable: true, filterable: true },
    { key: "pincode", label: "Pincode", sortable: true, filterable: true },
    { key: "created_by_date", label: "Created By/Date", sortable: true, filterable: true },
    { key: "updated_by_date", label: "Updated By/Date", sortable: true, filterable: true },
  ];

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header-bar-custom">
          <h3 className="page-title">Users</h3>
          <div className="header-actions">
            <div className="search-box">
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <span className="search-clear-btn" onClick={() => { setSearch(""); setPage(1); }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </span>
              )}
            </div>
            <button className="btn-export" onClick={handleExportCSV}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export
            </button>
            <Link to="/users/create" className="btn-create">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Create User
            </Link>
          </div>
        </div>

        {/* Table controls moved to bottom in original UI */}

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <div className="table-responsive">
          <table className="custom-user-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                {columnsDef.map((col) => {
                  const isSortedCol = sortBy === col.key ||
                    (col.key === "status" && sortBy === "is_active") ||
                    (col.key === "created_by_date" && sortBy === "created_at") ||
                    (col.key === "updated_by_date" && sortBy === "updated_at") ||
                    (col.key === "mobile_number" && sortBy === "mobile_number");

                  const renderSortIcon = () => {
                    if (!col.sortable) return null;
                    if (!isSortedCol) {
                      return <svg className="sort-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg>;
                    }
                    if (sortOrder === "ASC") {
                      return <svg className="sort-icon active-sort" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
                    }
                    return <svg className="sort-icon active-sort" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
                  };

                  return (
                    <th key={col.key}>
                      <div className="th-content">
                        <span
                          className={col.sortable ? "sortable-header-label" : ""}
                          onClick={() => col.sortable && handleSort(col.key)}
                        >
                          {col.label}
                          {renderSortIcon()}
                        </span>

                        {col.filterable && (
                          <span
                            className={`filter-icon ${filters[col.key] ? "active-filter" : ""}`}
                            onClick={(e) => handleOpenFilter(e, col.key)}
                            title="Filter"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v2.59c0 .27-.11.52-.29.71L15 13.41V20c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-6.59L3.29 7.29A1 1 0 0 1 3 6.59V4z" /></svg>
                          </span>
                        )}
                      </div>

                      {/* Filter Popover */}
                      {activeFilterCol === col.key && popoverCoords && createPortal(
                        <div
                          className="filter-popover-card"
                          ref={popoverRef}
                          style={{ top: popoverCoords.top, left: popoverCoords.left }}
                        >
                          <div className="custom-dropdown-container">
                            <div className="custom-dropdown-header">
                              <input
                                type="text"
                                placeholder="Select or type..."
                                value={filterSearchQuery}
                                onChange={(e) => {
                                  setFilterSearchQuery(e.target.value);
                                  if (!isSelectOpen) setIsSelectOpen(true);
                                }}
                                onFocus={() => setIsSelectOpen(true)}
                              />
                              <div className="custom-dropdown-icons">
                                {filterSearchQuery && (
                                  <svg
                                    className="clear-icon"
                                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFilterSearchQuery("");
                                    }}
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                                <svg
                                  className="dropdown-arrow-icon"
                                  width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
                                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                                >
                                  <path d="M7 10l5 5 5-5z" />
                                </svg>
                              </div>
                            </div>

                            {isSelectOpen && (
                              <div className="custom-dropdown-list">
                                <div className="custom-dropdown-options">
                                  {getUniqueValuesForCol(col.key)
                                    .filter(v => v.toLowerCase().includes(filterSearchQuery.toLowerCase()))
                                    .map(val => (
                                      <div
                                        key={val}
                                        className={`custom-dropdown-option ${filterSearchQuery === val ? 'selected' : ''}`}
                                        onClick={() => {
                                          setFilterSearchQuery(val);
                                          setIsSelectOpen(false);
                                        }}
                                      >
                                        {val}
                                      </div>
                                    ))}
                                  {getUniqueValuesForCol(col.key).filter(v => v.toLowerCase().includes(filterSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="custom-dropdown-option no-results">No options found</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="filter-popover-footer">
                            <button className="btn-popover-cancel" onClick={handleCancelFilter}>CANCEL</button>
                            <button className="btn-popover-apply" onClick={handleApplyFilter}>APPLY</button>
                          </div>
                        </div>,
                        document.body
                      )}
                    </th>
                  );
                })}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: "center", padding: "30px", color: "#878a99" }}>
                    Loading Users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: "center", padding: "30px", color: "#878a99" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const srNo = user.id;
                  const isProtectedAdmin = user.mobile_number === "9876543210";

                  return (
                    <tr key={user.id}>
                      <td>{srNo}</td>
                      <td>{user.first_name || "-"}</td>
                      <td>{user.last_name || "-"}</td>
                      <td><strong>{user.username || "-"}</strong></td>
                      <td>{user.designation || "-"}</td>
                      <td>{user.user_type || "-"}</td>
                      <td>{user.email || "-"}</td>
                      <td>{user.mobile_number || "-"}</td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={user.is_active}
                            disabled={isProtectedAdmin}
                            onChange={(e) => handleStatusToggle(user, e.target.checked)}
                          />
                          <span className={`slider round ${isProtectedAdmin ? "disabled" : ""}`}></span>
                        </label>
                      </td>
                      <td className="cell-address" title={user.address || ""}>{user.address || "-"}</td>
                      <td>{user.city || "-"}</td>
                      <td>{user.state || "-"}</td>
                      <td>{user.country || "-"}</td>
                      <td>{user.pincode || "-"}</td>
                      <td>{formatAuditData(user.created_by, user.created_at)}</td>
                      <td>{formatAuditData(user.updated_by, user.updated_at)}</td>
                      <td>
                        <div className="action-buttons-cell">
                          <Link
                            to={`/users/${user.id}/edit`}
                            className="btn-icon-blue"
                            title="Edit User"
                            style={{ marginRight: "6px" }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </Link>
                          <button
                            className="btn-icon-delete"
                            title="Delete User"
                            disabled={isProtectedAdmin}
                            onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination-custom">
          <div>
            Showing {users.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
            {Math.min(page * limit, totalRecords)} of {totalRecords} Results
          </div>

          <div className="pagination-right-controls">
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  className={`page-btn ${pNum === page ? "active" : ""}`}
                  onClick={() => setPage(pNum)}
                >
                  {pNum}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                &gt;
              </button>
            </div>

            <div className="show-records-bottom">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserList;
