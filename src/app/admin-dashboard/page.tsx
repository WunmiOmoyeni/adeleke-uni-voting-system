 "use client"
 import { useState, useEffect } from "react"
 import { useRouter } from "next/navigation"
 import { onAuthStateChanged, signOut } from "firebase/auth" 
 import { auth, firestore} from '../../../firebaseConfig'
 import type { User } from "firebase/auth"
 import {doc, getDoc} from 'firebase/firestore'

const AdminDashboard = () => {
    // const [admin, setAdmin] = useState<User | null>(null);
    const [user, setUser] = useState<User | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [totalVoters, setTotalVoters] = useState<number>(0);
    const [votesCast, setVotesCast] = useState<number>(0);
    const [votingStatus, setVotingStatus] = useState<string>("Active");
    const [recentActivity, setRecentActivity] = useState<string[]>([]);
    const router = useRouter();

    // useEffect(() => {
    //     const unsubscribe = auth.onAuthStateChanged((user) => {
    //       if (user) {
    //         const checkAdmin = async () => {
    //           const adminDoc = await getDoc(doc(firestore, "admins", user.email!));
    //           if (adminDoc.exists()) {
    //             setAdmin(user);  // Proceed to admin dashboard
    //           } else {
    //             router.push('/login');
    //           }
    //         };
    //         checkAdmin();
    //       } else {
    //         router.push('/login');
    //       }
    //     });
    //     return unsubscribe;  // Cleanup when component unmounts or user state changes
    //   }, [router])

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if(user) {
                setUser(user);
                const userDoc = await getDoc(doc(firestore, "admins", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(`$(userData.firstName) $(userData.lastName)`);
                }
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router])

    const handleLogout = async () => {
        try{
            await signOut(auth);
            router.push('/login');
        } catch(error) {
            console.error("Logout error: ", error)
        }  
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-4">
            <li className="hover:bg-blue-700 p-2 rounded"><a href="#">🏠 Dashboard</a></li>
            <li className="hover:bg-blue-700 p-2 rounded"><a href="#">👤 Manage Candidates</a></li>
            <li className="hover:bg-blue-700 p-2 rounded"><a href="#">📌 Manage Positions</a></li>
            <li className="hover:bg-blue-700 p-2 rounded"><a href="#">🗳️ Registered Voters</a></li>
            <li className="hover:bg-blue-700 p-2 rounded"><a href="#">📊 View Results</a></li>
            <li className="hover:bg-blue-700 p-2 rounded"><a href="#">⚙️ Settings</a></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 text-white rounded">
            Logout
          </button>
        </div>

        {/* Dashboard Overview */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 shadow-md rounded">
            <h3 className="text-xl font-bold">Total Voters</h3>
            <p className="text-3xl mt-2">{totalVoters}</p>
          </div>

          <div className="bg-white p-6 shadow-md rounded">
            <h3 className="text-xl font-bold">Votes Cast</h3>
            <p className="text-3xl mt-2">{votesCast}</p>
          </div>

          <div className="bg-white p-6 shadow-md rounded">
            <h3 className="text-xl font-bold">Voting Status</h3>
            <p className={`text-3xl mt-2 ${votingStatus === "Active" ? "text-green-500" : "text-red-500"}`}>
              {votingStatus}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white p-6 shadow-md rounded">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <ul className="list-disc pl-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => <li key={index}>{activity}</li>)
            ) : (
              <p>No recent activity</p>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;

