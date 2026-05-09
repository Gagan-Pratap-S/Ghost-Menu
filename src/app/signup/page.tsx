"use client";
// /signup — redirects to /onboard which handles the full public signup flow
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/onboard"); }, [router]);
  return null;
}
