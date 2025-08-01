"use client";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

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
    name: ""
  });
  const [uiState, setUiState] = useState({
    isRegistering: false,
    message: "",
    validationErrors: {} as ValidationErrors
  });

  // Memoized validation functions
  const validateName = useCallback((name: string): string | undefined => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
    return undefined;
  }, []);

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  }, []);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return undefined;
  }, []);

  // Combined input change handler
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate on change and update errors
    let error: string | undefined;
    switch (field) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
    }
    
    setUiState(prev => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, [field]: error }
    }));
  }, [validateName, validateEmail, validatePassword]);

  // Memoized register handler
  const handleRegister = useCallback(async (): Promise<void> => {
    setUiState(prev => ({ ...prev, message: "" }));
    
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (nameError || emailError || passwordError) {
      setUiState(prev => ({
        ...prev,
        validationErrors: { name: nameError, email: emailError, password: passwordError }
      }));
      return;
    }

    try {
      setUiState(prev => ({ ...prev, isRegistering: true }));
      
      await register(formData.email, formData.password, formData.name);
      
      setUiState(prev => ({ 
        ...prev, 
        message: "Registration successful! Redirecting to dashboard..." 
      }));
      
      router.push('/dashboard');
      
    } catch (error) {
      console.error("Registration failed:", error);
      setUiState(prev => ({ 
        ...prev, 
        message: "Registration failed. Please try again." 
      }));
    } finally {
      setUiState(prev => ({ ...prev, isRegistering: false }));
    }
  }, [formData, validateName, validateEmail, validatePassword, register, router]);

  // Memoized logout handler
  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout]);

  // Memoized loading component
  const loadingComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  ), []);

  // Memoized user welcome component
  const userWelcomeComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Welcome!</h2>
          <p className="mb-4">Logged in as {user?.name}</p>
          <button 
            type="button" 
            onClick={handleLogout}
            className="btn btn-primary"
          >
            Logout
          </button>
        </div>
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <h1 className="card-title text-3xl mb-6 justify-center">Create Account</h1>
          
          {uiState.message && (
            <div className={`alert ${uiState.message.includes('successful') ? 'alert-success' : 'alert-error'} mb-4`}>
              <span>{uiState.message}</span>
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className={`input input-bordered w-full ${uiState.validationErrors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
              {uiState.validationErrors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{uiState.validationErrors.name}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className={`input input-bordered w-full ${uiState.validationErrors.email ? 'input-error' : ''}`}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
              {uiState.validationErrors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{uiState.validationErrors.email}</span>
                </label>
              )}
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className={`input input-bordered w-full ${uiState.validationErrors.password ? 'input-error' : ''}`}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
              {uiState.validationErrors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{uiState.validationErrors.password}</span>
                </label>
              )}
            </div>
            
            <div className="form-control mt-6">
              <button 
                type="submit" 
                className={`btn btn-primary ${uiState.isRegistering ? 'loading' : ''}`}
                disabled={uiState.isRegistering}
              >
                {uiState.isRegistering ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="divider">OR</div>
            
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
            <button 
              onClick={() => router.push('/login')}
              className="btn btn-outline btn-secondary"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RegistrationPage);