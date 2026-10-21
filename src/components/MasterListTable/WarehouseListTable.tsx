import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { fetchWarehouseList, deleteWarehouseItem } from "../../services/api";
import Toast from "../Toast/Toast";
import "./MasterListTable.css";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

interface WarehouseListTableProps<T extends { id: number }> {
  title: string;
  endpoint: string;
  createPath: string;
  editPathPrefix: string;
  columns: ColumnDef<T>[];
  entityName: string;
}

function WarehouseListTable<T extends { id: number }>({
  title,
  endpoint,
  createPath,
  editPathPrefix,
  columns,
  entityName,
}: WarehouseListTableProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortOrder, setSortOrder] = useState<string>("DESC");
  const [filters, setFilters] = useState<Record<string, any>>({});

  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchWarehouseList<T>(endpoint, { page, limit, search });
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
  }, [endpoint, page, limit, search]);

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

  const handleDelete = async (id: number) => {
    if (window.confirm(`Are you sure you want to delete this ${entityName}?`)) {
      try {
        setLoading(true);
        await deleteWarehouseItem(endpoint, id);
        setSuccessMessage(`${entityName} deleted successfully`);
        setTimeout(() => setSuccessMessage(""), 3000);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete item");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      if (sortOrder === "ASC") setSortOrder("DESC");
      else {
        setSortBy("id");
        setSortOrder("DESC");
      }
    } else {
      setSortBy(columnKey);
      setSortOrder("ASC");
    }
    setPage(1);
  };

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
    const valuesSet = new Set<string>();
    items.forEach((u: any) => {
      const val = u[colKey];
      if (val !== null && val !== undefined && val !== "") valuesSet.add(String(val));
    });
    return Array.from(valuesSet);
  };

  // Filter & sort items
  const displayedItems = React.useMemo(() => {
    let result = [...items];

    // Apply column filters
    Object.keys(filters).forEach((key) => {
      const filterVal = String(filters[key]).toLowerCase();
      result = result.filter((item: any) => {
        const itemVal = String(item[key] ?? "").toLowerCase();
        return itemVal.includes(filterVal);
      });
    });

    // Apply sorting
    if (sortBy && sortBy !== "id") {
      result.sort((a: any, b: any) => {
        const valA = a[sortBy] ?? "";
        const valB = b[sortBy] ?? "";
        if (typeof valA === "number" && typeof valB === "number") {
          return sortOrder === "ASC" ? valA - valB : valB - valA;
        }
        return sortOrder === "ASC"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [items, filters, sortBy, sortOrder]);

  const handleExportCSV = () => {
    if (!displayedItems.length) return;
    const headerRow = ["Sr. No.", ...columns.map((c) => `"${c.header}"`)].join(",");
    const dataRows = displayedItems.map((row, idx) => {
      const cols = columns.map((col) => {
        if (col.accessorKey) {
          const val = row[col.accessorKey];
          return `"${val !== undefined && val !== null ? String(val).replace(/"/g, '""') : ""}"`;
        }
        return '""';
      });
      return [(page - 1) * limit + idx + 1, ...cols].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
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
        {/* Header Bar */}
        <div className="page-header-bar-custom">
          <div>
            <h3 className="page-title">{title}</h3>
            <div className="breadcrumb" style={{ fontSize: "12px", color: "#878a99", marginTop: "4px" }}>
              Warehouse &gt; <span style={{ color: "#495057", fontWeight: 500 }}>{title}</span>
            </div>
          </div>

          <div className="header-actions">
            {/* Search Box */}
            <div className="search-box">
              <svg
                className="search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
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
                <span
                  className="search-clear-btn"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  title="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
              )}
            </div>

            {/* Export Button */}
            <button className="btn-export" onClick={handleExportCSV}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export
            </button>

            {/* Create Button */}
            <Link to={createPath} className="btn-create">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Add {entityName}
            </Link>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}
        {successMessage && (
          <Toast message={successMessage} type="success" duration={3000} onClose={() => setSuccessMessage("")} />
        )}

        {/* Table Container */}
        <div className="table-responsive">
          <table className="custom-user-table">
            <thead>
              <tr>
                <th style={{ width: "65px" }}>Sr. No.</th>
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
                <th style={{ width: "75px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "28px", color: "#6b7280" }}>
                    Loading {title}...
                  </td>
                </tr>
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "36px", color: "#878a99" }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                displayedItems.map((row, idx) => (
                  <tr key={row.id}>
                    <td>{(page - 1) * limit + idx + 1}</td>
                    {columns.map((col, cIdx) => (
                      <td key={cIdx}>
                        {col.cell
                          ? col.cell(row, idx)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? "")
                          : ""}
                      </td>
                    ))}
                    <td>
                      <div className="action-buttons-cell">
                        <Link
                          to={`${editPathPrefix}/${row.id}`}
                          className="btn-icon-blue"
                          title={`Edit ${entityName}`}
                          style={{ marginRight: "6px" }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </Link>
                        <button
                          type="button"
                          className="btn-icon-delete"
                          title={`Delete ${entityName}`}
                          onClick={() => handleDelete(row.id)}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination-custom">
          <div>
            Showing {displayedItems.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
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

export default WarehouseListTable;
