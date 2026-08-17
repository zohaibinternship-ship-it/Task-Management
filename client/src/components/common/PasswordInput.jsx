import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fieldClass } from './FormField.jsx';

export default function PasswordInput({ id, value, onChange, autoComplete, required, minLength, placeholder }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${fieldClass} pr-9`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-navy-400 hover:text-navy-600"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
