import React from 'react';

export default function Button({ children, variant = 'primary', size = 'md', icon: Icon, onClick, disabled, className = '', type = 'button', ...props }) {
  // variant: 'primary' | 'secondary' | 'danger' | 'icon'
  // size: 'sm' | 'md' | 'lg'
  // icon: lucide-react icon component (optional)
  // Renders a <button> with appropriate CSS classes: btn btn-{variant} btn-{size}
  // If Icon provided, render it before children
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
      {children && <span>{children}</span>}
    </button>
  );
}
