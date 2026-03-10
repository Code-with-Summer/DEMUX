import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "../common/user-context.jsx";

const EditBlogPage = () => {
  const { blogId } = useParams();
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, token } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!blogId) return;
    fetchBlog();
  }, [blogId]);

  const fetchBlog = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}`);
      if (!res.ok) throw new Error("Failed to load blog");
      const data = await res.json();
      setTitle(data.title || "");
      try {
        const parsed = JSON.parse(data.content);
        if (Array.isArray(parsed)) setBlocks(parsed);
        else setBlocks([{ type: 'text', text: String(data.content || '') }]);
      } catch (e) {
        setBlocks([{ type: 'text', text: String(data.content || '') }]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTextBlock = () => setBlocks((prev) => [...prev, { type: 'text', text: '' }]);
  const addImageBlock = () => setBlocks((prev) => [...prev, { type: 'image', src: '', name: '', desc: '' }]);

  const updateTextBlock = (idx, val) => setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, text: val } : b)));
  const updateImageDesc = (idx, val) => setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, desc: val } : b)));

  const handleImageFileChange = async (idx, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('http://localhost:5000/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = `http://localhost:5000${data.url}`;
      setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, src: url, name: data.filename } : b)));
    } catch (err) {
      console.error(err);
      setError('Image upload failed');
    } finally {
      e.target.value = null;
    }
  };

  const removeBlock = (idx) => setBlocks((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e, status = 'published') => {
    e.preventDefault();
    if (!title || blocks.length === 0) {
      setError('Title and at least one content block are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const blocksToSend = await Promise.all(blocks.map(async (b) => {
        if (b.type === 'image' && typeof b.src === 'string' && b.src.startsWith('data:')) {
          const blob = await (await fetch(b.src)).blob();
          const fd = new FormData();
          fd.append('file', blob, b.name || 'upload.png');
          const upl = await fetch('http://localhost:5000/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
          if (!upl.ok) throw new Error('Image upload failed');
          const d = await upl.json();
          return { ...b, src: `http://localhost:5000${d.url}`, name: d.filename };
        }
        return b;
      }));

      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: JSON.stringify(blocksToSend), author: user?.username || 'Anonymous', status })
      });
      if (!response.ok) throw new Error('Update failed');
      navigate(`/blog/${blogId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
      Loading...
    </div>
  );
  if (error) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#DC2626' }}>
      {error}
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, fontFamily: "'Playfair Display', serif", marginBottom: '24px', color: '#111827' }}>Edit Blog</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '16px', outline: 'none' }}
              placeholder="Enter blog title"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#374151' }}>Content</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {blocks.length === 0 && (
                <div style={{ fontSize: '14px', color: '#9CA3AF', padding: '20px', backgroundColor: '#F9FAFB', borderRadius: '8px', textAlign: 'center', border: '1px dashed #E5E7EB' }}>
                  No content blocks yet. Use the buttons below to add text or image blocks.
                </div>
              )}
              {blocks.map((b, idx) => (
                <div key={idx} style={{ padding: '16px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#4B5563' }}>
                      {b.type === 'text' ? 'Text Block' : 'Image Block'}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => removeBlock(idx)} 
                      style={{ fontSize: '14px', color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                  {b.type === 'text' && (
                    <textarea
                      value={b.text}
                      onChange={(e) => updateTextBlock(idx, e.target.value)}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '14px', minHeight: '150px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }}
                      placeholder="Enter text..."
                    />
                  )}
                  {b.type === 'image' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ width: '200px', height: '100px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                        {b.src ? (
                          <img src={b.src} alt={b.name || 'image'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#9CA3AF' }}>
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input 
                            id={`file-input-${idx}`} 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageFileChange(idx, e)} 
                            style={{ display: 'none' }} 
                          />
                          <label 
                            htmlFor={`file-input-${idx}`} 
                            style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', backgroundColor: '#111827', color: '#FFFFFF', fontSize: '14px' }}
                          >
                            Replace Image
                          </label>
                          {b.name && <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px' }}>{b.name}</span>}
                        </div>
                        <input
                          type="text"
                          value={b.desc || ''}
                          onChange={(e) => updateImageDesc(idx, e.target.value)}
                          style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #E5E7EB', fontSize: '14px', outline: 'none' }}
                          placeholder="Image description (optional)"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={addTextBlock} 
              style={{ padding: '10px 20px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              + Add Text
            </button>
            <button 
              type="button" 
              onClick={addImageBlock} 
              style={{ padding: '10px 20px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            >
              + Add Image
            </button>
          </div>

          {error && (
            <div style={{ padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
            <button 
              type="button" 
              onClick={(e) => handleSubmit(e, 'unpublished')} 
              disabled={loading} 
              style={{ padding: '12px 20px', backgroundColor: '#F3F4F6', color: '#374151', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ padding: '12px 20px', backgroundColor: '#111827', color: '#FFFFFF', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlogPage;

