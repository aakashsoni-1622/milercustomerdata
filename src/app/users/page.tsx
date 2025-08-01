"use client";

import { useAuth } from "@/components/AuthProvider";
import { UsersTable } from "@/components/UsersTable";
import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const { user, loading } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (user) {
      // Only SUPER_ADMIN and ADMIN can access user management
      setHasPermission(["SUPER_ADMIN", "ADMIN"].includes(user.role));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center">Loading...</div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center text-red-600">
            Please log in to access this page.
          </div>
        </Card>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <div className="text-center text-red-600">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p>You don&apos;t have permission to access user management.</p>
            <p className="text-sm text-gray-600 mt-2">
              Only Super Admins and Admins can manage users.
            </p>
            <p className="text-sm text-gray-600">
              Your current role: <span className="font-medium">{user.role.replace("_", " ")}</span>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage system users, roles, and permissions
        </p>
      </div>

      <UsersTable currentUserRole={user.role} />
    </div>
  );
}