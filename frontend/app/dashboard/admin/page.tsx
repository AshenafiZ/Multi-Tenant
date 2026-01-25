import { Suspense } from 'react';
import AdminDashboardContent from './admin-dashboard';

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading admin dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
