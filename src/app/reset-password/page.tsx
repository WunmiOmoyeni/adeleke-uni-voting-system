"use client";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebaseConfig"; // update the path if different
import { useRouter } from "next/navigation";

const ResetPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
//   const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
        if (
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          typeof (err as any).code === "string"
        ) {
          const errorCode = (err as any).code;
      
          if (errorCode === "auth/user-not-found") {
            setError("No user found with this email.");
          } else if (errorCode === "auth/invalid-email") {
            setError("Invalid email format.");
          } else {
            setError("Something went wrong. Please try again.");
            console.error(err);
          }
        } else {
          setError("An unexpected error occurred. Please try again later.");
          console.error("Unknown error:", err);
        }
      } finally {
        setLoading(false);
      }
      
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4 text-center">Reset Password</h1>

        <form onSubmit={handleReset}>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Enter your email:
          </label>
          <input
            type="email"
            className="w-full p-2 border rounded mb-4"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {message && <p className="text-green-600 mb-2">{message}</p>}
          {error && <p className="text-red-600 mb-2">{error}</p>}

          <button
            type="submit"
            className={`w-full ${
              loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            } text-white font-semibold py-2 rounded`}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default ResetPasswordPage;
