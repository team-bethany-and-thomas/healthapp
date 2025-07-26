"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

const RegistrationPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: authLoading, register, logout } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const handleRegister = async (): Promise<void> => {
    try {
      setIsRegistering(true);
      setMessage("");
      
      await register(email, password, name);
      
      setMessage("Registration successful! Redirecting to dashboard...");
      
      // Redirect to dashboard
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
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card bg-base-100 shadow-xl max-w-md w-full">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6 text-center">Register</h2>
          
          {message && (
            <div className={`alert ${message.includes('successful') ? 'alert-success' : 'alert-error'} mb-4`}>
              <span>{message}</span>
            </div>
          )}
          
          <form className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered"
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered"
                required
              />
            </div>
            
            <button 
              type="button" 
              onClick={handleRegister}
              className="btn btn-primary w-full"
              disabled={isRegistering || !email || !password || !name}
            >
              {isRegistering ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;