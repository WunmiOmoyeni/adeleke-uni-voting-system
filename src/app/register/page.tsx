"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
  getDoc,
} from "firebase/firestore";
import { firestore } from "../../../firebaseConfig";
import { auth } from "../../../firebaseConfig";
import Swal from "sweetalert2";
import auLogo from "../../images/au.png";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

const RegisterPage = () => {
  // State variables
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [matricNumber, setMatricNumber] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const router = useRouter();

  // Check if registration is still open based on candidate deadline
  useEffect(() => {
    const checkRegistrationDeadline = async () => {
      try {
        const electionRef = doc(firestore, "election", "status");
        const electionSnap = await getDoc(electionRef);

        if (electionSnap.exists()) {
          const electionData = electionSnap.data();
          if (electionData.candidateDeadline) {
            const deadlineDate = new Date(electionData.candidateDeadline);
            const currentDate = new Date();

            // Check if current date is before the deadline
            if (currentDate < deadlineDate) {
              setIsRegistrationOpen(true);
            } else {
              // Show alert and redirect if deadline has passed
              Swal.fire({
                title: "Registration Closed",
                text: "The candidate registration deadline has passed.",
                icon: "warning",
                confirmButtonText: "OK"
              }).then((result) => {
                if (result.isConfirmed) {
                  // Redirect to login page when OK is clicked
                  router.push("/login"); 
                }
              });
            }
          } else {
            // If candidateDeadline field doesn't exist, default to allowing registration
            setIsRegistrationOpen(true);
          }
        } else {
          // If election document doesn't exist, default to allowing registration
          setIsRegistrationOpen(true);
        }
      } catch (error) {
        console.error("Error checking registration deadline:", error);
        // On error, we'll allow registration to avoid blocking legitimate users
        setIsRegistrationOpen(true);
      } finally {
        setInitialLoading(false);
      }
    };

    checkRegistrationDeadline();
  }, [router]);

  const validateMatricNumber = (matricNum: string) => {
    return /^\d{2}\/\d{4}$/.test(matricNum);
  };

  // Check if matric number already exists
  const checkMatricNumberExists = async (matricNum: string) => {
    const studentsRef = collection(firestore, "students");
    const q = query(studentsRef, where("matricNumber", "==", matricNum));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Toggle password visibility
  const togglePasswordVisibility = (type: "password" | "confirmPassword") => {
    if (type === "password") {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Handle registration submission
  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // Double-check if registration is still open
    try {
      const electionRef = doc(firestore, "election", "status");
      const electionSnap = await getDoc(electionRef);
      
      if (electionSnap.exists()) {
        const electionData = electionSnap.data();
        if (electionData.candidateDeadline) {
          const deadlineDate = new Date(electionData.candidateDeadline);
          const currentDate = new Date();
          
          if (currentDate > deadlineDate) {
            setError("Registration deadline has passed");
            setLoading(false);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Error rechecking deadline:", error);
      // Continue with registration if we can't check deadline
    }

    try {
      // Validate matric number format
      if (!validateMatricNumber(matricNumber)) {
        setError("Invalid matric number format. Please use format: 21/0166");
        setLoading(false);
        return;
      }

      // Check if matric number already exists
      const matricExists = await checkMatricNumberExists(matricNumber);
      if (matricExists) {
        setError("This matric number is already registered");
        setLoading(false);
        return;
      }

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create student document
      await setDoc(doc(firestore, "students", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase(),
        matricNumber,
        faculty,
        department,
        level,
        role: "student",
        createdAt: new Date().toISOString(),
      });



      // Create entry in matric_lookup collection
      await setDoc(
        doc(firestore, "matric_lookup", matricNumber.replace("/", "-")),
        {
          email: email.toLowerCase(),
          uid: user.uid,
        }
      );

      resetForm();
      Swal.fire({
        title: "Registration Successful!",
        text: "You will be redirected to the login page.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      }).then(() => {
        router.push("/login");
      });
    } catch (error: unknown) {
      let code = "";
      let message = "Registration failed";

      if (typeof error === "object" && error !== null) {
        const err = error as {
          code?: string;
          message?: string;
          name?: string;
          stack?: string;
        };

        console.error("Full Authentication Error:", {
          code: err.code,
          message: err.message,
          name: err.name,
          stack: err.stack,
        });

        const errorMessages: Record<string, string> = {
          "auth/email-already-in-use": "Email is already registered",
          "auth/invalid-email": "Invalid email format",
          "auth/operation-not-allowed": "Email/password sign-up is disabled",
          "auth/weak-password": "Password is too weak",
          "auth/invalid-api-key": "Invalid Firebase API key",
          "auth/unauthorized-domain": "Unauthorized domain for this project",
          "permission-denied":
            "You don't have permission to register this student",
        };

        code = err.code || "";
        message = errorMessages[code] || err.message || message;
      } else {
        console.error("Unknown error:", error);
      }

      setError(message);
      setLoading(false);
    }
  };
  // Reset form to initial state
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setMatricNumber("");
    setFaculty("");
    setDepartment("");
    setLevel("");
    setPassword("");
    setConfirmPassword("");
  };

  // Faculties and departments (unchanged from previous code)
  const faculties: Record<string, string[]> = {
    "Faculty of Science": [
      "Computer Science",
      "Mathematics",
      "Physics",
      "Biochemistry",
      "Biotechnology",
      "Microbiology",
      "Food Science",
      "Software Engineering",
      "Cybersecurity",
      "Information Technology",
    ],

    "Faculty of Engineering": [
      "Agricultural Engineering",
      "Computer Engineering",
      "Civil Engineering",
      "Mechanical Engineering",
      "Electrical Engineering",
    ],

    "Faculty of Arts": ["English", "History", "Religious Studies"],

    "Faculty of Basic Medical Sciences": [
      "Physiology",
      "Public Health",
      "Medical Laboratory Sciences",
      "Nursing",
      "Anatomy",
      "Health and Information Management(HIM)",
    ],

    "Faculty of Basic Social Sciences": [
      "Accounting",
      "Business Administration",
      "Mass Communication",
      "Office and Information Management",
      "Economics",
      "Library and Information Sciences",
      "Political Sciences",
    ],

    "Faculty of Law": [
      "Law"
    ], // Empty array for faculties without departments
  };

  const levels = ["100", "200", "300", "400", "500"];

  // Show loading spinner while checking deadline
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  // Only show registration form if registration is still open
  if (!isRegistrationOpen) {
    return null; // This will prevent rendering while the redirect happens
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg border">
        <Image src={auLogo} alt="logo" className="mx-auto mb-4" />
        <h1 className="text-2xl font-[OpenSans-Bold] text-center mb-6">
          Register
        </h1>

        <div className="max-h-[400px] overflow-y-auto px-2">
          <form onSubmit={handleRegister}>
            {/* Form fields (similar to previous code, with minor adjustments) */}
            {/* First Name and Last Name */}
            <div className="flex space-x-4">
              <div className="w-1/2">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1"
                >
                  First Name:
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="w-1/2">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1"
                >
                  Last Name:
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Email:
              </label>
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

            {/* Matric Number Input */}
            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Matric Number:
              </label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow partial input (numbers and "/"), but enforce correct format
                  if (/^\d{0,2}\/?\d{0,4}$/.test(value)) {
                    setMatricNumber(value);
                  }
                }}
                placeholder="e.g., 21/0166"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            {/* Faculty Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Faculty:
              </label>
              <select
                value={faculty}
                onChange={(e) => {
                  setFaculty(e.target.value);
                  setDepartment(""); // Reset department when faculty changes
                }}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Faculty</option>
                {Object.keys(faculties).map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Department:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!faculty}
                required
              >
                <option value="">Select Department</option>
                {faculty &&
                  faculties[faculty].map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
              </select>
            </div>

            {/* Level Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Level:
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select Level</option>
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Password Inputs */}
            <div className="mb-4 relative">
              <label
                htmlFor="password"
                className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1"
              >
                Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
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

            <div className="mb-4 relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1"
              >
                Confirm Password:
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-2 rounded transition duration-200 mt-4 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
            >
              {loading ? "Registering..." : "Sign Up"}
            </button>

            {/* Login redirect */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Login here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;