import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMasterList, updateMasterItem, deleteMasterItem } from "../../services/api";
import Toast from "../Toast/Toast";
import "./MasterListTable.css";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  isStatusToggle?: boolean;
}


interface MasterListTableProps<T extends { id: number }> {
  title: string;
  endpoint: string;
  createPath: string;
  editPathPrefix: string;
  detailsPathPrefix?: string;
  configurePathPrefix?: string;
  onDetailsClick?: (row: T) => void;
  columns: ColumnDef<T>[];
  entityName: string;
}

export function formatAuditData(by: string | number | null | undefined, dateStr: string | null | undefined, currentUser: any) {
  let name = "N/A";
  if (by) {
    const byStr = String(by);
    if (byStr === "1" || byStr.toLowerCase() === "admin") {
      name = "admin";
    } else if (currentUser && String(currentUser.id) === byStr) {
      name = currentUser.username || byStr;
    } else if (isNaN(Number(byStr))) {
      name = byStr;
    } else {
      name = "System"; // Since we can't reliably look up other numeric IDs without a backend join
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

  if (name === "N/A" && date === "N/A") return "N/A";
  return `${name} - ${date}`;
}

export function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function MasterListTable<T extends { id: number }>({
  title,
  endpoint,
  createPath,
  editPathPrefix,
  detailsPathPrefix,
  configurePathPrefix,
  onDetailsClick,
  columns,
  entityName,
}: MasterListTableProps<T>) {
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);


  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sorting and Filtering (Client side fallbacks if API doesn't support them, but mostly visual)
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("DESC");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.toastMessage) {
      setSuccessMessage(location.state.toastMessage);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchMasterList<T>(endpoint, { page, limit, search, sortBy, sortOrder });
      setItems(res.data.items);
      setTotalRecords(res.data.totalRecords);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${title}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [endpoint, page, limit, search, sortBy, sortOrder, filters]);

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
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [activeFilterCol]);

  const handleStatusToggle = async (row: T, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

      // Optimistic UI update
      setItems(prev => prev.map(item => item.id === row.id ? { ...item, status: newStatus } : item));

      // API call
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      await updateMasterItem(endpoint, row.id, {
        ...row,
        status: newStatus,
        updatedBy: currentUser?.id
      });
      setSuccessMessage(`${entityName} status updated successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      // Revert on error
      setItems(prev => prev.map(item => item.id === row.id ? { ...item, status: currentStatus } : item));
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDelete = async (row: T) => {
    if (!window.confirm(`Are you sure you want to delete this ${entityName}?`)) return;
    try {
      setLoading(true);
      setError("");
      await deleteMasterItem(endpoint, row.id);
      setSuccessMessage(`${entityName} deleted successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${entityName}`);
    } finally {
      setLoading(false);
      setActiveActionMenuId(null);
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      if (sortOrder === "ASC") setSortOrder("DESC");
      else { setSortBy("id"); setSortOrder("DESC"); }
    } else {
      setSortBy(columnKey);
      setSortOrder("ASC");
    }
    setPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    if (activeFilterCol) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeFilterCol]);

  const handleOpenFilter = (e: React.MouseEvent, columnKey: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const popupWidth = 240;
    let leftPos = rect.left - 20;
    if (leftPos + popupWidth > window.innerWidth) {
      leftPos = Math.max(10, window.innerWidth - popupWidth - 16);
    }
    setPopoverCoords({
      top: rect.bottom + 6,
      left: Math.max(10, leftPos),
    });
    setActiveFilterCol(columnKey);
    const initialVal = filters[columnKey] || "";

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

  const getUniqueValuesForCol = (colKey: string): string[] => {
    if (colKey === "status" || colKey === "is_active") return ["Active", "Inactive"];
    const valuesSet = new Set<string>();
    items.forEach((u: any) => {
      const val = u[colKey];
      if (val !== null && val !== undefined && val !== "") valuesSet.add(String(val));
    });
    return Array.from(valuesSet);
  };

  const handleExportCSV = () => {
    if (!items.length) return;
    const headerRow = columns.map((c) => `"${c.header}"`).join(",");
    const dataRows = items.map((row) =>
      columns
        .map((col) => {
          if (col.accessorKey) {
            const val = row[col.accessorKey];
            return `"${val !== undefined && val !== null ? String(val).replace(/"/g, '""') : ""}"`;
          }
          return '""';
        })
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headerRow, ...dataRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${endpoint}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <div className="page-card">
        <div className="page-header-bar-custom">
          <h3 className="page-title">{title}</h3>
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
            <Link to={createPath} className="btn-create">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Add {entityName}
            </Link>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}
        {successMessage && (
          <Toast message={successMessage} type="success" duration={3000} onClose={() => setSuccessMessage("")} />
        )}

        <div className="table-responsive">
          <table className="custom-user-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                {columns.map((col, idx) => {
                  const colKey = String(col.accessorKey || idx);
                  const isSortedCol = sortBy === colKey;

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
                    <th key={idx}>
                      <div className="th-content">
                        <span
                          className={col.sortable ? "sortable-header-label" : ""}
                          onClick={() => col.sortable && handleSort(colKey)}
                        >
                          {col.header}
                          {renderSortIcon()}
                        </span>

                        {col.filterable && (
                          <span
                            className={`filter-icon ${filters[colKey] ? "active-filter" : ""}`}
                            onClick={(e) => handleOpenFilter(e, colKey)}
                            title="Filter"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v2.59c0 .27-.11.52-.29.71L15 13.41V20c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-6.59L3.29 7.29A1 1 0 0 1 3 6.59V4z" /></svg>
                          </span>
                        )}
                      </div>

                      {/* Filter Popover */}
                      {activeFilterCol === colKey && popoverCoords && createPortal(
                        <div
                          className="filter-popover-card"
                          ref={popoverRef}
                          style={{ position: "fixed", top: `${popoverCoords.top}px`, left: `${popoverCoords.left}px`, zIndex: 99999 }}
                          onClick={(e) => e.stopPropagation()}
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
                                  {getUniqueValuesForCol(colKey)
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
                                  {getUniqueValuesForCol(colKey).filter(v => v.toLowerCase().includes(filterSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="custom-dropdown-option no-results">No options found</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="filter-popover-footer">
                            <button className="btn-popover-cancel" onClick={() => setActiveFilterCol(null)}>CANCEL</button>
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
                  <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "30px", color: "#878a99" }}>
                    Loading {title}...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "30px", color: "#878a99" }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{(row as any).sr_no !== undefined && (row as any).sr_no !== null ? (row as any).sr_no : (page - 1) * limit + idx + 1}</td>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx}>
                        {col.cell
                          ? col.cell(row, idx)
                          : col.isStatusToggle
                            ? (
                              <label className="switch">
                                <input
                                  type="checkbox"
                                  checked={row[col.accessorKey as keyof T] === "Active" || row[col.accessorKey as keyof T] === true}
                                  onChange={() => handleStatusToggle(row, String(row[col.accessorKey as keyof T]))}
                                />
                                <span className="slider round"></span>
                              </label>
                            )
                            : col.accessorKey
                              ? String(row[col.accessorKey] ?? "-")
                              : "-"}
                      </td>
                    ))}
                    <td style={{ zIndex: activeActionMenuId === row.id ? 99999 : undefined }}>
                      <div className="action-buttons-cell" style={{ position: "relative" }}>
                        {(detailsPathPrefix || configurePathPrefix || onDetailsClick) ? (
                          <>
                            <button
                              type="button"
                              className="btn-icon-more"
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "16px",
                                cursor: "pointer",
                                color: "#4b5563",
                                padding: "4px 8px"
                              }}
                              onClick={() => setActiveActionMenuId(activeActionMenuId === row.id ? null : row.id)}
                            >
                              ⋮
                            </button>
                            {activeActionMenuId === row.id && (
                              <div
                                className="action-menu-dropdown"
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: (idx > 0 && idx >= items.length - 2) ? "auto" : "100%",
                                  bottom: (idx > 0 && idx >= items.length - 2) ? "100%" : "auto",
                                  marginTop: (idx > 0 && idx >= items.length - 2) ? 0 : "4px",
                                  marginBottom: (idx > 0 && idx >= items.length - 2) ? "4px" : 0,
                                  backgroundColor: "#ffffff",
                                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.18)",
                                  borderRadius: "6px",
                                  padding: "6px 0",
                                  zIndex: 99999,
                                  minWidth: "110px",
                                  border: "1px solid #e5e7eb"
                                }}
                              >
                                <Link
                                  to={`${editPathPrefix}/${row.id}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 14px",
                                    fontSize: "13px",
                                    color: "#374151",
                                    textDecoration: "none"
                                  }}
                                  onClick={() => setActiveActionMenuId(null)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                  Edit
                                </Link>

                                {configurePathPrefix && (
                                  <Link
                                    to={`${configurePathPrefix}/${row.id}`}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      padding: "8px 14px",
                                      fontSize: "13px",
                                      color: "#374151",
                                      textDecoration: "none"
                                    }}
                                    onClick={() => setActiveActionMenuId(null)}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                                    Configure
                                  </Link>
                                )}

                                {onDetailsClick ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      padding: "8px 14px",
                                      fontSize: "13px",
                                      color: "#374151",
                                      cursor: "pointer"
                                    }}
                                    onClick={() => {
                                      onDetailsClick(row);
                                      setActiveActionMenuId(null);
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    Details
                                  </div>
                                ) : detailsPathPrefix ? (
                                  <Link
                                    to={`${detailsPathPrefix}/${row.id}`}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      padding: "8px 14px",
                                      fontSize: "13px",
                                      color: "#374151",
                                      textDecoration: "none"
                                    }}
                                    onClick={() => setActiveActionMenuId(null)}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    Details
                                  </Link>
                                ) : null}

                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "8px 14px",
                                    fontSize: "13px",
                                    color: "#ef4444",
                                    cursor: "pointer"
                                  }}
                                  onClick={() => handleDelete(row)}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  Delete
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            to={`${editPathPrefix}/${row.id}`}
                            className="btn-icon-blue"
                            title="Edit"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination-custom">
          <div>
            Showing {items.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
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
}

export default MasterListTable;
