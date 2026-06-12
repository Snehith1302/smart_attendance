import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  addDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  deleteDoc
} from "firebase/firestore";
import { 
  BookOpen, 
  Users, 
  UserPlus, 
  QrCode, 
  Check, 
  X, 
  Play, 
  Pause, 
  Trash2, 
  PlusCircle, 
  CheckCircle,
  Clock,
  ChevronRight
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ClassItem {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  studentIds: string[];
}

interface StudentItem {
  uid: string;
  displayName: string;
  email: string;
}

interface SessionItem {
  id: string;
  classId: string;
  qrCodeToken: string;
  expiresAt: Timestamp;
  status: 'active' | 'expired' | 'completed';
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
  timestamp: Timestamp;
  markedBy: string;
}

const Classes: React.FC = () => {
  const { userData } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  
  // All system students (to enroll)
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Active session and attendance tracking
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState(true);

  // Fetch classes
  useEffect(() => {
    if (!userData) return;
    const q = query(collection(db, "classes"), where("facultyId", "==", userData.uid));
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const classList = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassItem));
      setClasses(classList);
      // Auto-update selected class details if it was open
      if (selectedClass) {
        const updated = classList.find(c => c.id === selectedClass.id);
        if (updated) setSelectedClass(updated);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [userData]);

  // Fetch all students for enrollment selector
  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(q);
      const studentList = snap.docs.map(d => d.data() as StudentItem);
      setAllStudents(studentList);
    };
    fetchStudents();
  }, []);

  // Listen to active session for the selected class
  useEffect(() => {
    if (!selectedClass) {
      setActiveSession(null);
      setAttendanceRecords([]);
      return;
    }

    // Look for active/expired sessions for selected class in last 3 hours
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    const q = query(
      collection(db, "attendance_sessions"), 
      where("classId", "==", selectedClass.id),
      where("status", "==", "active")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const sessionDoc = snap.docs[0];
        setActiveSession({ id: sessionDoc.id, ...sessionDoc.data() } as SessionItem);
      } else {
        setActiveSession(null);
      }
    });

    return unsubscribe;
  }, [selectedClass]);

  // Listen to attendance records for the active session
  useEffect(() => {
    if (!activeSession) {
      setAttendanceRecords([]);
      return;
    }

    const q = query(
      collection(db, "attendance_records"),
      where("sessionId", "==", activeSession.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      setAttendanceRecords(records);
    });

    return unsubscribe;
  }, [activeSession]);

  // Toggle student enrollment
  const toggleEnrollment = async (studentId: string) => {
    if (!selectedClass) return;

    let updatedStudentIds = [...(selectedClass.studentIds || [])];
    if (updatedStudentIds.includes(studentId)) {
      updatedStudentIds = updatedStudentIds.filter(id => id !== studentId);
    } else {
      updatedStudentIds.push(studentId);
    }

    try {
      const classRef = doc(db, "classes", selectedClass.id);
      await updateDoc(classRef, { studentIds: updatedStudentIds });
    } catch (err) {
      console.error("Error updating enrollment:", err);
    }
  };

  // Start QR session
  const startQRSession = async () => {
    if (!selectedClass) return;
    
    // Check if session already exists
    if (activeSession) return;

    const qrToken = `session_${selectedClass.id}_${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Session active for 10 mins

    try {
      const sessionRef = await addDoc(collection(db, "attendance_sessions"), {
        classId: selectedClass.id,
        className: selectedClass.name,
        qrCodeToken: qrToken,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        status: "active"
      });

      // Initialize all class students in attendance records as 'absent' by default
      // This allows manual overrides and easy counting
      const studentsInClass = allStudents.filter(s => selectedClass.studentIds?.includes(s.uid));
      for (const student of studentsInClass) {
        await addDoc(collection(db, "attendance_records"), {
          sessionId: sessionRef.id,
          classId: selectedClass.id,
          studentId: student.uid,
          studentName: student.displayName,
          status: "absent",
          timestamp: serverTimestamp(),
          markedBy: "system"
        });
      }

    } catch (err) {
      console.error("Error starting QR session:", err);
    }
  };

  // Stop QR session
  const stopQRSession = async () => {
    if (!activeSession) return;
    try {
      const sessionRef = doc(db, "attendance_sessions", activeSession.id);
      await updateDoc(sessionRef, { status: "completed" });
      setActiveSession(null);
    } catch (err) {
      console.error("Error stopping QR session:", err);
    }
  };

  // Delete course
  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm("Are you sure you want to delete this course and all its sessions?")) return;
    try {
      await deleteDoc(doc(db, "classes", classId));
      setSelectedClass(null);
    } catch (err) {
      console.error("Error deleting class:", err);
    }
  };

  // Manual attendance override
  const markManualAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    if (!activeSession) return;

    // Find the record for this student
    const record = attendanceRecords.find(r => r.studentId === studentId);
    if (!record) return;

    try {
      const recordRef = doc(db, "attendance_records", record.id);
      await updateDoc(recordRef, {
        status: status,
        timestamp: serverTimestamp(),
        markedBy: "faculty"
      });
    } catch (err) {
      console.error("Error updating manual record:", err);
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
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CLASSES LEFT PANEL */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl glass">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Course Dashboard</span>
            </h2>

            <div className="space-y-2.5">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                    selectedClass?.id === cls.id
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                      : "bg-slate-950/40 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold tracking-wider block text-slate-400 uppercase">{cls.code}</span>
                    <span className="text-sm font-semibold block mt-0.5">{cls.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ))}
              {classes.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Create a class from the main Dashboard to begin.</p>
              )}
            </div>
          </div>
        </div>

        {/* DETAILS RIGHT PANEL */}
        <div className="lg:col-span-8">
          {selectedClass ? (
            <div className="space-y-6">
              
              {/* CLASS CONFIG HEADER */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl glass flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                    {selectedClass.code}
                  </span>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-100 mt-2">{selectedClass.name}</h1>
                  <p className="text-xs text-slate-400 mt-1">Total Enrolled: {selectedClass.studentIds?.length || 0} students</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEnrollModal(true)}
                    className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 font-semibold px-4.5 py-2.5 rounded-2xl text-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-400" />
                    <span>Enroll Students</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClass(selectedClass.id)}
                    className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/20 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* QR ATTENDANCE CONTROL CARD */}
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl glass">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <QrCode className="w-4.5 h-4.5 text-indigo-400" />
                  <span>Time-Bound QR Attendance</span>
                </h3>

                {!activeSession ? (
                  <div className="p-6 border border-dashed border-slate-800 rounded-2xl text-center space-y-4">
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Generate a time-bound QR code. Students scanning the QR will have their attendance marked in real-time.
                    </p>
                    <button
                      onClick={startQRSession}
                      className="flex items-center space-x-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-indigo-650/15 transition-all text-sm mx-auto cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start QR Session</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* QR Display */}
                    <div className="md:col-span-5 flex flex-col items-center p-4 bg-white rounded-2xl">
                      <QRCodeSVG 
                        value={activeSession.qrCodeToken} 
                        size={180}
                        bgColor="#FFFFFF"
                        fgColor="#0F172A"
                        level="H"
                      />
                      <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase mt-3 select-all">
                        SESSION CODE: {activeSession.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* QR Meta */}
                    <div className="md:col-span-7 space-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span>Live Session Active</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Students should scan the QR on their mobile device inside the student portal.
                        </p>
                      </div>

                      <div className="bg-slate-950/40 p-4 border border-slate-850 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wider block">Checked In</span>
                          <span className="text-xl font-bold text-slate-100">
                            {attendanceRecords.filter(r => r.status === "present" || r.status === "late").length} / {selectedClass.studentIds?.length || 0}
                          </span>
                        </div>
                        <Clock className="w-6 h-6 text-indigo-400" />
                      </div>

                      <button
                        onClick={stopQRSession}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-5 py-2.5 rounded-2xl shadow-lg shadow-red-650/15 transition-all text-xs cursor-pointer"
                      >
                        <Pause className="w-4 h-4 fill-white" />
                        <span>Stop Attendance Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* MANUAL ATTENDANCE SHEET */}
              {activeSession && (
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl glass space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                      Live Attendance Sheet
                    </h3>
                    <span className="text-xs text-indigo-400 font-medium animate-pulse">Real-time sync on</span>
                  </div>

                  <div className="border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/20">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                          <th className="px-5 py-3.5">Student</th>
                          <th className="px-5 py-3.5 text-center">Status</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents
                          .filter(s => selectedClass.studentIds?.includes(s.uid))
                          .map((student) => {
                            const record = attendanceRecords.find(r => r.studentId === student.uid);
                            const status = record?.status || "absent";
                            
                            const statusBadges = {
                              present: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                              absent: "bg-red-500/10 text-red-400 border border-red-500/20",
                              late: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                            };

                            return (
                              <tr key={student.uid} className="border-b border-slate-850 hover:bg-slate-900/20 transition-all">
                                <td className="px-5 py-4">
                                  <span className="font-semibold text-slate-100 block">{student.displayName}</span>
                                  <span className="text-[10px] text-slate-500 block">{student.email}</span>
                                </td>
                                <td className="px-5 py-4 text-center">
                                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${statusBadges[status]}`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => markManualAttendance(student.uid, "present")}
                                      className="p-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer text-xs font-bold"
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => markManualAttendance(student.uid, "late")}
                                      className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all cursor-pointer text-xs font-bold"
                                    >
                                      Late
                                    </button>
                                    <button
                                      onClick={() => markManualAttendance(student.uid, "absent")}
                                      className="p-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all cursor-pointer text-xs font-bold"
                                    >
                                      Absent
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {selectedClass.studentIds?.length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center py-6 text-xs text-slate-500">
                              Enroll students first to display the sheet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="glass rounded-3xl p-12 text-center border border-slate-850 h-[300px] flex flex-col items-center justify-center">
              <BookOpen className="w-12 h-12 text-slate-500 mb-3" />
              <h3 className="text-lg font-semibold text-slate-300">Select a Class</h3>
              <p className="text-sm text-slate-400 mt-1">Select a class from the left list to start taking attendance.</p>
            </div>
          )}
        </div>

      </div>

      {/* ENROLL STUDENTS MODAL */}
      {showEnrollModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Enroll Students</h3>
              <p className="text-xs text-slate-400">Toggle student names to enroll them in {selectedClass.name}</p>
            </div>

            <div className="overflow-y-auto flex-1 space-y-1.5 border border-slate-850 p-3 rounded-2xl bg-slate-950/40">
              {allStudents.map((student) => {
                const enrolled = selectedClass.studentIds?.includes(student.uid);
                return (
                  <button
                    key={student.uid}
                    onClick={() => toggleEnrollment(student.uid)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      enrolled
                        ? "bg-indigo-600/10 border-indigo-500 text-indigo-300"
                        : "bg-slate-900/40 border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-left">
                      <span className="text-sm font-semibold block">{student.displayName}</span>
                      <span className="text-[10px] text-slate-500 block">{student.email}</span>
                    </div>
                    {enrolled ? (
                      <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                    ) : (
                      <PlusCircle className="w-5 h-5 text-slate-500 shrink-0 hover:text-indigo-400" />
                    )}
                  </button>
                );
              })}
              {allStudents.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No student users found in database.</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setShowEnrollModal(false)}
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
              >
                Done Enrolling
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classes;
