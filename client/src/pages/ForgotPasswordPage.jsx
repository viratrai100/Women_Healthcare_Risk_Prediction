import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '@/api/auth.api.js';
import AuthLayout from '@/components/layout/AuthLayout.jsx';
import InputField from '@/components/common/InputField.jsx';
import Spinner from '@/components/common/Spinner.jsx';
import Alert from '@/components/common/Alert.jsx';

function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiMessage, setApiMessage] = useState('');
  const [apiType, setApiType]   = useState('success');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setEmailError('Email is required'); return; }

    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword({ email });
      setApiMessage(data.message);
      setApiType('success');
      setSubmitted(true);

      // Dev-only: show the reset URL if server returns it
      if (data.data?.resetURL) {
        console.info('[dev] Password reset URL:', data.data.resetURL);
      }
    } catch (err) {
      setApiMessage(err?.response?.data?.message || 'Something went wrong. Please try again.');
      setApiType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link"
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-3xl">
            ✉️
          </div>
          <Alert type="success" className="text-left">{apiMessage}</Alert>
          <p className="text-sm text-slate-400">
            Check your inbox. The link expires in <strong className="text-white">10 minutes</strong>.
          </p>
          <Link to="/login" className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
            ← Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {apiMessage && <Alert type={apiType}>{apiMessage}</Alert>}

          <InputField
            id="forgot-email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
            error={emailError}
          />

          <button
            id="forgot-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11"
          >
            {loading ? <Spinner size="sm" /> : 'Send reset link'}
          </button>

          <Link
            to="/login"
            className="text-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Back to sign in
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
