"use client";

import { usePathname } from "next/navigation";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

interface Props {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/aide"];

export default function RouteGuard({ children }: Props) {
  const pathname = usePathname() || "/";

  // Keep landing page public, plus explicit public routes and their subpaths.
  const isPublic =
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isPublic) {
    return <PublicRoute>{children}</PublicRoute>;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
