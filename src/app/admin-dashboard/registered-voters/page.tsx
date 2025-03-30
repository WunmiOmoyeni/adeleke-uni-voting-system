"use client";
import { useState, useEffect } from "react";
import { firestore } from "../../../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import AdminSidebar from "@/components/adminSidebar";

// Define a Student interface
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  matricNumber: string;
  faculty: string;
  department: string;
  level: string;
}

const RegisteredVoters = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsCollection = collection(firestore, "students");
        const snapshot = await getDocs(studentsCollection);
        const studentsData: Student[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[]; // Type assertion
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      <div className="flex-1 p-6 bg-white">
        <h1 className="text-2xl font-bold mb-4">Registered Voters</h1>

        <input
          type="text"
          placeholder="Search by Matric Number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
        />

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Matric Number</th>
              <th className="border p-2">Faculty</th>
              <th className="border p-2">Department</th>
              <th className="border p-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {students
              .filter((student) =>
                student.matricNumber
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )
              .map((student) => (
                <tr key={student.id} className="border">
                  <td className="border p-2">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="border p-2">{student.email}</td>
                  <td className="border p-2">{student.matricNumber}</td>
                  <td className="border p-2">{student.faculty}</td>
                  <td className="border p-2">{student.department}</td>
                  <td className="border p-2">{student.level}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegisteredVoters;
