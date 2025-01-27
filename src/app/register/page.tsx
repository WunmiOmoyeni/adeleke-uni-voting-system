"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../../firebaseConfig"; // Ensure Firestore is properly initialized in firebaseConfig.ts
import { auth } from "../../../firebaseConfig";
import Swal from "sweetalert2";

const RegisterPage = () => {
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
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);
  const router = useRouter();

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      //Save student data in firestore
      await setDoc(doc(firestore, "students", user.uid), {
        firstName,
        lastName,
        email,
        matricNumber,
        faculty,
        department,
        level,
        role: "student",
        createdAt: new Date().toISOString(),
      });

      //Clear form fields
      setFirstName("");
      setLastName("");
      setMatricNumber("");
      setEmail("");
      setFaculty("");
      setDepartment("");
      setLevel("");
      setPassword("");
      setConfirmPassword("");

      Swal.fire({
        title: "Registration Successful!",
        text: "You will be redirected to the login page.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      }).then(() => {
        router.push("/login");
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occured");
      }
      setLoading(false);
    }
  };

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

    "Faculty of Law": [], // Empty array for faculties without departments
  };

  const levels = ["100", "200", "300", "400", "500"];

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-lg border">
        <h1 className="text-2xl font-[OpenSans-Bold] text-center mb-6">
          Register
        </h1>

        <div className="max-h-[400px] overflow-y-auto px-2">
          <form onSubmit={handleRegister}>
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

            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Matric Number:
              </label>
              <input
                type="text"
                value={matricNumber}
                onChange={(e) => {
                  const value = e.target.value;

                  // Allow partial input (numbers and "/"), but enforce correct format on blur
                  if (/^\d{0,2}\/?\d{0,4}$/.test(value)) {
                    setMatricNumber(value);
                    setError(null); // Clear error while typing
                  }
                }}
                onBlur={() => {
                  if (!/^\d{2}\/\d{4}$/.test(matricNumber)) {
                    setError("Matric number must be in 'YY/NNNN' format");
                  }
                }}
                placeholder="e.g., 21/0166"
                className="w-full p-2 border rounded"
                required
              />
            </div>

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

            {/* Department Dropdown (Updates Based on Faculty) */}
            <div className="mb-4">
              <label className="block text-sm font-[OpenSans-Medium] text-gray-700 mb-1">
                Department:
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!faculty} // Disable if no faculty is selected
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
              >
                <option value="">Select Level</option>
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* <div className="flex space-x-4"> */}
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
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-5 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {" "}
                  {showPassword ? "🙈" : "👁️"}
                </button>
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
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-5 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-2 rounded transition duration-200 mt-4 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {loading ? "Registering..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
