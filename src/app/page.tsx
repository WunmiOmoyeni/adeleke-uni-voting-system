"use client";
import { useRouter } from "next/navigation";
import auLogo from "../images/au.png";
import Image from "next/image";

const HomePage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
      <Image src={auLogo} alt="logo" className="mx-auto mb-4" />
      <h1 className="text-5xl font-bold text-yellow-700">AU DECIDES</h1>
      <p className="text-lg text-gray-700 mt-4 max-w-xl">
        A secure and reliable web-based voting system designed to ensure fair and transparent elections at Adeleke University.
      </p>
      <button
        onClick={() => router.push("/login")}
        className="mt-6 px-6 py-3 bg-yellow-500 text-white text-lg font-semibold rounded-md hover:bg-yellow-700 transition"
      >
        Proceed to Login
      </button>
    </div>
  );
};

export default HomePage;
