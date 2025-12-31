/**
 * Admin Dashboard Page
 * Main admin dashboard page with layout
 */

import React from 'react';
import { AdminLayout, AdminDashboard } from '../../components/admin';

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}