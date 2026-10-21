import React, { useState, useEffect } from "react";
import { fetchDashboardStats } from "../../services/api";
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetchDashboardStats();
        setStats(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div style={{ padding: 20 }}>Loading Dashboard...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header-bar-custom">
        <h2 className="page-title">Dashboard Overview</h2>
      </div>

      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{stats?.users || 0}</div>
          </div>
          <div className="stat-icon-wrapper icon-blue">👥</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-title">Total Items</div>
            <div className="stat-value">{stats?.items || 0}</div>
          </div>
          <div className="stat-icon-wrapper icon-green">📦</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-title">Total Enquiries</div>
            <div className="stat-value">{stats?.enquiries || 0}</div>
          </div>
          <div className="stat-icon-wrapper icon-blue">❓</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-title">Total Quotations</div>
            <div className="stat-value">{stats?.quotations || 0}</div>
          </div>
          <div className="stat-icon-wrapper icon-green">📝</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-title">Total Orders</div>
            <div className="stat-value">{stats?.orders || 0}</div>
          </div>
          <div className="stat-icon-wrapper icon-orange">🛒</div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <div className="stat-title">Total Dispatches</div>
            <div className="stat-value">{stats?.total_dispatch || 0}</div>
          </div>
          <div className="stat-icon-wrapper icon-teal">🚚</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;