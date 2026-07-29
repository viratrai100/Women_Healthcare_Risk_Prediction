import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext.jsx';
import { userAPI } from '@/api/auth.api.js';
import InputField from '@/components/common/InputField.jsx';
import Spinner from '@/components/common/Spinner.jsx';
import Alert from '@/components/common/Alert.jsx';
import { formatDate } from '@/utils/formatters.js';

function ProfilePage() {
  const { user, updateLocalUser, logout } = useAuth();

  // ── Profile form ──────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Password form ─────────────────────────────────────────────────────────
  const [pwForm, setPwForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwMsg, setPwMsg]       = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // ── Delete account ────────────────────────────────────────────────────────
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setProfileForm({ name: user?.name || '' });
  }, [user]);

  // ── Profile update ────────────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileErrors({ name: 'Name is required' });
      return;
    }
    setProfileLoading(true);
    setProfileMsg('');
    try {
      const { data } = await userAPI.updateProfile({ name: profileForm.name });
      updateLocalUser(data.data.user);
      setProfileMsg('✓ Profile updated successfully.');
    } catch (err) {
      setProfileMsg(err?.response?.data?.message || 'Update failed.');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Password change ───────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Current password is required';
    if (pwForm.newPassword.length < 8) errs.newPassword = 'At least 8 characters';
    else if (!/[A-Z]/.test(pwForm.newPassword)) errs.newPassword = 'Must contain an uppercase letter';
    else if (!/[0-9]/.test(pwForm.newPassword)) errs.newPassword = 'Must contain a number';
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    setPwMsg('');
    try {
      await userAPI.updateProfile({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwMsg('✓ Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwMsg(err?.response?.data?.message || 'Password update failed.');
    } finally {
      setPwLoading(false);
    }
  };

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await userAPI.deleteAccount();
      await logout();
    } catch {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your account information and security</p>
      </div>

      {/* ── Account overview ─────────────────────────────────────────────── */}
      <div className="card flex items-center gap-4">
        <div className="flex-shrink-0 h-16 w-16 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-2xl font-bold text-primary-400 select-none">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-white text-lg">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="badge bg-primary-500/15 text-primary-400 capitalize">{user?.role}</span>
            <span className="text-xs text-slate-500">
              Joined {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Update name ───────────────────────────────────────────────────── */}
      <div className="card flex flex-col gap-5">
        <div>
          <h3 className="font-semibold text-white">Personal Information</h3>
          <p className="text-xs text-slate-400 mt-0.5">Update your display name</p>
        </div>

        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
          <InputField
            id="profile-name"
            name="name"
            type="text"
            label="Full name"
            value={profileForm.name}
            onChange={(e) => {
              setProfileForm({ name: e.target.value });
              setProfileErrors({});
              setProfileMsg('');
            }}
            error={profileErrors.name}
          />
          <div className="flex items-center gap-3">
            <button
              id="profile-save"
              type="submit"
              disabled={profileLoading}
              className="btn-primary"
            >
              {profileLoading ? <Spinner size="sm" /> : 'Save changes'}
            </button>
            {profileMsg && (
              <span className={`text-sm ${profileMsg.startsWith('✓') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {profileMsg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Change password ───────────────────────────────────────────────── */}
      <div className="card flex flex-col gap-5">
        <div>
          <h3 className="font-semibold text-white">Change Password</h3>
          <p className="text-xs text-slate-400 mt-0.5">Use a strong password you don't reuse elsewhere</p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          {pwMsg && (
            <Alert type={pwMsg.startsWith('✓') ? 'success' : 'error'}>{pwMsg}</Alert>
          )}
          <InputField
            id="pw-current"
            name="currentPassword"
            type="password"
            label="Current password"
            placeholder="••••••••"
            value={pwForm.currentPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, currentPassword: e.target.value })); setPwErrors((p) => ({ ...p, currentPassword: '' })); setPwMsg(''); }}
            error={pwErrors.currentPassword}
          />
          <InputField
            id="pw-new"
            name="newPassword"
            type="password"
            label="New password"
            placeholder="••••••••"
            value={pwForm.newPassword}
            onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwErrors((p) => ({ ...p, newPassword: '' })); setPwMsg(''); }}
            error={pwErrors.newPassword}
          />
          <InputField
            id="pw-confirm"
            name="confirm"
            type="password"
            label="Confirm new password"
            placeholder="••••••••"
            value={pwForm.confirm}
            onChange={(e) => { setPwForm((p) => ({ ...p, confirm: e.target.value })); setPwErrors((p) => ({ ...p, confirm: '' })); setPwMsg(''); }}
            error={pwErrors.confirm}
          />
          <button
            id="pw-submit"
            type="submit"
            disabled={pwLoading}
            className="btn-primary self-start"
          >
            {pwLoading ? <Spinner size="sm" /> : 'Update password'}
          </button>
        </form>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <div className="card border-rose-500/30 flex flex-col gap-4">
        <div>
          <h3 className="font-semibold text-rose-400">Danger Zone</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
        </div>
        {!confirmDelete ? (
          <button
            id="delete-account-btn"
            onClick={() => setConfirmDelete(true)}
            className="btn-ghost !text-rose-400 hover:!border-rose-500 self-start"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <Alert type="error">
              Are you absolutely sure? This will permanently delete your account and all your health data.
            </Alert>
            <div className="flex gap-3">
              <button
                id="delete-confirm-btn"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="btn-primary !bg-rose-600 hover:!bg-rose-700 active:!bg-rose-800"
              >
                {deleteLoading ? <Spinner size="sm" /> : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
