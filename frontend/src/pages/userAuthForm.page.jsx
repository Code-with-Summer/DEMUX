import React, { useEffect, useState } from 'react'
import InputBox from '../components/input.component.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { useUser } from '../common/user-context.jsx'

const UserAuthForm = ({type}) => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        username: '',
        role: 'user'
    });
    const { login, token } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            navigate('/');
        }
    }, [token, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = type === 'sign-in' ? '/login' : '/signup';
        try {
            let payload;
            if (endpoint === '/signup') {
                payload = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                };
            } else {
                payload = {
                    email: formData.email,
                    password: formData.password
                };
            }
            const response = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok) {
                login(data.token, data.user);
                if (endpoint === '/login') {
                    const siteTitle = localStorage.getItem('siteTitle') || 'Simple Blog';
                    alert(`Hi ${data.user.username} !! Welcome to ${siteTitle}.`);
                }
                navigate('/');
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    return (
        <div style={{ 
            minHeight: 'calc(100vh - 140px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#F9FAFB',
            padding: '24px'
        }}>
            <form 
                onSubmit={handleSubmit} 
                style={{ 
                    width: '100%', 
                    maxWidth: '400px',
                    backgroundColor: '#FFFFFF',
                    padding: '40px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}
            >
                <h1 style={{ 
                    fontSize: '28px', 
                    fontWeight: 600, 
                    fontFamily: "'Playfair Display', serif",
                    textAlign: 'center', 
                    marginBottom: '32px',
                    color: '#111827'
                }}>
                    {type === "sign-in" ? "Welcome back!" : "Join us today!"}
                </h1>
                
                {type !== "sign-in" && (
                    <InputBox
                        type="text"
                        name="fullname"
                        placeholder="Full Name"
                        value={formData.fullname}
                        onChange={handleChange}
                        id="name"
                        icon="fi-rr-user"
                    />
                )}
                
                <InputBox
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    id="email"
                    icon="fi-rr-envelope"
                />
                
                <InputBox
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    id="password"
                    icon="fi-rr-key"
                />
                
                {type === "sign-up" && (
                    <InputBox
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        id="username"
                        icon="fi-rr-user"
                    />
                )}
                
                <button
                    type='submit'
                    style={{ 
                        width: '100%',
                        backgroundColor: '#111827', 
                        color: '#FFFFFF', 
                        borderRadius: '8px', 
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '8px',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#000000'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#111827'}
                >
                    {type.replace("-", " ")}
                </button>
                
                <p style={{ 
                    marginTop: '24px', 
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#4B5563'
                }}>
                    {type === "sign-in" ? (
                        <>
                            Don't have an account?{' '}
                            <Link to="/signup" style={{ color: '#111827', fontWeight: 500, textDecoration: 'none' }}>
                                Sign up
                            </Link>
                        </>
                    ) : (
                        <>
                            Already have an account?{' '}
                            <Link to="/signin" style={{ color: '#111827', fontWeight: 500, textDecoration: 'none' }}>
                                Sign in here.
                            </Link>
                        </>
                    )}
                </p>
            </form>
        </div>
    )
}

export default UserAuthForm

