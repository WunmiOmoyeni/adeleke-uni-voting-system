"use client";
import React, { useState, useEffect } from "react";
import {app} from "../../firebaseConfig";
import { getAuth, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
// import logo from "../images/au-logo.jpg";
// import Image from "next/image";

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth(app);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/student-dashboard");
    } catch (error: any) {
      console.error("Error signing in", error.message)
    }
  };

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/student-dashboard");
    } catch (error: any) {
      console.error("Error signing in", error.message);
    }
  };
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      {/* Logo
      <Image src={logo} alt="au-logo" width={150} className="mb-6" /> */}

      {/* Login Form Container */}
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg border">
        <h1 className="text-2xl font-[OpenSans-Bold] text-center mb-6">
          Login
        </h1>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e)=> setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e)=> setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="text-blue-400 underline underline-offset-4"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign-In Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white font-bold py-2 rounded hover:bg-blue-600 transition duration-200 mt-4"
          >
            Sign in
          </button>

          {/* Sign in with Google Button
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full bg-red-500 text-white font-bold py-2 rounded hover:bg-red-600 transition duration-200 mt-4 flex items-center justify-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M23.494 12.275c0-.855-.069-1.487-.214-2.136H12v4.132h6.604c-.33 1.663-1.452 3.089-3.154 4.125v3.388h5.051c2.953-2.698 4.694-6.647 4.694-11.509z" />
              <path d="M12 24c3.337 0 6.12-1.108 8.15-2.993l-4.05-3.187c-1.14.771-2.596 1.24-4.1 1.24-3.136 0-5.785-2.114-6.736-4.96H0v3.177C2.042 20.372 6.715 24 12 24z" />
              <path d="M5.264 14.613c-.256-.771-.4-1.591-.4-2.438s.144-1.667.4-2.438V6.56H0c-.809 1.569-1.264 3.344-1.264 5.122s.455 3.554 1.264 5.122l5.264-2.19z" />
              <path d="M12 4.8c1.78 0 3.37.614 4.63 1.81l3.42-3.42C17.926.909 15.263 0 12 0 6.715 0 2.042 3.628 0 8.573l5.264 2.19c.951-2.846 3.6-4.96 6.736-4.96z" />
            </svg>
            Sign in with Google
          </button> */}

          <div className="mt-5 items-center justify-center flex">
            <p>
              Don't have an account?{" "}
              <button
                type="submit"
                className="text-blue-400 underline underline-offset-4"
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
};

export default HomePage;
