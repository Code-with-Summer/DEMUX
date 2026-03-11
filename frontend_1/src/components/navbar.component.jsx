import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useUser } from '../common/user-context.jsx';
import { useSiteTitle } from '../common/site-title-context.jsx';
import Footer from './footer.component.jsx';

const Navbar = () => {
    const { user, logout } = useUser();
    const { siteTitle } = useSiteTitle();
    const [showDropdown, setShowDropdown] = React.useState(false);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <nav style={{ 
                width: '100%', 
                backgroundColor: '#FFFFFF', 
                borderBottom: '1px solid #E5E7EB', 
                padding: '20px 16px',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link 
                        to="/" 
                        style={{ 
                            fontFamily: "'Playfair Display', serif", 
                            fontSize: '20px', 
                            fontWeight: 600, 
                            color: '#111827',
                            textDecoration: 'none'
                        }}
                    >
                        {siteTitle}
                    </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {user ? (
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={toggleDropdown}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '8px'
                                }}
                            >
                                {user.profilePhoto ? (
                                    <img 
                                        src={user.profilePhoto} 
                                        alt={user.username} 
                                        style={{ 
                                            width: '36px', 
                                            height: '36px', 
                                            borderRadius: '50%', 
                                            objectFit: 'cover',
                                            border: '2px solid #E5E7EB'
                                        }} 
                                    />
                                ) : (
                                    <div style={{ 
                                        width: '36px', 
                                        height: '36px', 
                                        borderRadius: '50%', 
                                        backgroundColor: '#F3F4F6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#4B5563',
                                        border: '2px solid #E5E7EB'
                                    }}>
                                        {user.username?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            
                            {showDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    backgroundColor: '#FFFFFF',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    border: '1px solid #E5E7EB',
                                    minWidth: '150px',
                                    overflow: 'hidden'
                                }}>
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setShowDropdown(false)}
                                        style={{
                                            display: 'block',
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            color: '#374151',
                                            textDecoration: 'none'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                                    >
                                        My Profile
                                    </Link>
                                    <Link
                                        to="/saved"
                                        onClick={() => setShowDropdown(false)}
                                        style={{
                                            display: 'block',
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            color: '#374151',
                                            textDecoration: 'none'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                                    >
                                        Saved
                                    </Link>
                                    {user.role === 'admin' ? (
                                        <Link
                                            to="/dashboard"
                                            onClick={() => setShowDropdown(false)}
                                            style={{
                                                display: 'block',
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                color: '#374151',
                                                textDecoration: 'none'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                                        >
                                            Admin Dashboard
                                        </Link>
                                    ) : null}
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '12px 16px',
                                            fontSize: '14px',
                                            color: '#DC2626',
                                            background: 'none',
                                            border: 'none',
                                            textAlign: 'left',
                                            cursor: 'pointer'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#FEF2F2'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#FFFFFF'}
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <React.Fragment>
                            <Link 
                                to="/signin" 
                                style={{ fontSize: '14px', color: '#4B5563', textDecoration: 'none' }}
                            >
                                Sign In
                            </Link>
                            <Link 
                                to="/signup" 
                                style={{ 
                                    fontSize: '14px', 
                                    backgroundColor: '#111827', 
                                    color: '#ffffff', 
                                    padding: '8px 16px', 
                                    borderRadius: '8px', 
                                    textDecoration: 'none'
                                }}
                            >
                                Sign Up
                            </Link>
                        </React.Fragment>
                    )}
                </div>
            </nav>
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Navbar;

