// src/components/Input.jsx
import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  rightElement,
  error,
  ...rest
}) => {
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`input-field ${icon ? 'has-icon' : ''} ${rightElement ? 'has-right' : ''} ${error ? 'input-error' : ''}`}
          {...rest}
        />
        {rightElement && <span className="input-right">{rightElement}</span>}
      </div>
      {error && <p className="input-error-msg">{error}</p>}
    </div>
  );
};

export default Input;
