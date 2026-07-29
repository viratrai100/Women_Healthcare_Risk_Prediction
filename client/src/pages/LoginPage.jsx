import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthLayout from '@/components/layout/AuthLayout.jsx';
import InputField from '@/components/common/InputField.jsx';
import Spinner from '@/components/common/Spinner.jsx';
import Alert from '@/components/common/Alert.jsx';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
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
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your healthcare account"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {apiError && <Alert type="error">{apiError}</Alert>}

        <InputField
          id="login-email"
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
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className={`input ${errors.password ? 'border-rose-500 focus:ring-rose-500' : ''}`}
          />
          {errors.password && (
            <p className="text-xs text-rose-400">{errors.password}</p>
          )}
        </div>

        <button
          id="login-submit"
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11 mt-1"
        >
          {loading ? <Spinner size="sm" /> : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default LoginPage;
