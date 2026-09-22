"use client";

import { useEffect, useRef, Suspense } from "react";
import { AuthenticateWithRedirectCallback, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

function SSOCallbackContent() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    async function handleRolePostOAuth() {
      // Strictly gate execution until Clerk's user object is fully loaded with a valid ID
      if (!isLoaded || !isSignedIn || !user?.id) return;
      if (hasExecutedRef.current) return;
      hasExecutedRef.current = true;

      const currentRole = (user.publicMetadata as any)?.role;
      if (currentRole) {
        // Role already assigned
        const dest =
          currentRole === "officer" || currentRole === "inspector"
            ? "/officer"
            : currentRole === "vendor"
            ? "/vendor"
            : currentRole === "hq" || currentRole === "headquarters"
            ? "/headquarters"
            : "/consumer";
        router.replace(dest);
        return;
      }

      // First-time OAuth user with no role set yet
      let intendedRole = searchParams.get("intended_role");
      if (!intendedRole && typeof window !== "undefined") {
        intendedRole = sessionStorage.getItem("metra_oauth_pending_role");
        sessionStorage.removeItem("metra_oauth_pending_role");
      }

      if (intendedRole === "vendor" || intendedRole === "consumer") {
        try {
          const res = await fetch("/api/auth/set-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: intendedRole }),
          });
          if (res.ok) {
            router.replace(`/${intendedRole}`);
            return;
          }
        } catch (e) {
          console.error("Failed to auto-assign OAuth role:", e);
        }
      }

      // If no valid intended role could be assigned, route to mandatory selection screen
      router.replace("/select-role");
    }

    handleRolePostOAuth();
  }, [isLoaded, isSignedIn, user?.id, router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7faff] text-[#10243e]">
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        continueSignUpUrl="/sso-callback"
        signInFallbackRedirectUrl="/sso-callback"
        signUpFallbackRedirectUrl="/sso-callback"
      />
      <div className="mt-4 flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-[#0867c9] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[14px] text-[#62738a] font-medium">Completing authentication...</p>
      </div>
    </div>
  );
}

export default function SSOCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7faff] flex items-center justify-center">Loading...</div>}>
      <SSOCallbackContent />
    </Suspense>
  );
}
