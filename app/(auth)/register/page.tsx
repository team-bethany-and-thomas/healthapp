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
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div>
        <p>Logged in as {user.name}</p>
        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Register</h2>
      {message && <p>{message}</p>}
      <form>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          type="button" 
          onClick={handleRegister}
          disabled={isRegistering || !email || !password || !name}
        >
          {isRegistering ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;