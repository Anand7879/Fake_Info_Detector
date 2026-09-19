'use client';

import AuthGuard from '../../components/AuthGuard';

export default function HistoryLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
