import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Plus, 
  QrCode, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  facultyName: string;
  studentIds: string[];
}

const Dashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [totalFacultyCount, setTotalFacultyCount] = useState(0);
  const [studentAttendancePct, setStudentAttendancePct] = useState<number | null>(null);

  // Modal State for Faculty Class Creation
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");

  const fetchDashboardData = async () => {
    if (!userData) return;
    setLoading(true);

    try {
      if (userData.role === "student") {
        // Fetch classes student is enrolled in
        const q = query(
          collection(db, "classes"), 
          where("studentIds", "array-contains", userData.uid)
        );
        const snap = await getDocs(q);
        const classList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem));
        setClasses(classList);

        // Fetch attendance records for this student to compute overall percentage
        const recordsQuery = query(
          collection(db, "attendance_records"),
          where("studentId", "==", userData.uid)
        );
        const recordsSnap = await getDocs(recordsQuery);
        const totalSessions = recordsSnap.docs.length;
        const presentSessions = recordsSnap.docs.filter(d => d.data().status === "present" || d.data().status === "late").length;
        
        if (totalSessions > 0) {
          setStudentAttendancePct(Math.round((presentSessions / totalSessions) * 100));
        } else {
          setStudentAttendancePct(100); // Default if no session marked yet
        }

      } else if (userData.role === "faculty") {
        // Fetch classes faculty teaches
        const q = query(
          collection(db, "classes"), 
          where("facultyId", "==", userData.uid)
        );
        const snap = await getDocs(q);
        const classList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem));
        setClasses(classList);

      } else if (userData.role === "admin") {
        // Admin: fetch total counts
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map(d => d.data());
        setTotalStudentsCount(allUsers.filter((u: any) => u.role === "student").length);
        setTotalFacultyCount(allUsers.filter((u: any) => u.role === "faculty").length);

        const classesSnap = await getDocs(collection(db, "classes"));
        setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassItem)));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userData]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !className || !classCode) return;

    try {
      await addDoc(collection(db, "classes"), {
        name: className,
        code: classCode,
        facultyId: userData.uid,
        facultyName: userData.displayName,
        studentIds: [],
        createdAt: serverTimestamp()
      });
      setClassName("");
      setClassCode("");
      setShowCreateClass(false);
      fetchDashboardData();
    } catch (err) {
      console.error("Error creating class:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in space-y-8">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-850 p-6 rounded-3xl glass">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent">
            Welcome back, {userData?.displayName}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            System logged-in as <span className="text-indigo-400 capitalize font-semibold">{userData?.role}</span>
          </p>
        </div>

        {userData?.role === "faculty" && (
          <button 
            onClick={() => setShowCreateClass(true)}
            className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/15 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        )}

        {userData?.role === "student" && (
          <Link 
            to="/qr-scan"
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-600/15 transition-all text-sm"
          >
            <QrCode className="w-4 h-4 animate-pulse" />
            <span>Scan Session QR</span>
          </Link>
        )}
      </div>

      {/* METRIC CARD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {userData?.role === "student" && (
          <>
            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">{studentAttendancePct}%</span>
                <span className="text-xs text-indigo-400 mt-1 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Requirement: 75%</span>
                </span>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                (studentAttendancePct ?? 0) >= 75 ? "bg-emerald-500/10 text-emerald-400 shadow-emerald-500/5" : "bg-red-500/10 text-red-400 shadow-red-500/5"
              }`}>
                <GraduationCap className="w-7 h-7" />
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Enrolled Courses</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">{classes.length}</span>
                <span className="text-xs text-slate-400 mt-1 block">Active classes this term</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <BookOpen className="w-7 h-7" />
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">AI summary</span>
                <span className="text-sm font-semibold text-indigo-400 block mt-1">Ready to analyze</span>
                <Link to="/reports" className="text-xs text-slate-400 hover:text-white mt-1 flex items-center space-x-1">
                  <span>View reports</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center shadow-lg shadow-violet-500/5">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
            </div>
          </>
        )}

        {userData?.role === "faculty" && (
          <>
            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Classes</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">{classes.length}</span>
                <span className="text-xs text-slate-400 mt-1 block">Taught by you</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <BookOpen className="w-7 h-7" />
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Sessions</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">Live</span>
                <span className="text-xs text-amber-400 mt-1 block">QR generation ready</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5">
                <QrCode className="w-7 h-7" />
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Student engagement</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">High</span>
                <span className="text-xs text-emerald-400 mt-1 block">Tracked dynamically</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/5">
                <Users className="w-7 h-7" />
              </div>
            </div>
          </>
        )}

        {userData?.role === "admin" && (
          <>
            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Students</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">{totalStudentsCount}</span>
                <span className="text-xs text-slate-400 mt-1 block">System total</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                <Users className="w-7 h-7" />
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Faculty</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">{totalFacultyCount}</span>
                <span className="text-xs text-slate-400 mt-1 block">System total</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5">
                <GraduationCap className="w-7 h-7" />
              </div>
            </div>

            <div className="glass-premium rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Classes</span>
                <span className="text-3xl font-bold text-slate-100 block mt-1">{classes.length}</span>
                <span className="text-xs text-slate-400 mt-1 block">Across all fields</span>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/5">
                <BookOpen className="w-7 h-7" />
              </div>
            </div>
          </>
        )}

      </div>

      {/* BODY CONTENT AREA */}
      <div>
        <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center space-x-2">
          <span>{userData?.role === "student" ? "My Enrolled Classes" : "Managed Classes"}</span>
          <span className="text-xs font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{classes.length}</span>
        </h2>

        {classes.length === 0 ? (
          <div className="glass rounded-3xl p-12 text-center max-w-xl mx-auto border border-slate-850">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No classes found</h3>
            <p className="text-sm text-slate-400 mt-1">
              {userData?.role === "student" 
                ? "You haven't been enrolled in any courses yet. Contact your administrator or faculty." 
                : "Get started by creating your first course using the button above."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div key={cls.id} className="glass glass-hover rounded-3xl p-6 flex flex-col justify-between border border-slate-850">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wide">
                      {cls.code}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{cls.studentIds?.length || 0} Students</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-3">{cls.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Faculty: {cls.facultyName}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  {userData?.role === "faculty" ? (
                    <Link
                      to={`/classes`}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1.5"
                    >
                      <span>Manage Attendance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/reports"
                      className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1.5"
                    >
                      <span>View My Attendance</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE CLASS DIALOG */}
      {showCreateClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Create New Class</h3>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 tracking-wide block mb-1">COURSE NAME</label>
                <input 
                  type="text" 
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Distributed Operating Systems"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 tracking-wide block mb-1">COURSE CODE</label>
                <input 
                  type="text" 
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="e.g. CSE-401"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm text-slate-100 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateClass(false)}
                  className="px-4 py-2 rounded-2xl text-sm font-semibold text-slate-400 hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-5 py-2 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
