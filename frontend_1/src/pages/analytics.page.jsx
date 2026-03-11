import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../common/user-context.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const AnalyticsPage = () => {
  const { user, token } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAnalytics();
    }
  }, [user, token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to load analytics");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, fontFamily: "'Playfair Display', serif", color: "#111827" }}>Access Denied</h1>
        <p style={{ color: "#4B5563" }}>You must be an admin to view analytics.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#111827" }}>Analytics</h1>
        <Link to="/dashboard" style={{ padding: "10px 16px", backgroundColor: "#111827", color: "#FFFFFF", borderRadius: "8px", textDecoration: "none", fontSize: "14px" }}>
          Back to Dashboard
        </Link>
      </div>

      {loading ? <p style={{ color: "#4B5563" }}>Loading analytics...</p> : null}
      {error ? <p style={{ color: "#DC2626" }}>{error}</p> : null}

      {!loading && data ? (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Total Visits</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.totalVisits || 0}</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Unique Visitors</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.uniqueVisitors || 0}</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Visits Today</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.visitsToday || 0}</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Visits This Week</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.visitsWeek || 0}</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Visits This Month</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.visitsMonth || 0}</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Avg Read Time</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.averageReadTime || 0} min</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Bounce Rate</p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>{data.bounceRate || 0}%</p>
            </div>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <p style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280" }}>Engagement</p>
              <p style={{ fontSize: "14px", color: "#111827" }}>Comments: {data.engagement?.comments || 0}</p>
              <p style={{ fontSize: "14px", color: "#111827" }}>Likes: {data.engagement?.likes || 0}</p>
              <p style={{ fontSize: "14px", color: "#111827" }}>Shares: {data.engagement?.shares || 0}</p>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#111827" }}>Page Views</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {(data.pageViews || []).slice(0, 10).map((row) => (
                  <div key={row.title} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
                    <span style={{ color: "#374151" }}>{row.title}</span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>{row.views || 0}</span>
                  </div>
                ))}
              </div>

            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#111827" }}>Top Posts</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {(data.topPosts || []).map((row) => (
                  <div key={row.title} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
                    <span style={{ color: "#374151" }}>{row.title}</span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>{row.views || 0} views</span>
                  </div>
                ))}
              </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#111827" }}>Traffic Source</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {(data.trafficSource || []).map((row) => (
                  <div key={row.source} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
                    <span style={{ color: "#374151" }}>{row.source}</span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>{row.visitors || 0}</span>
                  </div>
                ))}
              </div>

            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#111827" }}>Device Type</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {(data.deviceType || []).map((row) => (
                  <div key={row.device} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
                    <span style={{ color: "#374151" }}>{row.device}</span>
                    <span style={{ color: "#111827", fontWeight: 600 }}>{row.percent || 0}</span>
                  </div>
                ))}
              </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#111827" }}>Daily Traffic</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {(data.dailyTraffic || []).map((row) => (
                  <div key={row.date} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "90px", fontSize: "12px", color: "#6B7280" }}>{row.date}</span>
                    <div style={{ flex: 1, height: "8px", backgroundColor: "#E5E7EB", borderRadius: "999px" }}>
                      <div style={{ height: "8px", width: `${Math.min(100, row.visits || 0)}%`, backgroundColor: "#111827", borderRadius: "999px" }} />
                    </div>
                    <span style={{ width: "40px", textAlign: "right", fontSize: "12px", color: "#111827" }}>{row.visits || 0}</span>
                  </div>
                ))}
              </div>

            <div style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#111827" }}>Search Keywords</h2>
              <div style={{ display: "grid", gap: "8px" }}>
                {(data.searchKeywords || []).length === 0 ? (
                  <p style={{ color: "#6B7280", fontSize: "14px" }}>No keywords tracked yet.</p>
                ) : (
                  data.searchKeywords.map((row) => (
                    <div key={row.keyword} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "14px" }}>
                      <span style={{ color: "#374151" }}>{row.keyword}</span>
                      <span style={{ color: "#111827", fontWeight: 600 }}>{row.count || 0}</span>
                    </div>
                  ))
                )}
              </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default AnalyticsPage;
