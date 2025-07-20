"use client";
import { useState, useEffect } from "react";
import { account } from "../../lib/appwrite";
import { Models } from "appwrite";

const LoginPage: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is already logged in when component mounts
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await account.get();
        setLoggedInUser(user);
      } catch (error) {
        // User is not logged in
        setLoggedInUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      setLoggedInUser(await account.get());
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async (): Promise<void> => {
    await account.deleteSession("current");
    setLoggedInUser(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
      <p>Not logged in</p>
      <form>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="button" onClick={() => login(email, password)}>
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
