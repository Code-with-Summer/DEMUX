import { useState } from 'react';

const InputBox = ({ type, name, placeholder, value, onChange, id, icon }) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    return (
        <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
            <input
                type={type === 'password' ? (passwordVisible ? 'text' : 'password') : type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                id={id}
                style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    borderRadius: '8px',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(209, 213, 219, 0.3)';
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.backgroundColor = '#F9FAFB';
                    e.target.style.boxShadow = 'none';
                }}
            />
            {icon && (
                <i 
                    className={'fi ' + icon} 
                    style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9CA3AF',
                        fontSize: '14px',
                        pointerEvents: 'none'
                    }}
                ></i>
            )}
            {type === 'password' ? (
                <i
                    className={'fi fi-rr-eye' + (!passwordVisible ? '-crossed' : '')}
                    style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9CA3AF',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                    onClick={() => setPasswordVisible((currentVal) => !currentVal)}
                ></i>
            ) : ''}
        </div>
    );
};

export default InputBox;

