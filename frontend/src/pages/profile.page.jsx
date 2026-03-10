import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../common/user-context.jsx";
import { showToast } from "../common/toast.js";

const ProfilePage = () => {
  const { user, token, login } = useUser();
  const [profileForm, setProfileForm] = useState({ username: "", email: "", profilePhoto: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        profilePhoto: user.profilePhoto || ""
      });
    }
  }, [user]);

  const handlePhotoChange = async (event) => {
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
      const response = await fetch("http://localhost:5000/api/uploads/profile", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");
      const fullUrl = data.url?.startsWith("/uploads/") ? `http://localhost:5000${data.url}` : data.url;
      setProfileForm((prev) => ({ ...prev, profilePhoto: fullUrl }));
      showToast("Photo uploaded", "success");
    } catch (err) {
      showToast(err.message || "Upload failed", "error");
    }
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    if (!token) return showToast("Please sign in", "error");
    setSavingProfile(true);
    try {
      const response = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profileForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Update failed");
      login(token, { ...user, ...data });
      showToast("Profile updated", "success");
    } catch (err) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    if (!token) return showToast("Please sign in", "error");
    setSavingPassword(true);
    try {
      const response = await fetch("http://localhost:5000/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(passwordForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Password update failed");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      showToast("Password updated", "success");
    } catch (err) {
      showToast(err.message || "Password update failed", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 600, fontFamily: "'Playfair Display', serif", color: "#111827" }}>Profile</h1>
        <p style={{ color: "#4B5563" }}>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
          color: "#111827",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 500
        }}
      >
        <span style={{ fontSize: "18px", lineHeight: 1 }}>←</span>
        Back to Home
      </Link>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginBottom: "24px" }}>
        {profileForm.profilePhoto ? (
          <img
            src={profileForm.profilePhoto}
            alt={profileForm.username || "Profile"}
            style={{ width: "88px", height: "88px", borderRadius: "50%", objectFit: "cover", border: "2px solid #E5E7EB" }}
          />
        ) : (
          <div
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              backgroundColor: "#F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 700,
              color: "#4B5563",
              border: "2px solid #E5E7EB"
            }}
          >
            {(profileForm.username || "U").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#111827" }}>
            {profileForm.username || "User"}
          </h1>
          <p style={{ color: "#4B5563" }}>{profileForm.email}</p>
        </div>
        {user.role === "admin" ? (
          <Link
            to="/dashboard"
            style={{
              marginLeft: "auto",
              padding: "10px 16px",
              backgroundColor: "#111827",
              color: "#FFFFFF",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px"
            }}
          >
            Admin Dashboard
          </Link>
        ) : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        <form onSubmit={handleUpdateProfile} style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "20px", backgroundColor: "#FFFFFF" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#111827" }}>Edit Profile</h2>
          <input
            value={profileForm.username}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, username: event.target.value }))}
            placeholder="Name"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "12px" }}
          />
          <input
            type="email"
            value={profileForm.email}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="Email"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "12px" }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "12px" }}
          />
          <button
            type="submit"
            disabled={savingProfile}
            style={{
              padding: "10px 20px",
              backgroundColor: "#111827",
              color: "#FFFFFF",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              opacity: savingProfile ? 0.7 : 1
            }}
          >
            {savingProfile ? "Saving..." : "Update Profile"}
          </button>
        </form>

        <form onSubmit={handleUpdatePassword} style={{ borderRadius: "12px", border: "1px solid #E5E7EB", padding: "20px", backgroundColor: "#FFFFFF" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "#111827" }}>Change Password</h2>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
            placeholder="Current password"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "12px" }}
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
            placeholder="New password"
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "14px", marginBottom: "12px" }}
          />
          <button
            type="submit"
            disabled={savingPassword}
            style={{
              padding: "10px 20px",
              backgroundColor: "#111827",
              color: "#FFFFFF",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              opacity: savingPassword ? 0.7 : 1
            }}
          >
            {savingPassword ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
