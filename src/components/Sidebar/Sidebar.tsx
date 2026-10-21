import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  navigationItems,
  isSubItemActive,
  isNavItemActive,
  getActiveParentTitle,
  ChevronRight,
  ChevronDown,
  type NavItem,
} from "../../config/navigationConfig";
import "./Sidebar.css";

interface SidebarProps {
  collapsed: boolean;
}

interface FlyoutState {
  item: NavItem;
  top: number;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [flyoutState, setFlyoutState] = useState<FlyoutState | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  // Auto-open the parent menu whose child is currently active
  useEffect(() => {
    const activeParent = getActiveParentTitle(location.pathname);
    if (activeParent) {
      setExpandedSection(activeParent);
    }
  }, [location.pathname]);

  // Reset flyout state when route changes or sidebar collapses/expands
  useEffect(() => {
    setFlyoutState(null);
  }, [collapsed, location.pathname]);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const toggleSubmenu = (title: string) => {
    setExpandedSection((prev) => (prev === title ? null : title));
  };

  /* ═══════════════════════════════════════════════════
     Collapsed Hover Flyout Handlers
     ═══════════════════════════════════════════════════ */

  const handleItemMouseEnter = (item: NavItem, event: React.MouseEvent<HTMLDivElement>) => {
    if (!collapsed || !item.submenu || item.submenu.length === 0) return;

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    const targetRect = event.currentTarget.getBoundingClientRect();
    const estimatedHeight = 44 + item.submenu.length * 38;
    let computedTop = targetRect.top;

    // Viewport bounds clamping so flyout is never clipped off bottom or top
    if (computedTop + estimatedHeight > window.innerHeight - 16) {
      computedTop = Math.max(16, window.innerHeight - estimatedHeight - 16);
    }

    setFlyoutState({
      item,
      top: computedTop,
    });
  };

  const handleItemMouseLeave = () => {
    if (!collapsed) return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setFlyoutState(null);
    }, 150);
  };

  const handleFlyoutMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleFlyoutMouseLeave = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      setFlyoutState(null);
    }, 150);
  };

  const handleFlyoutItemClick = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setFlyoutState(null);
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* ── Logo Area ── */}
      <div className="sidebar-brand">
        <Link to="/dashboard" className="sidebar-logo">
          <img
            src={collapsed ? "/logo1.png" : "/Logo.png"}
            alt="MetaPhi"
            className={collapsed ? "logo-collapsed" : "logo-expanded"}
          />
        </Link>
      </div>

      {/* ── Scrollable Menu ── */}
      <div className="sidebar-menu">
        {navigationItems.map((item) => {
          /* ── Category Heading (USER MANAGEMENT, MASTERS...) ── */
          if (item.isCategory) {
            if (collapsed) return null;
            return (
              <div key={item.title} className="menu-category-title">
                {item.title}
              </div>
            );
          }

          /* ── Standalone Link (Dashboard) ── */
          if (item.path) {
            const isActive = isNavItemActive(item, location.pathname);
            return (
              <div key={item.title} className="menu-item">
                <Link
                  to={item.path}
                  className={`menu-link ${isActive ? "active" : ""}`}
                  title={collapsed ? item.title : undefined}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="menu-text">{item.title}</span>
                  )}
                </Link>
              </div>
            );
          }

          /* ── Expandable Menu with Submenu (Masters, Warehouse...) ── */
          if (item.submenu) {
            const isOpen = expandedSection === item.title;
            const isParentActive = isNavItemActive(item, location.pathname);

            return (
              <div
                key={item.title}
                className="menu-item"
                onMouseEnter={(e) => handleItemMouseEnter(item, e)}
                onMouseLeave={handleItemMouseLeave}
              >
                <div
                  className={`menu-link has-submenu ${isParentActive || (!collapsed && isOpen) ? "active" : ""}`}
                  onClick={() => {
                    if (!collapsed) {
                      toggleSubmenu(item.title);
                    }
                  }}
                  title={collapsed ? item.title : undefined}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="menu-text">{item.title}</span>
                      <span className={`menu-arrow ${isOpen ? "open" : ""}`}>
                        <ChevronRight />
                      </span>
                    </>
                  )}
                </div>

                {/* Sub-items accordion (visible only when sidebar is expanded) */}
                {!collapsed && isOpen && (
                  <div className="submenu-list">
                    {item.submenu.map((sub) => {
                      const isSubActive = isSubItemActive(sub, location.pathname);
                      return (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`submenu-link ${isSubActive ? "active" : ""}`}
                        >
                          {sub.icon && (
                            <span className="submenu-icon">{sub.icon}</span>
                          )}
                          <span className="submenu-text">{sub.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* ── Collapsed Hover Flyout Submenu (Matching Reference Screenshot) ── */}
      {collapsed && flyoutState && flyoutState.item.submenu && (
        <div
          className="sidebar-flyout-container"
          style={{ top: flyoutState.top }}
          onMouseEnter={handleFlyoutMouseEnter}
          onMouseLeave={handleFlyoutMouseLeave}
        >
          {/* Flyout Blue Header */}
          <div className="sidebar-flyout-header">
            <div className="sidebar-flyout-header-left">
              <span className="sidebar-flyout-header-icon">{flyoutState.item.icon}</span>
              <span className="sidebar-flyout-header-title">{flyoutState.item.title}</span>
            </div>
            <span className="sidebar-flyout-header-arrow">
              <ChevronDown />
            </span>
          </div>

          {/* Flyout Submenu List */}
          <div className="sidebar-flyout-body">
            {flyoutState.item.submenu.map((sub) => {
              const isSubActive = isSubItemActive(sub, location.pathname);
              return (
                <Link
                  key={sub.path}
                  to={sub.path}
                  className={`sidebar-flyout-link ${isSubActive ? "active" : ""}`}
                  onClick={handleFlyoutItemClick}
                >
                  {sub.icon && (
                    <span className="sidebar-flyout-icon">{sub.icon}</span>
                  )}
                  <span className="sidebar-flyout-text">{sub.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
