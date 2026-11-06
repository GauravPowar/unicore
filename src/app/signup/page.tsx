// ============================================================
// /signup – UniCore Real & Mock Researcher Registration
// ============================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { VerifiedBadge } from '@/components/ui/Badge';
import { isIndianAcademicEmail, isValidOrcidId } from '@/lib/validators';
import { createClient } from '@/lib/supabase/client';
import { isUsingMockData } from '@/lib/mock-data';
import {
  AtSign,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [institution, setInstitution] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [collabStatus, setCollabStatus] = useState('open_to_collab');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFetchingOrcid, setIsFetchingOrcid] = useState(false);
  const [orcidSuccess, setOrcidSuccess] = useState(false);

  const isAcademic = isIndianAcademicEmail(email);
  const hasValidOrcid = orcidId.trim().length > 0 ? isValidOrcidId(orcidId.trim()) : true;

  const handleFetchOrcid = async () => {
    if (!isValidOrcidId(orcidId.trim())) return;
    setIsFetchingOrcid(true);
    setOrcidSuccess(false);
    try {
      const res = await fetch(`/api/orcid/${orcidId.trim()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.full_name) {
          setFullName(data.full_name);
          setOrcidSuccess(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingOrcid(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!fullName || !email || !password) return;

    setIsLoading(true);

    if (isUsingMockData()) {
      setTimeout(() => {
        setIsLoading(false);
        setIsSuccess(true);
        setTimeout(() => router.push('/'), 1200);
      }, 700);
      return;
    }

    // Real Supabase Auth Registration
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            institution: institution.trim() || null,
            department: department.trim() || null,
            orcid_id: orcidId.trim() || null,
            collab_status: collabStatus,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSuccess(true);

      // If session established or confirmation required
      if (data?.session) {
        setTimeout(() => router.push('/'), 1200);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Registration error. Please check your network or try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 shadow-sm space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-saffron-500 flex items-center justify-center mx-auto mb-3 shadow-md">
            <AtSign className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Join the <span className="text-brand-500">UniCore</span> Network
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect across Indian universities &amp; labs, find co-authors, and share experiments
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 p-3 rounded-xl text-red-700 dark:text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Account Created!
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAcademic
                ? 'Your institutional email has been recognized! You have been granted the Verified Researcher badge.'
                : 'Welcome aboard! Your researcher profile is active.'}
            </p>
            <div className="pt-2">
              <span className="text-xs text-brand-500 animate-pulse">
                Redirecting to feed...
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name (with Title)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Subramaniam or Arjun Mehta"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Email with Live Institutional Verification */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <span className="text-[10px] text-slate-400">
                  Use *.ac.in, *.edu.in, or *.res.in for auto-verification
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="priya@iisc.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Dynamic Institutional Badge Preview */}
              {isAcademic ? (
                <div className="mt-2 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-2.5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Institutional Email Detected!
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        Auto-assigned the Verified Researcher badge upon signup.
                      </p>
                    </div>
                  </div>
                  <VerifiedBadge />
                </div>
              ) : email.includes('@') ? (
                <p className="text-[11px] text-slate-400 mt-1">
                  Note: Non-institutional emails can still participate and verify later via ORCID.
                </p>
              ) : null}
            </div>

            {/* Institution & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="IISc, IIT Bombay, TIFR..."
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Department / Lab
                </label>
                <input
                  type="text"
                  placeholder="Centre for Ecological Sciences"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* ORCID iD with Auto-fill */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  ORCID iD (Optional)
                </label>
                <a
                  href="https://orcid.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                >
                  What is ORCID? <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0000-0002-1825-0097"
                  value={orcidId}
                  onChange={(e) => {
                    setOrcidId(e.target.value);
                    setOrcidSuccess(false);
                  }}
                  className="flex-1 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!isValidOrcidId(orcidId.trim()) || isFetchingOrcid}
                  onClick={handleFetchOrcid}
                  isLoading={isFetchingOrcid}
                  className="text-xs shrink-0"
                >
                  Verify ORCID
                </Button>
              </div>
              {orcidSuccess && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified public record. Name automatically filled!
                </p>
              )}
              {orcidId.trim().length > 0 && !hasValidOrcid && (
                <p className="text-[11px] text-red-500 mt-1">
                  Format must be 16 digits: 0000-0000-0000-0000
                </p>
              )}
            </div>

            {/* Collaboration Status */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Collaboration Status
              </label>
              <select
                value={collabStatus}
                onChange={(e) => setCollabStatus(e.target.value)}
                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="open_to_collab">Open to Collaborate</option>
                <option value="looking_for_coauthor">Looking for Co-Author</option>
                <option value="offering_mentorship">Offering Mentorship</option>
                <option value="busy">Currently Busy</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={!hasValidOrcid}
              className="w-full gap-2 mt-4"
            >
              Register &amp; Onboard <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
