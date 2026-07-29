import { forwardRef } from 'react';

/**
 * InputField — labelled form field with integrated error display.
 *
 * Uses forwardRef so that React Hook Form's register() callback ref
 * is forwarded to the native <input> element. Without forwardRef,
 * React 18 drops the ref before it reaches this component, which means
 * RHF never receives the DOM node, breaking valueAsNumber coercion,
 * focus-on-error, and per-field trigger() validation.
 *
 * Props:
 *   id, label, error, ...rest  (passed straight to <input>)
 */
const InputField = forwardRef(function InputField(
  { id, label, error, className = '', ...rest },
  ref,
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`input ${error ? 'border-rose-500 focus:ring-rose-500' : ''} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-rose-400 mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
