import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot 
} from "firebase/firestore";
import { 
  Users, 
  ShieldAlert, 
  Search, 
  UserCheck,
  Award,
  ChevronDown
} from "lucide-react";

interface UserItem {
  uid: string;
  displayName: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  photoURL?: string;
}

const AdminConsole: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const userList = snap.docs.map(d => d.data() as UserItem);
      setUsers(userList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleRoleChange = async (uid: string, newRole: 'student' | 'faculty' | 'admin') => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { role: newRole });
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in space-y-8">
      
      {/* HEADER CARD */}
      <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl glass flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center space-x-2">
            <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
            <span>Admin Console</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage system-wide permissions and roles</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* USER LIST WORKSPACE */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-3xl glass overflow-hidden">
        <div className="p-6 border-b border-slate-850 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            User Directory
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-850 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((userItem) => {
                const roleColors = {
                  admin: "bg-red-500/10 text-red-400 border border-red-500/20",
                  faculty: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                  student: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                };

                return (
                  <tr key={userItem.uid} className="border-b border-slate-850 hover:bg-slate-900/20 transition-all">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      {userItem.photoURL ? (
                        <img 
                          src={userItem.photoURL} 
                          alt="Avatar" 
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-350">
                            {userItem.displayName?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-100 block">{userItem.displayName}</span>
                        <span className="text-[10px] text-slate-500 block leading-tight">{userItem.email}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.6 rounded uppercase tracking-wider ${roleColors[userItem.role || "student"]}`}>
                        {userItem.role}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block text-left">
                        <select
                          value={userItem.role}
                          onChange={(e) => handleRoleChange(userItem.uid, e.target.value as any)}
                          className="bg-slate-950 border border-slate-850 text-slate-350 focus:border-indigo-550 rounded-xl px-3 py-1.5 text-xs outline-none transition-all cursor-pointer hover:bg-slate-900"
                        >
                          <option value="student">Student</option>
                          <option value="faculty">Faculty</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-xs text-slate-500">
                    No users matched your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminConsole;
