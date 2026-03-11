import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { showToast } from "../common/toast.js";
import { useUser } from "../common/user-context.jsx";

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/api/admin`;

const DashboardPage = () => {
  const { user, token, login } = useUser();
  const [activeSection, setActiveSection] = useState("posts");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [posts, setPosts] = useState([]);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [search, setSearch] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", content: "", author: "" });

  const [analytics, setAnalytics] = useState({
    postsPerMonth: [],
    mostViewedPosts: [],
    mostLikedPost: null,
    activeUsers: 0
  });

  const [settings, setSettings] = useState({
    profile: { username: "", email: "", profilePhoto: "" },
    site: { blogTitle: "" }
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }),
    [token]
  );

  useEffect(() => {
    if (user?.role === "admin" && token) {
      loadPosts();
      loadAnalytics();
      loadSettings();
    }
  }, [user, token]);

  const handleApiError = async (response) => {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  };

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (authorFilter) params.set("author", authorFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      if (showSavedOnly) {
        const response = await fetch(`${API_BASE}/saved`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) await handleApiError(response);
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        const response = await fetch(`${API_BASE}/posts?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) await handleApiError(response);
        const data = await response.json();
        setPosts(data.posts || []);
      }
      setAuthors(data.authors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/posts?status=unpublished`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) await handleApiError(response);
      const data = await response.json();
      setPosts(data.posts || []);
      setAuthors(data.authors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) await handleApiError(response);
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) await handleApiError(response);
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) await handleApiError(response);
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePostStatus = async (postId, nextStatus) => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) await handleApiError(response);
      if (nextStatus === 'unpublished') {
        setActiveSection('drafts');
        await loadDrafts();
        showToast('Post saved as draft', 'success');
      } else {
        await loadPosts();
        showToast('Post published', 'success');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditPost = (post) => {
    let contentValue = post.content;
    try {
      const parsed = JSON.parse(post.content);
      if (Array.isArray(parsed)) {
        contentValue = parsed
          .map((b) => (b.type === 'text' ? b.text : b.type === 'image' ? (b.desc || '') : ''))
          .filter(Boolean)
          .join('\n\n');
      }
    } catch (e) {
      // not JSON
    }
    setEditingPostId(post._id);
    setEditForm({ title: post.title, content: contentValue, author: post.author });
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditForm({ title: "", content: "", author: "" });
  };

  const saveEditPost = async (postId) => {
    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(editForm)
      });
      if (!response.ok) await handleApiError(response);
      cancelEditPost();
      await loadPosts();
    } catch (err) {
      setError(err.message);
    }
  };


  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }
    if (!token) return showToast("Please sign in", "error");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`${API_URL}/api/uploads/profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      const fullUrl = data.url?.startsWith("/uploads/") ? `${API_URL}${data.url}` : data.url;
      setSettings((prev) => ({
        ...prev,
        profile: { ...prev.profile, profilePhoto: fullUrl }
      }));
      showToast("Photo uploaded", "success");
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    }
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/settings/profile`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(settings.profile)
      });
      if (!response.ok) await handleApiError(response);
      const updatedProfile = await response.json();
      setSettings((prev) => ({ ...prev, profile: updatedProfile }));
      login(token, {
        ...user,
        username: updatedProfile.username,
        email: updatedProfile.email,
        profilePhoto: updatedProfile.profilePhoto
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/settings/password`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(passwordForm)
      });
      if (!response.ok) await handleApiError(response);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      alert("Password updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateSite = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/settings/site`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blogTitle: settings.site?.blogTitle })
      });
      if (!response.ok) await handleApiError(response);
      const data = await response.json();
      setSettings((prev) => ({ ...prev, site: { blogTitle: data.blogTitle } }));
      try {
        localStorage.setItem('siteTitle', data.blogTitle);
        window.dispatchEvent(new CustomEvent('siteTitleChanged', { detail: { blogTitle: data.blogTitle } }));
      } catch (e) {
        // ignore
      }
      alert("Blog title updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, fontFamily: "'Playfair Display', serif", color: '#111827' }}>Access Denied</h1>
        <p style={{ color: '#4B5563' }}>You must be an admin to view this page.</p>
      </div>
    );
  }

  const btnStyle = (isActive) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: isActive ? '#111827' : '#F3F4F6',
    color: isActive ? '#FFFFFF' : '#4B5563',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, fontFamily: "'Playfair Display', serif", color: '#111827' }}>Admin Dashboard</h1>
        <Link to="/create-blog" style={{ backgroundColor: '#111827', color: '#FFFFFF', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
          Create New Post
        </Link>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setActiveSection("posts")} style={btnStyle(activeSection === "posts")}>Posts Management</button>
        <button onClick={() => { setActiveSection('drafts'); setTimeout(loadDrafts, 0); }} style={btnStyle(activeSection === 'drafts')}>View Drafts</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', color: '#4B5563' }}>
          <input type="checkbox" checked={showSavedOnly} onChange={(e) => { setShowSavedOnly(e.target.checked); setTimeout(loadPosts, 0); }} />
          Show Saved Only
        </label>
        <Link to="/analytics" style={{ ...btnStyle(false), textDecoration: 'none', display: 'inline-block' }}>Analytics</Link>
        <button onClick={() => setActiveSection("settings")} style={btnStyle(activeSection === "settings")}>Settings</button>
      </div>

      {error && <div style={{ padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', marginBottom: '16px' }}>{error}</div>}

      {activeSection === "posts" && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
            />
            <select value={authorFilter} onChange={(event) => setAuthorFilter(event.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}>
              <option value="">All authors</option>
              {authors.map((author) => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }} />
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={loadPosts} style={{ padding: '10px 20px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Apply Filters</button>
            <button
              onClick={() => {
                setSearch("");
                setAuthorFilter("");
                setStatusFilter("");
                setFromDate("");
                setToDate("");
                setTimeout(loadPosts, 0);
              }}
              style={{ padding: '10px 20px', backgroundColor: '#E5E7EB', color: '#374151', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              Reset
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#4B5563' }}>Loading posts...</p>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F9FAFB' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Title</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Author</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Date</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Status</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post._id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>
                        {editingPostId === post._id ? (
                          <input
                            value={editForm.title}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                          />
                        ) : (
                          post.title
                        )}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>
                        {editingPostId === post._id ? (
                          <input
                            value={editForm.author}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, author: event.target.value }))}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #E5E7EB', fontSize: '14px' }}
                          />
                        ) : (
                          post.author
                        )}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px', color: '#4B5563' }}>{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>{post.status || "published"}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {editingPostId === post._id ? (
                            <>
                              <button onClick={() => saveEditPost(post._id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Save</button>
                              <button onClick={cancelEditPost} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#9CA3AF', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <Link to={`/edit-blog/${post._id}`} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#F59E0B', color: '#FFFFFF', textDecoration: 'none', fontSize: '13px' }}>Edit</Link>
                              <button onClick={() => handleDeletePost(post._id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                              <button
                                onClick={() =>
                                  handlePostStatus(post._id, post.status === "published" ? "unpublished" : "published")
                                }
                                style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#3B82F6', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                              >
                                {post.status === "published" ? "Unpublish" : "Publish"}
                              </button>
                            </>
                          )}
                        </div>
                        {editingPostId === post._id && (
                          <textarea
                            value={editForm.content}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, content: event.target.value }))}
                            style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #E5E7EB', fontSize: '13px' }}
                            rows={3}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === 'drafts' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: "'Playfair Display', serif", color: '#111827' }}>Drafts</h2>
          {loading ? (
            <p style={{ color: '#4B5563' }}>Loading drafts...</p>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#F9FAFB' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Title</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Author</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Date</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post._id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>{post.title}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px' }}>{post.author}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB', fontSize: '14px', color: '#4B5563' }}>{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Link to={`/edit-blog/${post._id}`} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#F59E0B', color: '#FFFFFF', textDecoration: 'none', fontSize: '13px' }}>Edit</Link>
                          <button onClick={() => handlePostStatus(post._id, 'published')} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Publish</button>
                          <button onClick={() => handleDeletePost(post._id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeSection === "comments" && null}

      {activeSection === "settings" && (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <form onSubmit={handleUpdateProfile} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', backgroundColor: '#FFFFFF' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>Profile</h2>
            <input
              value={settings.profile?.username || ""}
              onChange={(event) => setSettings((prev) => ({ ...prev, profile: { ...prev.profile, username: event.target.value } }))}
              placeholder="Username"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', marginBottom: '12px' }}
            />
            <div style={{ marginBottom: '12px' }}>
              {settings.profile?.profilePhoto ? (
                <img
                  src={settings.profile.profilePhoto}
                  alt="Profile preview"
                  style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB', marginBottom: '8px' }}
                />
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhotoChange}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px' }}
              />
            </div>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Update Profile</button>
          </form>

          <form onSubmit={handleUpdatePassword} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', backgroundColor: '#FFFFFF' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>Change Password</h2>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              placeholder="Current password"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', marginBottom: '12px' }}
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              placeholder="New password"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', marginBottom: '12px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Update Password</button>
          </form>

          <form onSubmit={handleUpdateSite} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', padding: '20px', backgroundColor: '#FFFFFF' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', color: '#111827' }}>Site Settings</h2>
            <input
              value={settings.site?.blogTitle || ""}
              onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, blogTitle: event.target.value } }))}
              placeholder="Blog title"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', marginBottom: '12px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Update Blog Title</button>
          </form>
        </section>
      )}
    </div>
  );
};

export default DashboardPage;
