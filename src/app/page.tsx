"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, firestore } from "../../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

const HomePage = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (user.emailVerified) {
          try {
            const userDocRef = doc(firestore, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            let userRole = "student"; // Default role

            if (!userDoc.exists()) {
              // Retrieve user data from local storage
              const registrationData = localStorage.getItem("registrationData");
              const {
                firstName = "",
                lastName = "",
                matricNumber = "",
                faculty = "",
                department = "",
                level = "",
              } = registrationData ? JSON.parse(registrationData) : {};

              await setDoc(userDocRef, {
                firstName,
                lastName,
                matricNumber,
                faculty,
                department,
                level,
                email: user.email,
                role: userRole, // Save role as "student" by default
              });

              localStorage.removeItem("registrationData");
            } else {
              userRole = userDoc.data()?.role || "student";
            }

            setUser(user);
            setRole(userRole);

            // Redirect based on role
            if (userRole === "admin") {
              router.push("/admin-dashboard");
            } else {
              router.push("/student-dashboard");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
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
