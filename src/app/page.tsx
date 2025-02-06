"use client";
import { useRouter } from "next/navigation";

const HomePage = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-6">
      <h1 className="text-5xl font-bold text-blue-900">AU DECIDES</h1>
      <p className="text-lg text-gray-700 mt-4 max-w-xl">
        A secure and reliable web-based voting system designed to ensure fair and transparent elections at Adeleke University.
      </p>
      <button
        onClick={() => router.push("/login")}
        className="mt-6 px-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition"
      >
        Proceed to Login
      </button>
    </div>
  );
};

export default HomePage;
