"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback:
    "Something went wrong during sign-in. Please try again.",
  OAuthSignin:
    "Could not start the GitHub sign-in flow. Please try again.",
  AccessDenied:
    "Authorization was cancelled. Please sign in to continue.",
  Verification: "The sign-in link is no longer valid.",
  Default: "An unexpected error occurred. Please try again.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const reason = searchParams.get("reason");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default)
    : null;

  const sessionExpiredMessage =
    reason === "session_expired"
      ? "Your session has expired. Please sign in again."
      : null;

  const notice = sessionExpiredMessage ?? errorMessage;

  function handleSignIn() {
    signIn("github", { callbackUrl });
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="text-white"
            >
              <path
                d="M3 14L9 4L15 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.5 10H12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight text-gray-900">
            Vantage
          </span>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Sign in to Vantage
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Use your GitHub account to continue.
          </p>

          {/* Error / notice banner */}
          {notice && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="mt-0.5 shrink-0"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 5v3.5M8 11h.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {notice}
            </div>
          )}

          {/* GitHub sign-in button */}
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 h-10 px-4 bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            <GitHubIcon />
            Sign in with GitHub
          </button>

          <p className="mt-5 text-xs text-center text-gray-400 leading-relaxed">
            Vantage requests access to your repositories and organisation
            membership to build your project list.
          </p>
        </div>

        <p className="mt-5 text-xs text-center text-gray-400">
          Spec-driven development — built for teams.
        </p>
      </div>
    </main>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.254-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026a9.578 9.578 0 0 1 2.504-.337c.85.004 1.705.114 2.504.337 1.909-1.294 2.748-1.026 2.748-1.026.546 1.377.202 2.393.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.934.359.31.678.919.678 1.852 0 1.338-.012 2.415-.012 2.741 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
