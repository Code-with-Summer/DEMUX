import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../common/user-context.jsx";

const SavedPage = () => {
  const { user, token } = useUser();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSaved();
  }, [user, token]);

  const fetchSaved = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user || !token) {
        setBlogs([]);
        return;
      }
      const res = await fetch("http://localhost:5000/api/blogs/saved", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch saved posts");
      const data = await res.json();
      setBlogs(Array.isArray(data) ? data : data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#111827" }}>Saved Posts</h1>
        <p style={{ color: "#4B5563" }}>Please sign in to see saved posts.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: "16px", color: "#111827" }}>Saved Posts</h1>
      {loading ? <p style={{ color: "#4B5563" }}>Loading...</p> : null}
      {error ? <p style={{ color: "#DC2626" }}>{error}</p> : null}
      {!loading && blogs.length === 0 && <p style={{ color: "#6B7280" }}>No saved posts.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {blogs.map((b) => (
          <Link
            key={b._id}
            to={`/blog/${b._id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "16px", backgroundColor: "#FFFFFF" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "#111827", fontFamily: "'Playfair Display', serif" }}>{b.title}</h2>
              <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "12px" }}>By {b.author}</p>
              <div style={{ fontSize: "13px", color: "#4B5563" }}>Read more →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SavedPage;
