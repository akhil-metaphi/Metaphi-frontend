import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Toast from "../Toast/Toast";
import { fetchOrderList } from "../../services/api";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T, index: number) => React.ReactNode;
}

interface OrderListTableProps<T extends { id: number }> {
  title: string;
  endpoint: string;
  createPath: string;
  editPathPrefix: string;
  columns: ColumnDef<T>[];
  entityName: string;
}

function OrderListTable<T extends { id: number }>({
  title,
  endpoint,
  createPath,
  editPathPrefix,
  columns,
  entityName,
}: OrderListTableProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [search, setSearch] = useState<string>("");
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchOrderList<T>(endpoint, { page, limit, search });
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg> Create {entityName}
            </Link>
          </div>
        </div>

        {error && (
          <Toast message={error} type="error" duration={3000} onClose={() => setError("")} />
        )}

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                {columns.map((col, idx) => (
                  <th key={idx}>
                    <span className="sortable-header-label">
                      {col.header}
                      <svg className="sort-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '4px'}}><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>
                    </span>
                    <span className="filter-icon" title="Filter">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                    </span>
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "20px" }}>
                    Loading {title}...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} style={{ textAlign: "center", padding: "20px", color: "#878a99" }}>
                    No records found.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => (
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
                          title="Edit"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </Link>
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

export default OrderListTable;
