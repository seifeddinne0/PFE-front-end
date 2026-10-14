"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      // Not authenticated -> redirect to login (replace so history is clean)
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) return null; // or a loader
  return <>{children}</>;
}
