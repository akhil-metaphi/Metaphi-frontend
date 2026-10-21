import React from "react";
import "./Warehouse.css";

interface WarehouseEmptyStateProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

const WarehouseEmptyState: React.FC<WarehouseEmptyStateProps> = ({
  title = "No data available",
  subtitle = "There are currently no records for this section.",
  icon,
}) => {
  return (
    <div className="warehouse-empty-state">
      <div className="warehouse-empty-icon-wrap">
        {icon || (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
        )}
      </div>
      <h4 className="warehouse-empty-title">{title}</h4>
      <p className="warehouse-empty-subtitle">{subtitle}</p>
    </div>
  );
};

export default WarehouseEmptyState;
