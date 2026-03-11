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
        headers: { Authorization: `Bearer ${token}` },
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
        <h1 style={{ fontSize: "28px", fontWeight: 600, fontFamily: "'Playfair Display', serif", color: "#111827" }}>
          Access Denied
        </h1>
        <p style={{ color: "#4B5563" }}>
          You must be an admin to view analytics.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            fontFamily: "'Playfair Display', serif",
            color: "#111827",
          }}
        >
          Analytics
        </h1>

        <Link
          to="/dashboard"
          style={{
            padding: "10px 16px",
            backgroundColor: "#111827",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Back to Dashboard
        </Link>
      </div>

      {loading && <p style={{ color: "#4B5563" }}>Loading analytics...</p>}
      {error && <p style={{ color: "#DC2626" }}>{error}</p>}

      {!loading && data && (
        <>
          {/* STATS */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {[
              ["Total Visits", data.totalVisits],
              ["Unique Visitors", data.uniqueVisitors],
              ["Visits Today", data.visitsToday],
              ["Visits This Week", data.visitsWeek],
              ["Visits This Month", data.visitsMonth],
            ].map(([title, value]) => (
              <div
                key={title}
                style={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  padding: "16px",
                  backgroundColor: "#fff",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    color: "#6B7280",
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {value || 0}
                </p>
              </div>
            ))}
          </section>

          {/* PAGE VIEWS + TOP POSTS */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ border: "1px solid #E5E7EB", padding: "16px", borderRadius: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                Page Views
              </h2>

              {(data.pageViews || []).slice(0, 10).map((row) => (
                <div
                  key={row.title}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  <span>{row.title}</span>
                  <span style={{ fontWeight: 600 }}>{row.views || 0}</span>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #E5E7EB", padding: "16px", borderRadius: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                Top Posts
              </h2>

              {(data.topPosts || []).map((row) => (
                <div
                  key={row.title}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  <span>{row.title}</span>
                  <span style={{ fontWeight: 600 }}>{row.views || 0} views</span>
                </div>
              ))}
            </div>
          </section>

          {/* TRAFFIC SOURCE + DEVICE */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ border: "1px solid #E5E7EB", padding: "16px", borderRadius: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                Traffic Source
              </h2>

              {(data.trafficSource || []).map((row) => (
                <div
                  key={row.source}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  <span>{row.source}</span>
                  <span style={{ fontWeight: 600 }}>{row.visitors || 0}</span>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #E5E7EB", padding: "16px", borderRadius: "12px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
                Device Type
              </h2>

              {(data.deviceType || []).map((row) => (
                <div
                  key={row.device}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    marginBottom: "6px",
                  }}
                >
                  <span>{row.device}</span>
                  <span style={{ fontWeight: 600 }}>{row.percent || 0}%</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
