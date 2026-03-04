"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";

interface UserProfile {
  github_login: string;
  name: string;
  avatar_url: string;
}

export default function NavHeader() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.github_login) setProfile(data);
      })
      .catch(() => null);
  }, []);

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* Left — Vantage wordmark */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 14L9 4L15 14"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5.5 10H12.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-gray-900">
          Vantage
        </span>
      </div>

      {/* Right — user identity */}
      {profile && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              width={24}
              height={24}
              className="rounded-full ring-1 ring-gray-200"
            />
            <span className="text-sm font-medium text-gray-800 max-w-[140px] truncate hidden sm:block">
              {profile.name}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-gray-400 hidden sm:block"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Dropdown */}
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                {/* Identity */}
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {profile.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    @{profile.github_login}
                  </p>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="text-gray-400"
                    >
                      <path
                        d="M5 2H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2M10 10l3-3-3-3M7 7h6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
