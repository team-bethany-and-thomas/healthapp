"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

interface ValidationErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [uiState, setUiState] = useState({
    loginError: "",
    validationErrors: {} as ValidationErrors,
    isSubmitting: false
  });
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoginError("");
      await login(email, password);
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error) {
      console.error("Login failed:", error);
      setUiState(prev => ({ 
        ...prev, 
        loginError: "Login failed. Please check your credentials." 
      }));
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, validateEmail, validatePassword, login, router]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  // Memoized user welcome component
  const userWelcomeComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Welcome Back!</h2>
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

  if (isLoading) {
    return loadingComponent;
  }

  if (user) {
    return userWelcomeComponent;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <h1 className="card-title text-3xl mb-6 justify-center">Login</h1>
          
          {uiState.loginError && (
            <div className="alert alert-error mb-4">
              <span>{uiState.loginError}</span>
            </div>
          )}
          
          <form className="space-y-4">
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
                className={`btn btn-primary ${uiState.isSubmitting ? 'loading' : ''}`}
                disabled={uiState.isSubmitting}
              >
                {uiState.isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Don't have an account?</p>
            <button 
              onClick={() => router.push('/register')}
              className="btn btn-outline btn-secondary"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LoginPage);