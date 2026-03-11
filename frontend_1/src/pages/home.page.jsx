import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../common/user-context.jsx";
import { showToast } from "../common/toast.js";
const API_URL = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState(null);
  const { user, token } = useUser();

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAdminOverview();
    } else {
      setAdminOverview(null);
      setAdminError(null);
      setAdminLoading(false);
    }
  }, [user, token]);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/blogs`);
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      const list = Array.isArray(data) ? data.filter((p) => p.status === 'published' || typeof p.status === 'undefined' && true) : [];
      setBlogs(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminOverview = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      const response = await fetch(`${API_URL}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Failed to fetch admin overview");
      const data = await response.json();
      setAdminOverview(data);
    } catch (err) {
      setAdminError(err.message);
    } finally {
      setAdminLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Never";
    return new Date(value).toLocaleString();
  };

  const previewText = (content) => {
    if (!content) return "";
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed
          .map((b) => (b.type === 'text' ? b.text : b.type === 'image' ? (b.desc || '') : ''))
          .filter(Boolean)
          .join(' ');
      }
    } catch (e) {}
    return typeof content === 'string' ? content : '';
  };

  const previewImage = (content) => {
    if (!content) return null;
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const img = parsed.find((b) => b.type === 'image' && b.src);
        return img ? img.src : null;
      }
    } catch (e) {}
    return null;
  };

  const stats = adminOverview?.stats;
  const welcome = adminOverview?.welcome;
  const recentActivity = adminOverview?.recentActivity;

  const handleCardLike = async (id, idx) => {
    if (!token) return showToast('Please sign in to like', 'error');
    setBlogs((prev) => {
      const copy = [...prev];
      const b = { ...copy[idx] };
      const likedBy = Array.isArray(b.likedBy) ? [...b.likedBy] : [];
      const has = likedBy.includes(user.id);
      if (has) {
        b.likes = (b.likes || 1) - 1;
        b.likedBy = likedBy.filter((id) => id !== user.id);
      } else {
        b.likes = (b.likes || 0) + 1;
        b.likedBy = [...likedBy, user.id];
      }
      copy[idx] = b;
      return copy;
    });

    try {
      const res = await fetch(`${API_URL}/api/blogs/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) throw new Error('Post not found (server may be down)');
      if (!res.ok) throw new Error('Like failed');
      const data = await res.json();
      setBlogs((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], likes: data.likes, likedBy: data.likedBy || copy[idx].likedBy };
        return copy;
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Like failed', 'error');
      fetchBlogs();
    }
  };

  const handleCardBookmark = async (id, idx) => {
    if (!token) return showToast('Please sign in to save', 'error');
    setBlogs((prev) => {
      const copy = [...prev];
      const b = { ...copy[idx] };
      const bookmarks = Array.isArray(b.bookmarks) ? [...b.bookmarks] : [];
      const has = bookmarks.includes(user.id);
      b.bookmarks = has ? bookmarks.filter((i) => i !== user.id) : [...bookmarks, user.id];
      copy[idx] = b;
      return copy;
    });

    try {
      const res = await fetch(`${API_URL}/api/blogs/${id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) throw new Error('Post not found (server may be down)');
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setBlogs((prev) => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], bookmarks: data.bookmarks };
        return copy;
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Save failed', 'error');
      fetchBlogs();
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {user && user.role === "admin" && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {welcome?.profilePhoto || user?.profilePhoto ? (
                <img src={welcome?.profilePhoto || user?.profilePhoto} alt="Admin profile" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600, color: '#374151' }}>
                  {(welcome?.adminName || user?.username || "A").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 600, fontFamily: "'Playfair Display', serif" }}>Welcome back, {welcome?.adminName || user?.username}</h1>
                <p style={{ fontSize: '12px', color: '#6B7280' }}>Last login: {formatDate(welcome?.lastLoginAt)}</p>
              </div>
            </div>
          </div>

          {adminLoading ? <p style={{ color: '#4B5563' }}>Loading admin overview...</p> : null}
          {adminError ? <p style={{ color: '#DC2626' }}>{adminError}</p> : null}

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <div style={{ flex: '1 1 150px', borderRadius: '8px', backgroundColor: '#F9FAFB', padding: '16px', minWidth: '120px' }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>Total Posts</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{stats?.totalPosts ?? 0}</p>
            </div>
            <div style={{ flex: '1 1 150px', borderRadius: '8px', backgroundColor: '#F9FAFB', padding: '16px', minWidth: '120px' }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>Total Users</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{stats?.totalUsers ?? 0}</p>
            </div>
            <div style={{ flex: '1 1 150px', borderRadius: '8px', backgroundColor: '#F9FAFB', padding: '16px', minWidth: '120px' }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>Total Comments</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{stats?.totalComments ?? 0}</p>
            </div>
            <div style={{ flex: '1 1 150px', borderRadius: '8px', backgroundColor: '#F9FAFB', padding: '16px', minWidth: '120px' }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>Total Likes</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{stats?.totalLikes ?? 0}</p>
            </div>

            <div style={{ flex: '1 1 150px', borderRadius: '8px', backgroundColor: '#F9FAFB', padding: '16px', minWidth: '120px' }}>
              <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>Pending Comments</p>
              <p style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{stats?.pendingComments ?? 0}</p>
            </div>
          </div>

          <div style={{ borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginTop: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', fontFamily: "'Playfair Display', serif" }}>Quick Actions</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Link to="/create-blog" style={{ borderRadius: '8px', backgroundColor: '#111827', color: '#FFFFFF', padding: '8px 16px', fontSize: '14px', textDecoration: 'none' }}>+ Create New Post</Link>
              <Link to="/dashboard" style={{ borderRadius: '8px', backgroundColor: '#374151', color: '#FFFFFF', padding: '8px 16px', fontSize: '14px', textDecoration: 'none' }}>Manage Posts</Link>
              <Link to="/dashboard?section=users" style={{ borderRadius: '8px', backgroundColor: '#4B5563', color: '#FFFFFF', padding: '8px 16px', fontSize: '14px', textDecoration: 'none' }}>Manage Users</Link>
              <Link to="/dashboard?section=comments" style={{ borderRadius: '8px', backgroundColor: '#6B7280', color: '#FFFFFF', padding: '8px 16px', fontSize: '14px', textDecoration: 'none' }}>Moderate Comments</Link>
            </div>
          </div>
        </section>
      )}

      <h1 style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: '24px', color: '#111827' }}>Blogs</h1>
      
      {loading ? (
        <p style={{ color: '#4B5563' }}>Loading blogs...</p>
      ) : error ? (
        <p style={{ color: '#DC2626' }}>{error}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {blogs.length === 0 ? (
            <p style={{ color: '#4B5563' }}>No blogs found.</p>
          ) : (
            blogs.map((blog) => {
              const imgSrc = previewImage(blog.content);
              return (
                <Link to={`/blog/${blog._id}`} key={blog._id} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    backgroundColor: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    height: '100%'
                  }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', color: '#111827', fontFamily: "'Playfair Display', serif" }}>{blog.title}</h2>
                    {imgSrc && (
                        <div style={{ marginBottom: '12px' }}>
                          <img src={imgSrc} alt={blog.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }} />
                        </div>
                    )}
                    <p style={{ marginBottom: '12px', color: '#4B5563', fontSize: '14px', lineHeight: '1.6' }}>{(previewText(blog.content) || '').slice(0, 120)}...</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>By {blog.author}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#4B5563', fontSize: '14px' }}>Read more →</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCardLike(blog._id, blogs.findIndex(b => b._id === blog._id));
                            }}
                            style={{ 
                                padding: '6px 12px', 
                                borderRadius: '6px',
                                backgroundColor: blog.likedBy && user && blog.likedBy.includes(user.id) ? '#FEE2E2' : '#F3F4F6',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: blog.likedBy && user && blog.likedBy.includes(user.id) ? '#DC2626' : '#4B5563'
                            }}
                        >
                          { (blog.likedBy && user && blog.likedBy.includes(user.id)) ? '❤️' : '🤍' } {blog.likes || 0}
                        </button>
                        <button 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCardBookmark(blog._id, blogs.findIndex(b => b._id === blog._id));
                            }}
                            style={{ 
                                padding: '6px 12px', 
                                borderRadius: '6px',
                                backgroundColor: blog.bookmarks && user && blog.bookmarks.includes(user.id) ? '#DBEAFE' : '#F3F4F6',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: blog.bookmarks && user && blog.bookmarks.includes(user.id) ? '#1D4ED8' : '#4B5563'
                            }}
                        >
                          { (blog.bookmarks && user && blog.bookmarks.includes(user.id)) ? 'Saved' : 'Save' }
                        </button>
                      </div>
                    </div>
                </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
