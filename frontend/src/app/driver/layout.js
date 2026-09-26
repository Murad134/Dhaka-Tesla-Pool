"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function DriverLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "DRIVER")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "DRIVER") {
    return null; // Return null to prevent flashing the protected content
  }

  return <>{children}</>;
}
