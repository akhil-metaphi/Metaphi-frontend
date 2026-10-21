import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { fetchWarehouseOverview, fetchWarehouseStock, fetchMasterList } from "../../services/api";
import WarehouseEmptyState from "./WarehouseEmptyState";
import "./Warehouse.css";
import "../../components/MasterListTable/MasterListTable.css";

const WarehouseOverview: React.FC = () => {
  const [stockData, setStockData] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"dailyLog" | "inStock">("inStock");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<string>("item_name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Filter Popover
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
  const [filterSearchQuery, setFilterSearchQuery] = useState<string>("");
  const [isSelectOpen, setIsSelectOpen] = useState<boolean>(false);
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        await fetchWarehouseOverview();
        const whRes = await fetchMasterList("warehouses", { limit: 100 });
        setWarehouses(whRes.data.items);
      } catch (err) {
        console.error("Failed to fetch warehouse overview", err);
      }
    };
    loadOverview();
  }, []);

  useEffect(() => {
    const loadStock = async () => {
      setLoading(true);
      try {
        const res = await fetchWarehouseStock(selectedWarehouse || undefined);
        if (res.success) {
          setStockData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch stock", err);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === "inStock") {
      loadStock();
    }
  }, [activeTab, selectedWarehouse]);

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

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
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
    setFilterSearchQuery(filters[columnKey] || "");
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
    stockData.forEach((u: any) => {
      const val = u[colKey];
      if (val !== null && val !== undefined && val !== "") valuesSet.add(String(val));
    });
    return Array.from(valuesSet);
  };

  const filteredAndSortedStock = useMemo(() => {
    let result = [...stockData];

    // Global Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          (i.item_name && i.item_name.toLowerCase().includes(q)) ||
          (i.item_code && i.item_code.toLowerCase().includes(q)) ||
          (i.category_name && i.category_name.toLowerCase().includes(q)) ||
          (i.sub_category_name && i.sub_category_name.toLowerCase().includes(q))
      );
    }

    // Column Filters
    Object.keys(filters).forEach((key) => {
      const filterVal = filters[key].toLowerCase();
      result = result.filter((item: any) => {
        const val = String(item[key] ?? "").toLowerCase();
        return val.includes(filterVal);
      });
    });

    // Sorting
    if (sortBy) {
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
  }, [stockData, search, filters, sortBy, sortOrder]);

  const totalRecords = filteredAndSortedStock.length;
  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const paginatedStock = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAndSortedStock.slice(start, start + limit);
  }, [filteredAndSortedStock, page, limit]);

  const handleExportCSV = () => {
    if (!filteredAndSortedStock.length) return;
    const headerRow = ["Sr. No.", "Item Name", "Item Code", "Category", "Sub Category", "Unit", "Today In", "Today Out", "Closing Stock"].join(",");
    const dataRows = filteredAndSortedStock.map((item, idx) => {
      return [
        idx + 1,
        `"${(item.item_name || "").replace(/"/g, '""')}"`,
        `"${(item.item_code || "").replace(/"/g, '""')}"`,
        `"${(item.category_name || "").replace(/"/g, '""')}"`,
        `"${(item.sub_category_name || "").replace(/"/g, '""')}"`,
        `"${(item.unit_name || "").replace(/"/g, '""')}"`,
        0,
        0,
        item.current_stock || 0
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `warehouse_stock_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSortIcon = (columnKey: string) => {
    const isSortedCol = sortBy === columnKey;
    if (!isSortedCol) {
      return <svg className="sort-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg>;
    }
    if (sortOrder === "ASC") {
      return <svg className="sort-icon active-sort" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>;
    }
    return <svg className="sort-icon active-sort" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>;
  };

  return (
    <div className="page-container">
      <div className="page-card">
        {/* Header Bar */}
        <div className="page-header-bar-custom">
          <div>
            <h3 className="page-title">Warehouse Overview</h3>
            <div className="breadcrumb" style={{ fontSize: "12px", color: "#878a99", marginTop: "4px" }}>
              Warehouse &gt; <span style={{ color: "#495057", fontWeight: 500 }}>Overview</span>
            </div>
          </div>

          <div className="header-actions">
            {/* Search Box */}
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </span>
              )}
            </div>

            {/* Dynamic Warehouse Selector */}
            <div className="warehouse-select-box">
              <select
                value={selectedWarehouse}
                onChange={(e) => {
                  setSelectedWarehouse(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={String(w.id)}>
                    {w.warehouse_name}
                  </option>
                ))}
              </select>
              <span className="warehouse-select-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </span>
            </div>

            {/* Export */}
            <button className="btn-export" onClick={handleExportCSV}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="warehouse-tabs-container">
          <button
            type="button"
            className={`warehouse-tab ${activeTab === "inStock" ? "active" : ""}`}
            onClick={() => setActiveTab("inStock")}
          >
            <span>In Stock</span>
          </button>
          <button
            type="button"
            className={`warehouse-tab ${activeTab === "dailyLog" ? "active" : ""}`}
            onClick={() => setActiveTab("dailyLog")}
          >
            <span>Daily Log</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "inStock" && (
            <>
              <div className="table-responsive">
                <table className="custom-user-table">
                  <thead>
                    <tr>
                      <th style={{ width: "65px" }}>Sr. No.</th>
                      {[
                        { header: "Item Name", key: "item_name" },
                        { header: "Item Code", key: "item_code" },
                        { header: "Category", key: "category_name" },
                        { header: "Sub Category", key: "sub_category_name" },
                        { header: "Unit", key: "unit_name" },
                      ].map((col) => (
                        <th key={col.key}>
                          <div className="th-content">
                            <span
                              className="sortable-header-label"
                              onClick={() => handleSort(col.key)}
                            >
                              {col.header}
                              {renderSortIcon(col.key)}
                            </span>
                            <span
                              className={`filter-icon ${filters[col.key] ? "active-filter" : ""}`}
                              onClick={(e) => handleOpenFilter(e, col.key)}
                              title="Filter"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4c0-.55.45-1 1-1h16c.55 0 1 .45 1 1v2.59c0 .27-.11.52-.29.71L15 13.41V20c0 .55-.45 1-1 1h-4c-.55 0-1-.45-1-1v-6.59L3.29 7.29A1 1 0 0 1 3 6.59V4z" /></svg>
                            </span>
                          </div>

                          {/* Filter Popover */}
                          {activeFilterCol === col.key && popoverCoords && createPortal(
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
                                <button className="btn-popover-cancel" onClick={() => setActiveFilterCol(null)}>CANCEL</button>
                                <button className="btn-popover-apply" onClick={handleApplyFilter}>APPLY</button>
                              </div>
                            </div>,
                            document.body
                          )}
                        </th>
                      ))}
                      <th>Today In</th>
                      <th>Today Out</th>
                      <th>
                        <span
                          className="sortable-header-label"
                          onClick={() => handleSort("current_stock")}
                        >
                          Closing Stock
                          {renderSortIcon("current_stock")}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "28px", color: "#878a99" }}>
                          Loading stock data...
                        </td>
                      </tr>
                    ) : paginatedStock.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: 0 }}>
                          <WarehouseEmptyState
                            title="No stock records found"
                            subtitle={search ? "No stock items match your search or filter criteria." : "There are currently no stock records in the selected warehouse."}
                          />
                        </td>
                      </tr>
                    ) : (
                      paginatedStock.map((item, index) => (
                        <tr key={`${item.item_id}-${item.warehouse_id}`}>
                          <td>{(page - 1) * limit + index + 1}</td>
                          <td style={{ fontWeight: 500, color: "#111827" }}>{item.item_name}</td>
                          <td>{item.item_code}</td>
                          <td>{item.category_name}</td>
                          <td>{item.sub_category_name}</td>
                          <td>{item.unit_name}</td>
                          <td>-</td>
                          <td>-</td>
                          <td style={{ fontWeight: 600, color: "#10b981" }}>{item.current_stock}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="table-pagination-custom">
                <div>
                  Showing {paginatedStock.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
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
            </>
          )}
          {activeTab === "dailyLog" && (
            <>
              <div className="table-responsive">
                <table className="custom-user-table">
                  <thead>
                    <tr>
                      <th style={{ width: "65px" }}>Sr. No.</th>
                      <th>Date</th>
                      <th>Warehouse</th>
                      <th>Item Name</th>
                      <th>Opening Stock</th>
                      <th>Inward</th>
                      <th>Dispatched</th>
                      <th>Closing Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <WarehouseEmptyState
                          title="No daily log records"
                          subtitle="There are no daily stock movement logs available."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pagination Shell */}
              <div className="table-pagination-custom">
                <div>Showing 0 - 0 of 0 Results</div>

                <div className="pagination-right-controls">
                  <div className="pagination-controls">
                    <button className="page-btn" disabled>&lt;</button>
                    <button className="page-btn active">1</button>
                    <button className="page-btn" disabled>&gt;</button>
                  </div>

                  <div className="show-records-bottom">
                    <span>Show</span>
                    <select value={10} disabled style={{ opacity: 0.7 }}>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseOverview;
