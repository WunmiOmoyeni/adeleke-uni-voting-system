"use client";
import { useState } from "react";
import { actionCode, auth } from "../../../firebaseConfig";

const EmailVerificationPage = () => {
  const [oobCode, setOobCode] = useState("");
  const [message, setMessage] = useState("");

  const verifyEmail = async () => {
    if (!oobCode) {
      setMessage("Please enter the verification code.");
      return;
    }

    try {
      await actionCode(auth, oobCode);
      setMessage("Email successfully verified! You can now log in.");
    } catch (error) {
      setMessage("Invalid or expired verification code.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-2xl font-semibold">Enter Your Verification Code</h1>
      <input
        type="text"
        placeholder="Enter code"
        className="mt-4 px-4 py-2 border rounded"
        value={oobCode}
        onChange={(e) => setOobCode(e.target.value)}
      />
      <button onClick={verifyEmail} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Verify Email
      </button>
      <p className="mt-4 text-red-500">{message}</p>
    </div>
  );
};

export default EmailVerificationPage;
