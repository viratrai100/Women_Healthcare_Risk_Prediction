import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthLayout from '@/components/layout/AuthLayout.jsx';
import InputField from '@/components/common/InputField.jsx';
import Spinner from '@/components/common/Spinner.jsx';
import Alert from '@/components/common/Alert.jsx';

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name    = 'Name is required';
    if (!form.email)         e.email   = 'Email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setErrors((p) => ({ ...p, [e.target.name]: '' }));
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start your personalised health journey"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {apiError && <Alert type="error">{apiError}</Alert>}

        <InputField
          id="register-name"
          name="name"
          type="text"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />

        <InputField
          id="register-email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />

        <div className="flex flex-col gap-1.5">
          <InputField
            id="register-password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          {/* Strength bar */}
          {form.password && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      i <= strength ? strengthColors[strength] : 'bg-surface-border'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${strength >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {strengthLabels[strength]}
              </span>
            </div>
          )}
        </div>

        <InputField
          id="register-confirm"
          name="confirm"
          type="password"
          label="Confirm password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          error={errors.confirm}
        />

        <button
          id="register-submit"
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11 mt-1"
        >
          {loading ? <Spinner size="sm" /> : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
