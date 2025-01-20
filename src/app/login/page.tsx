"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, firestore } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // Success message for verification resend
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (user.emailVerified) {
        // Check if the user is in the 'admins' collection
        let userDocRef = doc(firestore, "admins", user.uid);
        let userDoc = await getDoc(userDocRef);
  
        // If not found in 'admins', check the 'students' collection
        if (!userDoc.exists()) {
          userDocRef = doc(firestore, "students", user.uid);
          userDoc = await getDoc(userDocRef);
        }
  
        if (userDoc.exists()) {
          const userData = userDoc.data();
  
          console.log("User data:", userData);
  
          // Redirect based on role
          if (userData.role === "admin") {
            router.push("/admin-dashboard");
          } else if (userData.role === "student") {
            router.push("/student-dashboard");
          } else {
            setError("Role not defined. Please contact support.");
          }
        } else {
          setError("User data not found. Please contact support.");
        }
      } else {
        // If email is not verified, send a verification email and notify the user
        await sendEmailVerification(user);
        setSuccess("Verification email sent! Please check your inbox.");
        setError("Please verify your email before logging in.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center mb-2">{success}</p>}

          <div className="flex justify-end mb-4">
            <button type="button" className="text-blue-400 underline">Forgot password?</button>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600 transition duration-200"
          >
            Sign in
          </button>

          <div className="mt-5 text-center">
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-400 underline">Register</Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
