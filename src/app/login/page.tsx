"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  User
} from "firebase/auth";
import { auth, firestore } from "../../../firebaseConfig";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import Link from "next/link";

// Define types for user data
interface UserData {
  role: "admin" | "student" | string;
  // Add other user fields as needed
  name?: string;
  email?: string;
}

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
  
    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setSuccess("Verification email sent! Please check your inbox.");
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }
  
      console.log("User authenticated:", user.uid); // Debug info

      //Check if user is admin
      let userDoc = await getDoc(doc(firestore, "admins", user.uid));

      if (userDoc.exists()) {
        //User is an admin
        router.push("/admin-dashboard");
        return;
      }

      //Check if user is student
      userDoc = await getDoc(doc(firestore, "students", user.uid));
      if (userDoc.exists()) {
        //User is a student
        router.push("/student-dashboard");
        return;
      }

      //No user data found
      console.error("No user data found for UID:", user.uid);
      setError("User data not found. Please contact support")
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-2">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center mb-2">{success}</p>
          )}

          <div className="flex justify-end mb-4">
            <Link href="/reset-password" className="text-blue-400 underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className={`w-full ${loading ? 'bg-blue-300' : 'bg-blue-500 hover:bg-blue-600'} text-white font-bold py-2 rounded transition duration-200`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-5 text-center">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-400 underline">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;