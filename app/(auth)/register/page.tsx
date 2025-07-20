"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // App Router
import { account, ID } from "../../lib/appwrite";
import { Models } from "appwrite";

const RegistrationPage: React.FC = () => {
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const register = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setMessage("");
      
      await account.create(ID.unique(), email, password, name);
      
      // Auto-login after successful registration
      await account.createEmailPasswordSession(email, password);
      setLoggedInUser(await account.get());
      
      setMessage("Registration successful! Redirecting to dashboard...");
      
      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      setMessage("Registration failed. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await account.deleteSession("current");
    setLoggedInUser(null);
    setMessage("");
  };

  if (loggedInUser) {
    return (
      <div>
        <p>Logged in as {loggedInUser.name}</p>
        <button type="button" onClick={logout}>
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
          onClick={register}
          disabled={isLoading || !email || !password || !name}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default RegistrationPage;
