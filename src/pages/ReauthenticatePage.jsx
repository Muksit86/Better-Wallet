import { useState } from "react";

import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";

import {
  reauthenticatePasswordUser,
  reauthenticateGoogleUser,
  reauthenticateGithubUser,
} from "../firebase/reauthenticate";

import { deleteAccountCompletely } from "../firebase/deleteAccount";

import {
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";

import emailIcon from "../assets/email.png";

import warningIcon from "../assets/warning.png";

import { auth } from "../firebase/firebase";

import googleIcon from "../assets/google.jpg";

import githubIcon from "../assets/github.jpg";

import illustration from "../assets/illustration.jpg";

const ReauthenticatePage = () => {
  const navigate = useNavigate();

  const user = auth.currentUser;

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const providerId =
    user?.providerData?.find((provider) => provider.providerId !== "firebase")
      ?.providerId || "password";

  const handleDelete = async (reauthFunction) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);

      await reauthFunction();

      await deleteAccountCompletely();

      toast.success("Account deleted successfully!");

      navigate("/");
    } catch (error) {
      console.error(error);

      // User selected the wrong Google/GitHub account
      if (error?.code === "auth/user-mismatch") {
        toast.error(`Please choose ${user?.email}`);

        // Email/password authentication failed
      } else if (error?.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (error?.code === "auth/invalid-credential") {
        toast.error("Incorrect password");

        // User closed the Google/GitHub popup
      } else if (error?.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in was cancelled");

        // Any other unexpected error
      } else {
        toast.error("Failed to delete account");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmailVerify = async () => {
    if (!password.trim()) {
      toast.error("Please enter your password");
      return;
    }

    await handleDelete(() => reauthenticatePasswordUser(password));
  };

  const handleGoogleVerify = async () => {
    await handleDelete(reauthenticateGoogleUser);
  };

  const handleGithubVerify = async () => {
    await handleDelete(reauthenticateGithubUser);
  };

  // subtitle changes based on provider
  const getSubtitle = () => {
    if (providerId === "google.com")
      return "For security reasons, please verify your Google account to continue with account deletion.";
    if (providerId === "github.com")
      return "For security reasons, please verify your GitHub account to continue with account deletion.";
    return "For security reasons, please confirm your password to continue with account deletion.";
  };

  return (
    <div className="intro">
      <div>
        {/* heading */}
        <h1
          style={{
            whiteSpace: "nowrap",
          }}
        >
          Verify Your <span className="accent">Identity</span>
        </h1>

        <p style={{ maxWidth: "550px" }}>{getSubtitle()}</p>

        {/* card */}
        <div
          className="auth-card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0",
          }}
        >
          {/* provider icon circle */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background:
                providerId === "password"
                  ? "rgba(20,184,166,0.12)"
                  : providerId === "github.com"
                    ? "#f1f5f9"
                    : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px",
            }}
          >
            {providerId === "password" && (
              <img
                src={emailIcon}
                alt="Email"
                style={{
                  width: 48,
                  height: 48,
                  objectFit: "contain",
                }}
              />
            )}
            {providerId === "google.com" && (
              <img
                src={googleIcon}
                alt="Google"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
            {providerId === "github.com" && (
              <img
                src={githubIcon}
                alt="GitHub"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>

          {/* signed in with */}
          <p
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: "#64748b",
            }}
          >
            You are signed in with
          </p>

          <p
            style={{
              fontWeight: "700",
              fontSize: "18px",
              margin: "2px 0 16px",
              color: "#0f172a",
            }}
          >
            {providerId === "password"
              ? "Email & Password"
              : providerId === "google.com"
                ? "Google"
                : "GitHub"}
          </p>

          {/* divider with icon */}
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                flex: 1,
                height: "2px",
                background: "#cbd5e1",
              }}
            />

            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "rgba(46,196,204,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ShieldCheckIcon
                width={22}
                style={{
                  color: "#2ec4cc",
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                height: "2px",
                background: "#cbd5e1",
              }}
            />
          </div>

          {/* provider-specific content */}
          <div className="auth-fields" style={{ width: "100%", gap: "12px" }}>
            {/* Email / Password */}
            {providerId === "password" && (
              <>
                <label
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#0f172a",
                  }}
                >
                  Enter your password
                </label>

                <div className="password-box">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeIcon width={20} />
                    ) : (
                      <EyeSlashIcon width={20} />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  className="social-btn wide"
                  onClick={handleEmailVerify}
                  disabled={isDeleting}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "15px",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <span>{isDeleting ? "Deleting..." : "Verify Identity"}</span>
                </button>
              </>
            )}

            {/* Google */}
            {providerId === "google.com" && (
              <>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#475569",
                    textAlign: "center",
                    margin: "0 0 4px",
                    lineHeight: "1.6",
                  }}
                >
                  To continue, please re-authenticate with Google.
                  <br />A secure Google sign-in window will open.
                </p>

                <button
                  type="button"
                  className="social-btn wide"
                  onClick={handleGoogleVerify}
                  disabled={isDeleting}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "15px",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <img src={googleIcon} alt="Google" />
                  <span>
                    {isDeleting ? "Deleting..." : "Continue with Google"}
                  </span>
                </button>
              </>
            )}

            {/* GitHub */}
            {providerId === "github.com" && (
              <>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    textAlign: "center",
                    margin: "0 0 4px",
                    lineHeight: "1.6",
                  }}
                >
                  To continue, please re-authenticate with GitHub.
                  <br />A secure GitHub sign-in window will open.
                </p>

                <button
                  type="button"
                  className="social-btn wide"
                  onClick={handleGithubVerify}
                  disabled={isDeleting}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "15px",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                >
                  <img src={githubIcon} alt="GitHub" />
                  <span>
                    {isDeleting ? "Deleting..." : "Continue with GitHub"}
                  </span>
                </button>
              </>
            )}

            {/* Cancel button */}
            <button
              type="button"
              className="social-btn wide"
              onClick={() => navigate("/dashboard")}
              disabled={isDeleting}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "15px",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              Cancel
            </button>

            {/* Warning box */}
            <div
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                padding: "14px 16px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginTop: "4px",
              }}
            >
              <img
                src={warningIcon}
                alt="Warning"
                style={{
                  width: 23,
                  height: 23,
                  flexShrink: 0,
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "#0f172a",
                    lineHeight: "1.3",
                  }}
                >
                  Account deletion is permanent.
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#475569",
                    lineHeight: "1.4",
                  }}
                >
                  All your expenses, budgets, and account data will be deleted
                  and cannot be recovered.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* illustration */}
      <img src={illustration} alt="Budget Illustration" width={600} />
    </div>
  );
};

export default ReauthenticatePage;
