import { useEffect, useState } from "react";
import { useUser } from "../common/user-context.jsx";
import { showToast } from "../common/toast.js";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const BlogPage = () => {
  const { blogId } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, token } = useUser();

  useEffect(() => {
    fetchBlog();
    fetchComments();
  }, [blogId]);

  const fetchBlog = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/blogs/${blogId}`);
      if (!response.ok) throw new Error("Failed to fetch blog");
      const data = await response.json();
      setBlog(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/comments`);
      if (!res.ok) throw new Error('Failed to load comments');
      const data = await res.json();
      setComments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!token) return showToast('Please sign in to like', 'error');
    const prev = blog;
    setBlog((b) => {
      const likedBy = Array.isArray(b.likedBy) ? [...b.likedBy] : [];
      const has = likedBy.includes(user.id);
      return {
        ...b,
        likes: has ? (b.likes || 1) - 1 : (b.likes || 0) + 1,
        likedBy: has ? likedBy.filter((i) => i !== user.id) : [...likedBy, user.id]
      };
    });

    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) throw new Error('Post not found (server may be down)');
      if (!res.ok) throw new Error('Like failed');
      const data = await res.json();
      setBlog((b) => ({ ...b, likes: data.likes, likedBy: data.likedBy || (b.likedBy || []) }));
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Like failed', 'error');
      setBlog(prev);
    }
  };

  const handleBookmark = async () => {
    if (!token) return showToast('Please sign in to save', 'error');
    const prev = blog;
    setBlog((b) => {
      const bookmarks = Array.isArray(b.bookmarks) ? [...b.bookmarks] : [];
      const has = bookmarks.includes(user.id);
      return { ...b, bookmarks: has ? bookmarks.filter((i) => i !== user.id) : [...bookmarks, user.id] };
    });

    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 404) throw new Error('Post not found (server may be down)');
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setBlog((b) => ({ ...b, bookmarks: data.bookmarks }));
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Save failed', 'error');
      setBlog(prev);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'success');
    } catch (err) {
      showToast('Copy failed', 'error');
    }
  };

  const handlePostComment = async (parentId = null) => {
    if (!token) return showToast('Please sign in to comment', 'error');
    if (!newComment.trim()) return;
    const payload = { content: newComment.trim(), parentId };
    try {
      const res = await fetch(`${API_URL}/api/blogs/${blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to post comment');
      setNewComment('');
      await fetchComments();
      showToast('Comment posted', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Comment failed', 'error');
    }
  };

  const handleLikeComment = async (id) => {
    if (!token) return showToast('Please sign in to like', 'error');
    try {
      const res = await fetch(`${API_URL}/api/comments/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Like failed');
      await fetchComments();
    } catch (err) {
      console.error(err);
      showToast('Like failed', 'error');
    }
  };

  const handleDeleteComment = async (id) => {
    if (!token) return showToast('Please sign in', 'error');
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`${API_URL}/api/comments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Delete failed');
      await fetchComments();
      showToast('Comment deleted', 'success');
    } catch (err) {
      console.error(err);
      showToast('Delete failed', 'error');
    }
  };

  const handleReportComment = async (id) => {
    if (!token) return showToast('Please sign in', 'error');
    const reason = window.prompt('Why are you reporting this comment? (optional)');
    try {
      const res = await fetch(`${API_URL}/api/comments/${id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reason }) });
      if (!res.ok) throw new Error('Report failed');
      showToast('Reported — moderators will review', 'success');
    } catch (err) {
      console.error(err);
      showToast('Report failed', 'error');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#4B5563' }}>Loading blog...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>{error}</div>;
  if (!blog) return <div style={{ padding: '40px', textAlign: 'center', color: '#4B5563' }}>Blog not found</div>;

  const isLiked = user && blog.likedBy && blog.likedBy.includes(user.id);
  const isBookmarked = user && blog.bookmarks && blog.bookmarks.includes(user.id);

  return (
    <div className="blog-page-container" style={{ padding: '32px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'Playfair Display', serif", marginBottom: '16px', color: '#111827', lineHeight: 1.3 }}>{blog.title}</h1>

      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ color: '#4B5563', fontSize: '14px' }}>
              By <strong>{blog.author}</strong>{blog.authorRole === 'admin' ? <span style={{ color: '#DC2626', fontWeight: 600 }}> (Admin)</span> : null} on {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>{blog.readTime ? blog.readTime + ' min read' : ''} {blog.views ? ' - ' + blog.views + ' views' : ''}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button onClick={handleLike} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: isLiked ? '#FEE2E2' : '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: '14px', color: isLiked ? '#DC2626' : '#4B5563' }}>
            {isLiked ? 'Liked' : 'Like'} {blog.likes ? '(' + blog.likes + ')' : ''}
          </button>
          <button onClick={handleShare} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#4B5563' }}>
            Share
          </button>
          <button onClick={handleBookmark} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: isBookmarked ? '#DBEAFE' : '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: '14px', color: isBookmarked ? '#1D4ED8' : '#4B5563' }}>
            {isBookmarked ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <div className="blog-page-content" style={{ fontSize: '16px', lineHeight: 1.8, color: '#374151' }}>
        {(() => {
          try {
            const parsed = JSON.parse(blog.content);
            if (Array.isArray(parsed)) {
              return parsed.map((b, i) => {
                if (b.type === 'text') return <p key={i} style={{ marginBottom: '24px', fontSize: '16px', lineHeight: 1.8 }}>{b.text}</p>;
                  if (b.type === 'image') return (
                      <div key={i} style={{ marginBottom: '24px' }}>
                        <img src={b.src} alt={b.name || 'image'} style={{ width: '100%', borderRadius: '12px' }} />
                        {b.desc && <div style={{ color: '#6B7280', fontStyle: 'italic', marginTop: '8px', textAlign: 'right', fontSize: '14px' }}>{b.desc}</div>}
                      </div>
                    );
                return null;
              });
            }
          } catch (e) {}
          return <p style={{ marginBottom: '24px', fontSize: '16px', lineHeight: 1.8 }}>{blog.content}</p>;
        })()}
      </div>

      <div style={{ marginTop: '48px', borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: '16px', color: '#111827' }}>Comments</h2>
        {token ? (
          <div style={{ marginBottom: '24px' }}>
            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', minHeight: '100px' }} placeholder="Write a comment..." />
            <div style={{ marginTop: '12px' }}>
              <button onClick={() => handlePostComment(null)} style={{ borderRadius: '8px', backgroundColor: '#111827', color: '#FFFFFF', padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Post Comment</button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#6B7280' }}>Please sign in to comment.</p>
        )}

        <div style={{ marginTop: '24px' }}>
          {comments.length === 0 ? <p style={{ color: '#6B7280' }}>No comments yet.</p> : comments.map((c) => (
            <CommentItem key={c._id} comment={c} currentUser={user} onReply={fetchComments} onLike={handleLikeComment} onDelete={handleDeleteComment} onReport={handleReportComment} />
          ))}
        </div>
      </div>
    </div>
  );
};

const CommentItem = ({ comment, currentUser, onReply, onLike, onDelete, onReport }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');

  const submitReply = async () => {
    if (!replyText.trim()) return;
    try {
      const token = window.localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/blogs/${comment.blogId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: replyText, parentId: comment._id })
      });
      if (!res.ok) throw new Error('Reply failed');
      setReplyText('');
      setShowReply(false);
      onReply();
    } catch (err) {
      console.error(err);
      alert('Reply failed');
    }
  };

  const isLiked = currentUser && comment.likedBy && comment.likedBy.includes(currentUser.id);
  const adminLabel = comment.authorRole === 'admin';
  const adminLikePhoto = comment.adminLikePhoto
    ? (comment.adminLikePhoto.startsWith('/uploads/') ? `${API_URL}${comment.adminLikePhoto}` : comment.adminLikePhoto)
    : '';

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {comment.author} {adminLabel ? <span style={{ color: '#DC2626', fontWeight: 600 }}> (Admin)</span> : null}
          </div>
          <div style={{ fontSize: '13px', color: '#6B7280' }}>{new Date(comment.createdAt).toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => onLike(comment._id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: isLiked ? '#FEE2E2' : '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: '13px', color: isLiked ? '#DC2626' : '#4B5563' }}>
            {isLiked ? 'Liked' : 'Like'} {comment.likedBy ? `(${comment.likedBy.length})` : ''}
          </button>
          {adminLikePhoto ? (
            <img
              src={adminLikePhoto}
              alt={comment.adminLikeName || 'Admin'}
              title={comment.adminLikeName ? `${comment.adminLikeName} liked` : 'Admin liked'}
              style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #E5E7EB' }}
            />
          ) : null}
          {currentUser && (currentUser.username === comment.author || currentUser.role === 'admin') && (
            <button onClick={() => onDelete(comment._id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#FEE2E2', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#DC2626' }}>Delete</button>
          )}
          <button onClick={() => setShowReply(s => !s)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#F3F4F6', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#4B5563' }}>Reply</button>
          <button onClick={() => onReport(comment._id)} style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#FEF3C7', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#92400E' }}>Report</button>
        </div>
      </div>
      <div style={{ marginTop: '12px', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{comment.content}</div>
      {showReply && (
        <div style={{ marginTop: '12px' }}>
          <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }} rows={3} />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={submitReply} style={{ borderRadius: '6px', backgroundColor: '#111827', color: '#FFFFFF', padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Reply</button>
            <button onClick={() => setShowReply(false)} style={{ borderRadius: '6px', backgroundColor: '#E5E7EB', color: '#374151', padding: '6px 12px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '16px', marginLeft: '24px' }}>
          {comment.replies.map(r => (
            <CommentItem key={r._id} comment={r} currentUser={currentUser} onReply={onReply} onLike={onLike} onDelete={onDelete} onReport={onReport} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPage;

