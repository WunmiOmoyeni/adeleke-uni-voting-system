"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  User,
} from "firebase/auth";
import auLogo from "../../images/au.png";
import { auth, firestore } from "../../../firebaseConfig";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        setSuccess("Verification email sent! Please check your inbox.");
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }
      // Debug info

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
        router.push("/student/dashboard");
        return;
      }

      //No user data found
      setError("User data not found. Please contact support");
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        setError(
          "These credentials do not match our records or your account isn't active."
        );
      } else if (error.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("An unknown error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (type: "password" | "confirmPassword") => {
    if (type === "password") {
      setShowPassword(!showPassword);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg border">
        <Image src={auLogo} alt="logo" className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email address"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4 relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password:
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                className="w-full p-2 pr-10 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("password")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center mb-2">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm text-center mb-2">{success}</p>
          )}

          <div className="flex justify-end mb-4">
            <Link href="/reset-password" className="text-red-500 underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className={`w-full ${
              loading ? "bg-blue-300" : "bg-yellow-500 hover:bg-yellow-600"
            } text-white font-bold py-2 rounded transition duration-200`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="mt-5 text-center">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-red-500 underline">
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
