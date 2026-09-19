'use client';

import AuthGuard from '../../components/AuthGuard';

export default function VerifyLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
