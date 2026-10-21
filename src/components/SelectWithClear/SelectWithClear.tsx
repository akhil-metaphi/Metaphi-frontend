import React, { useState, useRef, useEffect, useMemo } from "react";
import "./SelectWithClear.css";

export interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectWithClearProps {
  value: string | number;
  onChange: (e: { target: { value: string; name?: string } }) => void;
  onClear: () => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  style?: React.CSSProperties;
}

const SelectWithClear: React.FC<SelectWithClearProps> = ({
  value,
  onChange,
  onClear,
  options,
  placeholder = "Select option",
  disabled = false,
  className = "",
  id,
  name,
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasValue = value !== "" && value !== null && value !== undefined;

  // Selected option label
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt.value) === String(value));
  }, [options, value]);

  // Compute what text to show in the input box
  const inputDisplayValue = isEditing
    ? searchTerm
    : selectedOption
    ? selectedOption.label
    : value
    ? String(value)
    : "";

  // Filter options dynamically based on in-field search term
  const filteredOptions = useMemo(() => {
    if (!isEditing || !searchTerm.trim()) return options;
    const query = searchTerm.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(query));
  }, [options, searchTerm, isEditing]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFocus = () => {
    if (disabled) return;
    setIsEditing(true);
    setSearchTerm(selectedOption ? selectedOption.label : "");
    setIsOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setSearchTerm(e.target.value);
    setIsEditing(true);
    setIsOpen(true);
  };

  const handleOptionSelect = (option: SelectOption) => {
    onChange({ target: { value: String(option.value), name } });
    setIsEditing(false);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClear();
    setIsEditing(false);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleArrowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setIsEditing(false);
      setSearchTerm("");
    } else {
      setIsEditing(true);
      setSearchTerm(selectedOption ? selectedOption.label : "");
      setIsOpen(true);
    }
  };

  return (
    <div className="select-control-wrapper" ref={containerRef} style={style}>
      <input
        id={id}
        name={name}
        type="text"
        disabled={disabled}
        className={`select-input-field ${className} ${isOpen ? "open" : ""}`}
        placeholder={placeholder}
        value={inputDisplayValue}
        onFocus={handleFocus}
        onChange={handleInputChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setIsOpen(false);
            setIsEditing(false);
            setSearchTerm("");
          }
        }}
        autoComplete="off"
      />

      {/* Clear Button: hidden by default, visible on wrapper hover */}
      {hasValue && !disabled && (
        <button
          type="button"
          className="select-clear-btn"
          aria-label="Clear selection"
          onClick={handleClear}
          title="Clear selection"
        >
          ✕
        </button>
      )}

      {/* Dropdown chevron arrow icon */}
      <span
        className={`select-arrow-btn ${isOpen ? "open" : ""}`}
        onClick={handleArrowClick}
      >
        ▼
      </span>

      {/* Floating Options Dropdown Menu */}
      {isOpen && !disabled && (
        <ul className="select-dropdown-popover">
          {filteredOptions.length === 0 ? (
            <div className="select-no-results">No matches found</div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <li
                  key={String(opt.value)}
                  className={`select-popover-item ${isSelected ? "selected" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before select
                    handleOptionSelect(opt);
                  }}
                >
                  {opt.label}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};

export default SelectWithClear;
