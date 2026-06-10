import { useState } from "react";

import { useNavigate, Navigate } from "react-router-dom";

import { EyeIcon, EyeSlashIcon, UserPlusIcon } from "@heroicons/react/24/solid";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase/firebase";

import googleIcon from "../assets/google.jpg";

import githubIcon from "../assets/github.jpg";

import illustration from "../assets/illustration.jpg";

const Login = () => {
  const navigate = useNavigate();

  if (auth.currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const [isSignup, setIsSignup] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  // providers
  const googleProvider = new GoogleAuthProvider();

  const githubProvider = new GithubAuthProvider();

  // email/password login/signup
  const handleAuth = async (e) => {
    e.preventDefault();

    setError("");

    // username validation
    if (isSignup) {
      if (name.trim().length < 5) {
        setError("Username must be at least 5 characters.");
        return;
      }

      if (!/[A-Za-z]/.test(name.trim())) {
        setError("Username must contain at least one letter.");
        return;
      }

      if (!/^[A-Za-z0-9 ]+$/.test(name.trim())) {
        setError("Only letters, numbers, and spaces are allowed.");
        return;
      }
    }

    try {
      // keep user logged in
      await setPersistence(auth, browserLocalPersistence);

      // password validation
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

      // signup password validation
      if (isSignup && !passwordRegex.test(password)) {
        setError(
          "Password must contain uppercase, lowercase, number, special character and 8+ characters.",
        );

        return;
      }

      // create account
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // set display name
        await updateProfile(userCredential.user, {
          displayName: name,
        });
      } else {
        // login
        await signInWithEmailAndPassword(auth, email, password);
      }

      // go dashboard
      navigate("/dashboard");
    } catch (error) {
      console.log(error.message);

      // custom errors
      if (error.code === "auth/invalid-credential") {
        setError("Wrong email or password.");
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // google login
  const handleGoogleLogin = async () => {
    try {
      // keep user logged in
      await setPersistence(auth, browserLocalPersistence);

      await signInWithPopup(auth, googleProvider);

      navigate("/dashboard");
    } catch (error) {
      console.log(error.message);

      setError("Google login failed.");
    }
  };

  // github login
  const handleGithubLogin = async () => {
    try {
      // keep user logged in
      await setPersistence(auth, browserLocalPersistence);

      await signInWithPopup(auth, githubProvider);

      navigate("/dashboard");
    } catch (error) {
      console.log(error.message);

      setError("GitHub login failed.");
    }
  };

  // forgot password
  const handleForgotPassword = async () => {
    // email required
    if (!email) {
      setError("Enter your email first.");

      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      setError("Password reset email sent.");
    } catch (error) {
      console.log(error.message);

      setError("Failed to send reset email.");
    }
  };

  return (
    <div className="intro">
      <div>
        {/* heading */}
        {isSignup ? (
          <>
            <h1>
              Take Control
              <br />
              of <span className="accent">Your Money</span>
            </h1>

            <p>
              Personal budgeting is the secret to financial freedom. Start your
              journey today.
            </p>
          </>
        ) : (
          <>
            <h1>Welcome Back</h1>

            <p>Log in to manage your budgets and track your expenses.</p>
          </>
        )}

        {/* auth card */}
        <div className="auth-card">
          <h1>{isSignup ? "Create an account" : "Log in"}</h1>

          {/* switch login/signup */}
          <p className="small-top-text">
            {isSignup ? (
              <>
                Already have an account?
                <a
                  href="#"
                  className="auth-link"
                  onClick={(e) => {
                    e.preventDefault();

                    // clear old errors
                    setError("");

                    // clear password
                    setPassword("");

                    // switch to login
                    setIsSignup(false);
                  }}
                >
                  {" "}
                  Log in
                </a>
              </>
            ) : (
              <>
                Don’t have an account?
                <a
                  href="#"
                  className="auth-link"
                  onClick={(e) => {
                    e.preventDefault();

                    // clear old errors
                    setError("");

                    // clear password
                    setPassword("");

                    // switch to signup
                    setIsSignup(true);
                  }}
                >
                  {" "}
                  Create one
                </a>
              </>
            )}
          </p>

          {/* form */}
          <form onSubmit={handleAuth} className="auth-fields">
            {/* name */}
            {isSignup && (
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            {/* email */}
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {/* password */}
            <div className="password-box">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* show hide password */}
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

            {/* forgot password */}
            {!isSignup && (
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  background: "none",

                  border: "none",

                  color: "#2ec4cc",

                  cursor: "pointer",

                  fontSize: "14px",

                  fontWeight: "600",

                  alignSelf: "flex-end",

                  marginTop: "-5px",
                }}
              >
                Forgot Password?
              </button>
            )}

            {/* auth message */}
            {error && (
              <div
                className="auth-error"
                style={{
                  background:
                    error === "Password reset email sent."
                      ? "rgba(34, 197, 94, 0.08)"
                      : "rgba(239, 68, 68, 0.08)",

                  border:
                    error === "Password reset email sent."
                      ? "1px solid rgba(34, 197, 94, 0.2)"
                      : "1px solid rgba(239, 68, 68, 0.2)",

                  color:
                    error === "Password reset email sent."
                      ? "#22c55e"
                      : "#ef4444",

                  padding: "12px 14px",

                  borderRadius: "10px",

                  fontSize: "14px",

                  fontWeight: "500",

                  marginTop: "5px",
                }}
              >
                {error}
              </div>
            )}

            {/* password rules */}
            {isSignup && password.length > 0 && (
              <div className="password-rules">
                <span
                  style={{
                    color: password.length >= 8 ? "#22c55e" : "#94a3b8",
                  }}
                >
                  ● 8+ chars
                </span>

                <span
                  style={{
                    color: /[A-Z]/.test(password) ? "#22c55e" : "#94a3b8",
                  }}
                >
                  ● Uppercase
                </span>

                <span
                  style={{
                    color: /[a-z]/.test(password) ? "#22c55e" : "#94a3b8",
                  }}
                >
                  ● Lowercase
                </span>

                <span
                  style={{
                    color: /\d/.test(password) ? "#22c55e" : "#94a3b8",
                  }}
                >
                  ● Number
                </span>

                <span
                  style={{
                    color: /[@$!%*?&]/.test(password) ? "#22c55e" : "#94a3b8",
                  }}
                >
                  ● Special
                </span>
              </div>
            )}

            {/* submit */}
            <button
              type="submit"
              className="btn btn--dark"
              style={{
                width: "fit-content",

                padding: "12px 22px",

                borderRadius: "10px",

                display: "flex",

                alignItems: "center",

                gap: "8px",

                fontWeight: "600",

                fontSize: "16px",
              }}
            >
              <span>{isSignup ? "Create Account" : "Login"}</span>

              <UserPlusIcon width={18} />
            </button>

            {/* divider */}
            <p className="continue-text">Or continue with</p>

            {/* social login */}
            <div className="social-login">
              {/* google */}
              <button
                type="button"
                className="social-btn wide"
                onClick={handleGoogleLogin}
              >
                <img src={googleIcon} alt="Google" />

                <span>Google</span>
              </button>

              {/* github */}
              <button
                type="button"
                className="social-btn wide"
                onClick={handleGithubLogin}
              >
                <img src={githubIcon} alt="GitHub" />

                <span>GitHub</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* illustration */}
      <img src={illustration} alt="Budget Illustration" width={600} />
    </div>
  );
};

export default Login;
