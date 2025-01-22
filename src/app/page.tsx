"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  // const [role, setRole] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          let userDocRef = doc(firestore, "admins", user.uid)
          let userDoc = await getDoc(userDocRef);

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
          setUser(null);
          router.push("/login");
        }
      } else {
        setUser(null);
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <p className="mt-4 text-lg font-semibold text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-2xl font-semibold text-gray-700">
        {user ? "Redirecting to your dashboard..." : "Redirecting to login..."}
      </h1>
      <p className="text-gray-500 mt-2">
        Please wait while we set things up for you!
      </p>
    </div>
  );
};

export default HomePage;
