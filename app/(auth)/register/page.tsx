"use client";
import { useState, useEffect } from "react";
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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const validateName = (name: string): string | undefined => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters long";
    if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters and spaces";
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
    if (password.length < 6) return "Password must be at least 6 characters long";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one capital letter";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return "Password must contain at least one special character";
    return undefined;
  };

  useEffect(() => {
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setValidationErrors({
      name: nameError,
      email: emailError,
      password: passwordError
    });
  }, [name, email, password]);

  const handleRegister = async (): Promise<void> => {
    setMessage("");
    
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (nameError || emailError || passwordError) {
      setValidationErrors({
        name: nameError,
        email: emailError,
        password: passwordError
      });
      return;
    }

    try {
      setIsRegistering(true);
      
      await register(email, password, name);
      
      setMessage("Registration successful! Redirecting to dashboard...");
      
      router.push('/dashboard');
      
    } catch (error) {
      setMessage("Registration failed. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      setMessage("");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">Welcome!</h2>
            <p className="mb-4">Logged in as {user.name}</p>
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
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary/5 via-base-100 to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary to-secondary-focus rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">Create Account</h1>
          <p className="text-base-content/70">Join us to get started with your health journey</p>
        </div>

        <div className="bg-base-100 rounded-2xl shadow-xl border border-base-200/50 p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              message.includes('successful') 
                ? 'bg-success/10 border border-success/20' 
                : 'bg-error/10 border border-error/20'
            }`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${
                message.includes('successful') ? 'text-success' : 'text-error'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {message.includes('successful') ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              <span className={`text-sm ${
                message.includes('successful') ? 'text-success' : 'text-error'
              }`}>{message}</span>
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
                  validationErrors.name 
                    ? 'border-error bg-error/5' 
                    : 'border-base-300 bg-base-50 focus:border-secondary'
                }`}
                required
              />
              {validationErrors.name && (
                <p className="mt-2 text-sm text-error flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {validationErrors.name}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
                  validationErrors.email 
                    ? 'border-error bg-error/5' 
                    : 'border-base-300 bg-base-50 focus:border-secondary'
                }`}
                required
              />
              {validationErrors.email && (
                <p className="mt-2 text-sm text-error flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {validationErrors.email}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-base-content mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
                  validationErrors.password 
                    ? 'border-error bg-error/5' 
                    : 'border-base-300 bg-base-50 focus:border-secondary'
                }`}
                required
              />
              {validationErrors.password && (
                <p className="mt-2 text-sm text-error flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {validationErrors.password}
                </p>
              )}
            </div>
            
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-secondary bg-base-100 border-base-300 rounded focus:ring-secondary/20 focus:ring-2 mt-1" 
                required
              />
              <label className="text-sm text-base-content/80 leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-secondary hover:text-secondary-focus underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-secondary hover:text-secondary-focus underline">Privacy Policy</a>
              </label>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-secondary to-secondary-focus text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isRegistering || !!validationErrors.name || !!validationErrors.email || !!validationErrors.password}
            >
              {isRegistering ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-base-200">
            <p className="text-center text-sm text-base-content/70">
              Already have an account?{' '}
              <a href="/login" className="text-secondary hover:text-secondary-focus font-medium transition-colors">
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;