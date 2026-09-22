"use client";

import { useState, useEffect, Suspense } from "react";
import { useSignUp, useUser, useClerk } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function SignUpContent() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role")?.toLowerCase() || "";
  const [selectedRole, setSelectedRole] = useState<string>(roleParam);

  // General Form states
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Officer-specific application states
  const [governmentId, setGovernmentId] = useState("");
  const [stateRegion, setStateRegion] = useState("Maharashtra (Mumbai)");
  const [designation, setDesignation] = useState("Legal Metrology Inspector");

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (roleParam) {
      setSelectedRole(roleParam);
    }
  }, [roleParam]);

  const isRestrictedRole = selectedRole === "hq" || selectedRole === "headquarters";
  const isOfficerApplication = selectedRole === "inspector" || selectedRole === "officer";

  const handleOAuthSignUp = async (role: "consumer" | "vendor") => {
    if (!isLoaded || !signUp) return;
    setError(null);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("metra_oauth_pending_role", role);
      }
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `/sso-callback?intended_role=${role}`,
        redirectUrlComplete: `/sso-callback?intended_role=${role}`,
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "Google sign-up failed");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (isOfficerApplication) {
      if (!governmentId.trim()) {
        setError("Official Government / Inspector ID is required.");
        return;
      }
      if (!stateRegion.trim()) {
        setError("Jurisdiction State / Directorate region is required.");
        return;
      }
    } else if (selectedRole !== "consumer" && selectedRole !== "vendor") {
      setError("Self-service sign-up is only available for Consumer and Vendor roles.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || fullName;
      const lastName = nameParts.slice(1).join(" ") || "";

      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setError(null);
    setIsLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });

        if (isOfficerApplication) {
          // Send to dedicated pending officer approval queue
          await fetch("/api/auth/apply-officer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              government_id: governmentId.trim(),
              state_region: stateRegion.trim(),
              designation: designation.trim() || "Legal Metrology Inspector",
              full_name: fullName.trim(),
              phone: phone.trim() || null,
              email: email.trim(),
            }),
          });

          window.location.href = "/officer/pending";
          return;
        }

        // Call server-side set-role endpoint for vendor / consumer
        await fetch("/api/auth/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: selectedRole }),
        });

        window.location.href = selectedRole === "vendor" ? "/vendor" : "/consumer";
      } else {
        setError(`Verification status: ${completeSignUp.status}`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingUserOfficerApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!governmentId.trim() || !stateRegion.trim()) {
      setError("Government ID and Jurisdiction State are required.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/apply-officer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          government_id: governmentId.trim(),
          state_region: stateRegion.trim(),
          designation: designation.trim() || "Legal Metrology Inspector",
          full_name: fullName.trim() || user?.fullName || "Legal Metrology Officer",
          phone: phone.trim() || null,
          email: user?.primaryEmailAddress?.emailAddress || email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");
      window.location.href = "/officer/pending";
    } catch (err: any) {
      setError(err.message || "Failed to submit officer application");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faff] text-[#10243e] flex flex-col">
      {/* HEADER */}
      <header className="bg-white/95 border-b border-[#dce7f2]">
        <div className="container-metra">
          <nav className="h-[76px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-[11px] overflow-hidden shadow-[0_7px_18px_rgba(8,103,201,0.25)]">
                <Image src="/METRA-closeup.png" alt="METRA" width={42} height={42} className="object-cover" />
              </div>
              <div>
                <strong className="text-[20px] font-bold tracking-[0.08em] block leading-tight">METRA</strong>
                <span className="block text-[#62738a] text-[10px] tracking-[0.03em] uppercase">
                  Metrology Enforcement &amp; Traceability
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {isSignedIn && (
                <button
                  type="button"
                  onClick={async () => {
                    await signOut({ redirectUrl: "/sign-in" });
                    setError(null);
                  }}
                  className="text-[13px] font-semibold text-[#c84c54] hover:underline"
                >
                  Sign out ({user?.primaryEmailAddress?.emailAddress?.split("@")[0]})
                </button>
              )}
              <Link href="/sign-in" className="text-[13px] font-bold text-[#0867c9] flex items-center gap-1.5">
                &larr; Back to sign in
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        {/* VIEW 1: ROLE SELECTION CARDS (IF NO ROLE CHOSEN) */}
        {!selectedRole && (
          <div className="w-full max-w-[960px]">
            <div className="text-center max-w-[620px] mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#eaf4ff] text-[#0867c9] border border-[#dce7f2] mb-3">
                <span>&#9679;</span>
                <span>Role-Based Registration</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-3">Choose your account type</h1>
              <p className="text-[14.5px] text-[#62738a] leading-relaxed">
                METRA separates public consumer services and vendor compliance tools from official state enforcement and administrative governance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Consumer Card */}
              <div
                onClick={() => setSelectedRole("consumer")}
                className="cursor-pointer bg-white border border-[#dce7f2] rounded-[18px] p-6 flex flex-col justify-between shadow-sm hover:border-[#159a68] hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e5f8ef] text-[#159a68] flex items-center justify-center text-xl font-bold mb-4">
                    &#8962;
                  </div>
                  <h3 className="text-lg font-bold mb-1">Consumer</h3>
                  <p className="text-[13px] text-[#62738a] mb-4">
                    Scan packaged goods, check MRP compliance, and report statutory violations.
                  </p>
                </div>
                <span className="text-[13px] font-extrabold text-[#159a68] flex items-center justify-between">
                  <span>Sign up as Consumer</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Vendor Card */}
              <div
                onClick={() => setSelectedRole("vendor")}
                className="cursor-pointer bg-white border border-[#dce7f2] rounded-[18px] p-6 flex flex-col justify-between shadow-sm hover:border-[#b9781a] hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#fff3df] text-[#b9781a] flex items-center justify-center text-xl font-bold mb-4">
                    &#9635;
                  </div>
                  <h3 className="text-lg font-bold mb-1">Vendor</h3>
                  <p className="text-[13px] text-[#62738a] mb-4">
                    Pre-market verification of commodity declarations and compliance advisory.
                  </p>
                </div>
                <span className="text-[13px] font-extrabold text-[#b9781a] flex items-center justify-between">
                  <span>Sign up as Vendor</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* Inspector Card (Self-Signup with HQ Approval Queue) */}
              <div
                onClick={() => setSelectedRole("inspector")}
                className="cursor-pointer bg-gradient-to-b from-[#fffdf8] to-white border border-[#e6d8b8] rounded-[18px] p-6 flex flex-col justify-between shadow-sm hover:border-[#9a6b12] hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#faf3e4] text-[#9a6b12] flex items-center justify-center text-xl font-bold mb-4">
                    &#9670;
                  </div>
                  <h3 className="text-lg font-bold mb-1">Inspector / Officer</h3>
                  <p className="text-[13px] text-[#62738a] mb-4">
                    Apply with your Government ID. Enters Legal Metrology HQ queue for verification before field authorization.
                  </p>
                </div>
                <span className="text-[13px] font-extrabold text-[#9a6b12] flex items-center justify-between">
                  <span>Apply for Officer Access</span>
                  <span>&rarr;</span>
                </span>
              </div>

              {/* HQ Card (Strictly Restricted) */}
              <div
                onClick={() => setSelectedRole("hq")}
                className="cursor-pointer bg-white border border-[#dce7f2] rounded-[18px] p-6 flex flex-col justify-between shadow-sm hover:border-[#0a2038] hover:-translate-y-1 transition-all"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#e9edf3] text-[#0a2038] flex items-center justify-center text-xl font-bold mb-4">
                    &#9672;
                  </div>
                  <h3 className="text-lg font-bold mb-1">Legal Metrology HQ</h3>
                  <p className="text-[13px] text-[#62738a] mb-4">
                    State and central regulatory governance and officer management.
                  </p>
                </div>
                <span className="text-[12px] font-bold text-[#0a2038] bg-[#e9edf3] px-2 py-1 rounded">
                  Admin Provisioned Only
                </span>
              </div>
            </div>

            <div className="text-center mt-10 text-[13px] text-[#62738a]">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#0867c9] font-bold hover:underline">
                Sign in to METRA
              </Link>
            </div>
          </div>
        )}

        {/* VIEW 2: RESTRICTED ROLE NOTICE (FOR HEADQUARTERS ONLY) */}
        {selectedRole && isRestrictedRole && (
          <div className="w-full max-w-[500px] bg-white border border-[#e6d8b8] rounded-[18px] p-8 sm:p-10 shadow-[0_18px_50px_rgba(21,62,105,0.10)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#faf3e4] text-[#7a5a0f] border border-[#e6d8b8] mb-4">
              <span>&#9670;</span>
              <span>Administrative Role Notice</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Legal Metrology HQ Directorate Access
            </h1>
            <p className="text-[14px] text-[#62738a] mb-6">
              In accordance with central security protocols, Headquarters directorate accounts are strictly <strong>never self-creatable</strong> and cannot be registered publicly.
            </p>

            <div className="bg-[#faf3e4] border border-[#e6d8b8] rounded-[12px] p-4 text-[13px] text-[#7a5a0f] leading-relaxed mb-6">
              <strong>Official Provisioning Process:</strong>
              <p className="mt-1">
                Authorized directorate personnel must have their administrative appointment credentials verified and provisioned directly by Legal Metrology State/National Administration.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/sign-in"
                className="w-full py-3 px-4 bg-[#0a2038] text-white font-bold text-[14px] rounded-[10px] text-center block hover:bg-[#153457] transition-colors"
              >
                Sign In with Issued HQ Credentials
              </Link>
              <button
                type="button"
                onClick={() => setSelectedRole("")}
                className="w-full py-2.5 px-4 bg-white border border-[#dce7f2] text-[#43566d] font-bold text-[13px] rounded-[10px] hover:bg-[#f7faff] transition-colors"
              >
                &larr; Switch to Public Self-Service Role
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: SELF-SERVICE SIGN-UP FORM (CONSUMER & VENDOR) */}
        {selectedRole && !isRestrictedRole && !isOfficerApplication && (
          <div className="w-full max-w-[480px] bg-white border border-[#dce7f2] rounded-[18px] p-8 sm:p-10 shadow-[0_18px_50px_rgba(21,62,105,0.10)]">
            <div className="flex items-center justify-between mb-4">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-extrabold ${
                  selectedRole === "vendor" ? "bg-[#fff3df] text-[#b9781a]" : "bg-[#e5f8ef] text-[#159a68]"
                }`}
              >
                <span>{selectedRole === "vendor" ? "\u25A3" : "\u2302"}</span>
                <span className="capitalize">{selectedRole} Registration</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole("")}
                className="text-[12px] text-[#62738a] hover:text-[#0867c9]"
              >
                Change role
              </button>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2">Create your account</h1>
            <p className="text-[13.5px] text-[#62738a] mb-6">
              {selectedRole === "vendor"
                ? "Run pre-market compliance checks on your packaging and products."
                : "Scan commodity labels, inspect declarations, and file complaints."}
            </p>

            {isSignedIn && !error && (
              <div className="mb-5 p-3.5 bg-[#eaf4ff] border border-[#b8daff] rounded-xl text-[#0867c9] text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold">Active session:</span>{" "}
                    <span>{user?.primaryEmailAddress?.emailAddress || "Signed in"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut({ redirectUrl: "/sign-in" });
                      setError(null);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#b8daff] text-[#0867c9] font-bold text-[11px] rounded hover:bg-[#f0f7ff] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-[#43566d]">
                  To create a separate new account, please sign out first.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-[#fde9ea] border border-[#f7c5c7] rounded-lg text-[#c84c54] text-[13px] font-medium leading-snug">
                {error}
              </div>
            )}

            <div id="clerk-captcha" className="my-2 flex justify-center" />

            {!verifying ? (
              <>
                {/* Google OAuth Button */}
                <button
                  type="button"
                  onClick={() => handleOAuthSignUp(selectedRole as "consumer" | "vendor")}
                  className="w-full mb-5 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#dce7f2] rounded-[10px] text-[14px] font-bold text-[#10243e] hover:bg-[#f7faff] transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.39 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Sign up with Google as {selectedRole === "vendor" ? "Vendor" : "Consumer"}</span>
                </button>

                <div className="relative flex items-center justify-center mb-5">
                  <div className="border-t border-[#dce7f2] w-full"></div>
                  <span className="bg-white px-3 text-[12px] text-[#62738a] font-medium absolute uppercase">
                    or with email
                  </span>
                </div>

                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  {selectedRole === "vendor" && (
                    <>
                      <div>
                        <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="bizName">
                          Business / Legal Entity Name
                        </label>
                        <input
                          id="bizName"
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Tata Consumer Products Ltd."
                          required
                          className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="gstin">
                          GSTIN (Optional)
                        </label>
                        <input
                          id="gstin"
                          type="text"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="e.g. 27AABCT3518Q1Z6"
                          className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="fullName">
                      {selectedRole === "vendor" ? "Authorized Representative Name" : "Full Name"}
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="email">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="phone">
                      Mobile Number (Optional)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="password">
                        Password (min. 8 characters)
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        required
                        className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="confirm">
                        Confirm Password
                      </label>
                      <input
                        id="confirm"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        minLength={8}
                        required
                        className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 text-white font-bold text-[14px] rounded-[10px] transition-transform ${
                      selectedRole === "vendor" ? "bg-[#b9781a] hover:bg-[#996315]" : "bg-[#159a68] hover:bg-[#0e6e4a]"
                    } ${isLoading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
                  >
                    {isLoading ? "Creating Account..." : `Create ${selectedRole === "vendor" ? "Vendor" : "Consumer"} Account`}
                  </button>
                </form>
              </>
            ) : (
              /* OTP VERIFICATION STEP */
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="p-3 bg-[#eaf4ff] border border-[#cfe5fb] rounded-[10px] text-[13px] text-[#0867c9]">
                  A 6-digit verification code was dispatched to <strong>{email}</strong>. Please enter it below:
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="code">
                    Verification Code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                    className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-center text-xl tracking-widest font-mono font-bold text-[#10243e]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#0867c9] text-white font-bold text-[14px] rounded-[10px] hover:bg-[#063d78] transition-colors"
                >
                  {isLoading ? "Verifying..." : "Verify & Finish Registration"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-[#dce7f2] text-center text-[13px] text-[#62738a]">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-[#0867c9] font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* VIEW 4: OFFICER APPLICATION FORM (QUEUE-BASED SELF-SIGNUP) */}
        {selectedRole && isOfficerApplication && (
          <div className="w-full max-w-[540px] bg-white border border-[#e6d8b8] rounded-[18px] p-8 sm:p-10 shadow-[0_18px_50px_rgba(21,62,105,0.10)]">
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-extrabold bg-[#faf3e4] text-[#8a5d00] border border-[#e6d8b8]">
                <span>&#9670;</span>
                <span>Enforcement Officer Application</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRole("")}
                className="text-[12px] text-[#62738a] hover:text-[#0867c9]"
              >
                Change role
              </button>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#10243e] mb-2">
              Apply for Officer Credentials
            </h1>
            <p className="text-[13.5px] text-[#62738a] mb-5 leading-relaxed">
              Submit your statutory credentials for Directorate verification. Applications enter the Legal Metrology HQ approval queue before field enforcement authority is granted.
            </p>

            <div className="bg-[#faf3e4] border border-[#e6d8b8] rounded-[12px] p-3.5 text-[12.5px] text-[#7a5a0f] leading-relaxed mb-6">
              <strong>Statutory Requirement Notice:</strong>
              <p className="mt-0.5">
                Officer accounts start in a non-operational <code>officer_pending</code> state until approved by Legal Metrology Headquarters.
              </p>
            </div>

            {isSignedIn && !verifying && (
              <div className="mb-6 p-4 bg-[#eaf4ff] border border-[#b8daff] rounded-xl text-[#0867c9] text-[13px]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-bold">Active session:</span>{" "}
                    <span>{user?.primaryEmailAddress?.emailAddress || "Signed in"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut({ redirectUrl: "/sign-in" });
                      setError(null);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#b8daff] text-[#0867c9] font-bold text-[11px] rounded hover:bg-[#f0f7ff] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
                <p className="text-[12px] text-[#43566d] mb-4">
                  You are currently signed in. You can apply for officer credentials directly for this account below:
                </p>

                <form onSubmit={handleExistingUserOfficerApplication} className="space-y-3.5 text-[#10243e]">
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1">
                      Government / Inspector ID *
                    </label>
                    <input
                      type="text"
                      value={governmentId}
                      onChange={(e) => setGovernmentId(e.target.value)}
                      placeholder="e.g. LM-MH-2024-889"
                      required
                      className="w-full bg-white border border-[#dce7f2] rounded-[10px] p-2.5 text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1">
                      Jurisdiction / State Directorate *
                    </label>
                    <input
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="e.g. Maharashtra (Mumbai)"
                      required
                      className="w-full bg-white border border-[#dce7f2] rounded-[10px] p-2.5 text-[13px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Legal Metrology Inspector"
                      className="w-full bg-white border border-[#dce7f2] rounded-[10px] p-2.5 text-[13px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#8a5d00] hover:bg-[#724d00] text-white font-bold text-[13px] rounded-[10px] transition-colors"
                  >
                    {isLoading ? "Submitting Application..." : "Submit Officer Application to HQ"}
                  </button>
                </form>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-[#fde9ea] border border-[#f7c5c7] rounded-lg text-[#c84c54] text-[13px] font-medium leading-snug">
                {error}
              </div>
            )}

            {!isSignedIn && !verifying && (
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="offName">
                    Full Official Name *
                  </label>
                  <input
                    id="offName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rajesh Deshmukh"
                    required
                    className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="offEmail">
                    Official Email Address *
                  </label>
                  <input
                    id="offEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. deshmukh.r@doca.gov.in"
                    required
                    className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="govId">
                      Government / Inspector ID *
                    </label>
                    <input
                      id="govId"
                      type="text"
                      value={governmentId}
                      onChange={(e) => setGovernmentId(e.target.value)}
                      placeholder="e.g. LM-MH-2024-889"
                      required
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="stateReg">
                      Jurisdiction / State *
                    </label>
                    <input
                      id="stateReg"
                      type="text"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      placeholder="e.g. Maharashtra (Mumbai)"
                      required
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="desig">
                      Official Designation
                    </label>
                    <input
                      id="desig"
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Legal Metrology Inspector"
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="offPhone">
                      Official Phone (Optional)
                    </label>
                    <input
                      id="offPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="offPass">
                      Password (min. 8 characters)
                    </label>
                    <input
                      id="offPass"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      minLength={8}
                      required
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="offConf">
                      Confirm Password
                    </label>
                    <input
                      id="offConf"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      minLength={8}
                      required
                      className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 text-white font-bold text-[14px] rounded-[10px] bg-[#8a5d00] hover:bg-[#724d00] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {isLoading ? "Submitting Application..." : "Submit Application to HQ Queue"}
                </button>
              </form>
            )}

            {verifying && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="p-3.5 bg-[#faf3e4] border border-[#e6d8b8] rounded-[10px] text-[13px] text-[#7a5a0f]">
                  A 6-digit verification code was sent to <strong>{email}</strong>. Enter it to confirm your identity and queue your application:
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#43566d] mb-1" htmlFor="offCode">
                    Verification Code
                  </label>
                  <input
                    id="offCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    autoFocus
                    className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-center text-xl tracking-widest font-mono font-bold text-[#10243e]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#8a5d00] text-white font-bold text-[14px] rounded-[10px] hover:bg-[#724d00] transition-colors"
                >
                  {isLoading ? "Submitting Application..." : "Verify & Queue for HQ Review"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-[#dce7f2] text-center text-[13px] text-[#62738a]">
              Already have an authorized officer account?{" "}
              <Link href="/sign-in" className="text-[#0867c9] font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7faff] flex items-center justify-center">Loading...</div>}>
      <SignUpContent />
    </Suspense>
  );
}
