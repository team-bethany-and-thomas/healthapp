"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

const LoginPage: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      setLoginError("");
      await login(email, password);
      router.push("/dashboard"); // Redirect to dashboard after successful login
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError("Login failed. Please check your credentials.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
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
            <h2 className="card-title text-2xl mb-4">Welcome Back!</h2>
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
          <h2 className="card-title text-2xl mb-6 text-center">Login</h2>
          
          {loginError && (
            <div className="alert alert-error mb-4">
              <span>{loginError}</span>
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
              onClick={handleLogin}
              className="btn btn-primary w-full"
              disabled={!email || !password}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;