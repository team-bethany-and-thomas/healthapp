"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { LogIn, User, CheckCircle } from "lucide-react";
import styles from "./login.module.css";

interface ValidationErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [uiState, setUiState] = useState({
    loginError: "",
    validationErrors: {} as ValidationErrors,
    isSubmitting: false,
    showSuccess: false,
  });
  const router = useRouter();

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 6)
      return "Password must be at least 6 characters long";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one capital letter";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      return "Password must contain at least one special character";
    return undefined;
  };

  // Input change handler
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate on change and update errors
    const error =
      field === "email" ? validateEmail(value) : validatePassword(value);
    setUiState((prev) => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, [field]: error },
    }));
  };

  // Login handler
  const handleLogin = async () => {
    setUiState((prev) => ({ ...prev, loginError: "" }));

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setUiState((prev) => ({
        ...prev,
        validationErrors: { email: emailError, password: passwordError },
      }));
      return;
    }

    setUiState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      await login(formData.email, formData.password);
      
      // Show success confirmation
      setUiState((prev) => ({ ...prev, showSuccess: true }));
      
      // Wait 2 seconds to show success message, then redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (error) {
      console.error("Login failed:", error);
      setUiState((prev) => ({
        ...prev,
        loginError: "Login failed. Please check your credentials.",
      }));
    } finally {
      setUiState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  // Memoized loading component
  const loadingComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className={styles['loading-spinner']}></div>
      <span>Loading...</span>
    </div>
  ), []);

  // Memoized user welcome component
  const userWelcomeComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className={styles['register-container']}>
        <div className={styles['register-header']}>
          <User className={styles['register-icon']} />
          <h2 className={styles['register-title']}>Welcome Back!</h2>
        </div>
        <p className="mb-4">Logged in as {user?.name}</p>
        <button 
          type="button" 
          onClick={handleLogout}
          className={styles['register-button']}
        >
          Logout
        </button>
      </div>
    </div>
  ), [user?.name, handleLogout]);

  // Success confirmation component
  const successConfirmation = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-primary/20">
        <div className="flex justify-center mb-6">
          <div className="bg-success rounded-full p-4">
            <CheckCircle className="w-12 h-12 text-success-content" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-base-content mb-4">
          Welcome Back!
        </h2>
        
        <p className="text-base-content/80 mb-6">
          You have successfully logged in. Redirecting to your dashboard...
        </p>
        
        <div className="flex justify-center">
          <div className="loading loading-spinner loading-md text-primary"></div>
        </div>
        
        <div className="mt-6">
          <div className="bg-primary/10 rounded-lg p-3">
            <p className="text-sm text-primary font-medium">
              Logged in as: {user?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  ), [user?.email]);

  if (isLoading) {
    return loadingComponent;
  }

  if (user && uiState.showSuccess) {
    return successConfirmation;
  }

  if (user) {
    return userWelcomeComponent;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className={styles['login-container']}>
        <div className={styles['login-header']}>
          <LogIn className={styles['login-icon']} />
          <h1 className={styles['login-title']}>Login</h1>
        </div>
        
        {uiState.loginError && (
          <div className={`${styles.alert} ${styles['alert-error']}`}>
            <span>{uiState.loginError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles['login-form']}>
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className={`${styles['form-input']} ${uiState.validationErrors.email ? styles.error : ''}`}
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
            {uiState.validationErrors.email && (
              <span className={styles['error-message']}>{uiState.validationErrors.email}</span>
            )}
          </div>

          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className={`${styles['form-input']} ${uiState.validationErrors.password ? styles.error : ''}`}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
            />
            {uiState.validationErrors.password && (
              <span className={styles['error-message']}>{uiState.validationErrors.password}</span>
            )}
          </div>

          <button 
            type="submit" 
            className={`${styles['login-button']} ${uiState.isSubmitting ? 'opacity-75' : ''}`}
            disabled={uiState.isSubmitting}
          >
            {uiState.isSubmitting && <div className={styles['loading-spinner']}></div>}
            {uiState.isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className={styles.divider}>OR</div>

        <div className={styles['alternate-action']}>
          <p>Don&apos;t have an account?</p>
          <button 
            onClick={() => router.push('/register')}
            className={styles['alternate-button']}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginPage);
