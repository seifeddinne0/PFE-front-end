"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

const getDashboardPathForRole = (role?: string) => {
  if (!role) return "/dashboard";
  if (role === "ROLE_ADMIN") return "/admin/dashboard";
  if (role === "ROLE_ENSEIGNANT") return "/enseignant/dashboard";
  if (role === "ROLE_ETUDIANT") return "/etudiant/dashboard";
  return "/dashboard";
};

export default function PublicRoute({ children }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const role = sessionStorage.getItem("role") || localStorage.getItem("role") || undefined;
    if (token) {
      // Authenticated user should not access public routes like /login
      const dashboard = getDashboardPathForRole(role || undefined);
      router.replace(dashboard);
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null;
  return <>{children}</>;
}
