import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BookOpen,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' // 'user' or 'librarian'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingApprovalInfo, setPendingApprovalInfo] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword) {
      setError('All fields are required. Please fill in all fields.');
      return;
    }

    // Email format validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    // Password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role
      });

      if (formData.role === 'librarian' || result?.pendingApproval) {
        // Librarian registration requires admin review
        setPendingApprovalInfo({
          name: formData.name,
          email: formData.email
        });
      } else {
        // Regular User / Member registration succeeds immediately
        navigate('/my-library', { replace: true });
      }
    } catch (err) {
      setError(err.friendlyMessage || err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // If Librarian application was submitted and is pending approval
  if (pendingApprovalInfo) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6 p-8 rounded-3xl glass-card border border-indigo-500/20 shadow-2xl animate-fadeIn text-center">
          <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Application Awaiting Approval
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Your librarian staff account has been created for <span className="font-semibold text-slate-800 dark:text-slate-200">{pendingApprovalInfo.email}</span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-200">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Next Steps for Staff Authorization:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>An Administrator will review your credentials and staff application.</li>
              <li>Once approved, your account will be activated immediately.</li>
              <li>You can then sign in to access the Librarian Circulation Desk.</li>
            </ul>
          </div>

          <Link
            to="/login"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Proceed to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 p-8 rounded-3xl glass-card border border-slate-200 dark:border-slate-800 shadow-2xl animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-600/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create Library Account</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Register as a library reader or staff member</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register As Selector: Exactly 2 options: User & Librarian */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Register As *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('user')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'user'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>User (Reader)</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('librarian')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  formData.role === 'librarian'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Librarian</span>
              </button>
            </div>
            {formData.role === 'librarian' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                * Note: Librarian accounts require Administrator review and approval before login.
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="reg-name">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="reg-name"
                type="text"
                name="name"
                required
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="reg-email">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="reg-email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="reg-password">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="reg-confirm">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="reg-confirm"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                required
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Registration...</span>
              </>
            ) : (
              <span>{formData.role === 'librarian' ? 'Submit Librarian Application' : 'Create Library Account'}</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
