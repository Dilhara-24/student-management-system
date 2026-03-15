// src/components/Button.jsx
import React from 'react';

const Button = ({
  children,
  type = 'button',
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = false,
  ...rest
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${loading ? 'btn-loading' : ''}`}
      {...rest}
    >
      {loading ? (
        <span className="btn-spinner" aria-label="Loading…" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
