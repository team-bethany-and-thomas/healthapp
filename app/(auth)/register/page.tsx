"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { UserPlus, User } from "lucide-react";
import styles from "./register.module.css";

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

const RegistrationPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, register, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [uiState, setUiState] = useState({
    isRegistering: false,
    message: "",
    validationErrors: {} as ValidationErrors,
  });

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (!/^[a-zA-Z\s]+$/.test(name))
      return "Name can only contain letters and spaces";
    return undefined;
  };

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
    let error: string | undefined;
    switch (field) {
      case "name":
        error = validateName(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
    }

    setUiState((prev) => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, [field]: error },
    }));
  };

  // Register handler
  const handleRegister = async (): Promise<void> => {
    setUiState((prev) => ({ ...prev, message: "" }));

    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (nameError || emailError || passwordError) {
      setUiState((prev) => ({
        ...prev,
        validationErrors: {
          name: nameError,
          email: emailError,
          password: passwordError,
        },
      }));
      return;
    }

    try {
      setUiState((prev) => ({ ...prev, isRegistering: true }));

      await register(formData.email, formData.password, formData.name);

      setUiState((prev) => ({
        ...prev,
        message: "Registration successful! Redirecting to dashboard...",
      }));

      router.push("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      setUiState((prev) => ({
        ...prev,
        message: "Registration failed. Please try again.",
      }));
    } finally {
      setUiState((prev) => ({ ...prev, isRegistering: false }));
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
    handleRegister();
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
          <h2 className={styles['register-title']}>Welcome!</h2>
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

  if (authLoading) {
    return loadingComponent;
  }

  if (user) {
    return userWelcomeComponent;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className={styles['register-container']}>
        <div className={styles['register-header']}>
          <UserPlus className={styles['register-icon']} />
          <h1 className={styles['register-title']}>Create Account</h1>
        </div>
        
        {uiState.message && (
          <div className={`${styles.alert} ${uiState.message.includes('successful') ? styles['alert-success'] : styles['alert-error']}`}>
            <span>{uiState.message}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles['register-form']}>
          <div className={styles['form-group']}>
            <label className={styles['form-label']}>
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your full name"
              className={`${styles['form-input']} ${uiState.validationErrors.name ? styles.error : ''}`}
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
            {uiState.validationErrors.name && (
              <span className={styles['error-message']}>{uiState.validationErrors.name}</span>
            )}
          </div>
          
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
            className={`${styles['register-button']} ${uiState.isRegistering ? 'opacity-75' : ''}`}
            disabled={uiState.isRegistering}
          >
            {uiState.isRegistering && <div className={styles['loading-spinner']}></div>}
            {uiState.isRegistering ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}>OR</div>
          
        <div className={styles['alternate-action']}>
          <p>Already have an account?</p>
          <button 
            onClick={() => router.push('/login')}
            className={styles['alternate-button']}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RegistrationPage);
