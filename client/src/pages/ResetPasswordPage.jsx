import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/api/auth.api.js';
import { useAuth } from '@/context/AuthContext.jsx';
import AuthLayout from '@/components/layout/AuthLayout.jsx';
import InputField from '@/components/common/InputField.jsx';
import Spinner from '@/components/common/Spinner.jsx';
import Alert from '@/components/common/Alert.jsx';

function ResetPasswordPage() {
  const { token } = useParams();
  const { updateLocalUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ password: '', confirm: '' });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);

  const validate = () => {
    const e = {};
    if (form.password.length < 8)          e.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain a number';
    if (form.password !== form.confirm)    e.confirm  = 'Passwords do not match';
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
      const { data } = await authAPI.resetPassword(token, { password: form.password });
      // Auto-login after reset
      localStorage.setItem('token', data.data.token);
      updateLocalUser(data.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err?.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {apiError && (
          <div className="flex flex-col gap-3">
            <Alert type="error">{apiError}</Alert>
            <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300 text-center transition-colors">
              Request a new reset link
            </Link>
          </div>
        )}

        <InputField
          id="reset-password"
          name="password"
          type="password"
          label="New password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />

        <InputField
          id="reset-confirm"
          name="confirm"
          type="password"
          label="Confirm new password"
          placeholder="••••••••"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          error={errors.confirm}
        />

        <button
          id="reset-submit"
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-11"
        >
          {loading ? <Spinner size="sm" /> : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
