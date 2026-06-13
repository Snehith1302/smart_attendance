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
  getDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";
import { 
  QrCode, 
  Camera, 
  Keyboard, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const QRScannerPage: React.FC = () => {
  const { userData } = useAuth();
  const [scanMethod, setScanMethod] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);

  // States for verification
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [verifiedClass, setVerifiedClass] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (scanMethod === 'camera' && scanning && verifyStatus === 'idle') {
      scanner = new Html5QrcodeScanner(
        "qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Successfully scanned QR text
          handleVerifyQR(decodedText);
          if (scanner) {
            scanner.clear().catch(err => console.error("Error clearing scanner", err));
            setScanning(false);
          }
        }, 
        (error) => {
          // console.log("Scanning...", error);
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Error clearing scanner on unmount", err));
      }
    };
  }, [scanMethod, scanning, verifyStatus]);

  const handleVerifyQR = async (token: string) => {
    if (!userData) return;
    setVerifyStatus('loading');
    setErrorMessage("");

    try {
      // Find session with token (either qrCodeToken from QR code or short code from manual entry)
      let sessionDoc;
      if (token.startsWith("session_")) {
        const sessionQuery = query(
          collection(db, "attendance_sessions"),
          where("qrCodeToken", "==", token),
          where("status", "==", "active")
        );
        const sessionSnap = await getDocs(sessionQuery);
        if (!sessionSnap.empty) {
          sessionDoc = sessionSnap.docs[0];
        }
      } else {
        const activeSessionsQuery = query(
          collection(db, "attendance_sessions"),
          where("status", "==", "active")
        );
        const activeSessionsSnap = await getDocs(activeSessionsQuery);
        sessionDoc = activeSessionsSnap.docs.find(doc => 
          doc.id.toLowerCase().startsWith(token.toLowerCase())
        );
      }

      if (!sessionDoc) {
        throw new Error("Invalid or expired QR code session. Please verify with your faculty.");
      }

      const sessionId = sessionDoc.id;
      const sessionData = sessionDoc.data();

      // Check expiration
      const expiresAt = sessionData.expiresAt as Timestamp;
      if (expiresAt.toDate() < new Date()) {
        throw new Error("Attendance session has expired.");
      }

      // Check if student is enrolled in the class
      const classRef = doc(db, "classes", sessionData.classId);
      const classSnap = await getDoc(classRef);
      
      if (!classSnap.exists()) {
        throw new Error("Course configuration not found.");
      }

      const classData = classSnap.data();
      const studentIds = classData.studentIds || [];
      
      if (!studentIds.includes(userData.uid)) {
        throw new Error("You are not enrolled in this course. Please contact your instructor.");
      }

      // Find the student's attendance record in this session to mark it
      const recordQuery = query(
        collection(db, "attendance_records"),
        where("sessionId", "==", sessionId),
        where("studentId", "==", userData.uid)
      );
      const recordSnap = await getDocs(recordQuery);

      if (recordSnap.empty) {
        throw new Error("No enrollment record found for this session sheet.");
      }

      const recordDoc = recordSnap.docs[0];
      
      // Update record to present
      await updateDoc(doc(db, "attendance_records", recordDoc.id), {
        status: "present",
        timestamp: serverTimestamp(),
        markedBy: "qr"
      });

      setVerifiedClass(sessionData.className || "Class");
      setVerifyStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to mark attendance.");
      setVerifyStatus('error');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleVerifyQR(manualCode.trim());
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-slide-up">
      <div className="glass-premium rounded-3xl p-6 relative overflow-hidden space-y-6">
        
        {/* Glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl -z-10 pointer-events-none"></div>

        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-650 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-3">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Attendance Scan Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Select a method to check in to your active class</p>
        </div>

        {verifyStatus === 'idle' && (
          <>
            {/* SCAN TABS */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-slate-850">
              <button
                onClick={() => { setScanMethod('manual'); setScanning(false); }}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  scanMethod === 'manual'
                    ? "bg-indigo-650 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Keyboard className="w-4 h-4" />
                <span>Enter Code</span>
              </button>
              <button
                onClick={() => { setScanMethod('camera'); setScanning(true); }}
                className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  scanMethod === 'camera'
                    ? "bg-indigo-650 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Camera Scanner</span>
              </button>
            </div>

            {/* CAMERA MODE */}
            {scanMethod === 'camera' && (
              <div className="space-y-4">
                <div id="qr-reader" className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60"></div>
                <p className="text-[10px] text-slate-500 text-center">
                  Allow camera access and point towards the code on the screen.
                </p>
              </div>
            )}

            {/* MANUAL MODE */}
            {scanMethod === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider block">ATTENDANCE SESSION CODE</label>
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. 8-digit session code"
                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all text-center tracking-widest font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-650 to-violet-650 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold py-3 rounded-2xl shadow-md cursor-pointer text-sm"
                >
                  Verify Session Code
                </button>
              </form>
            )}
          </>
        )}

        {/* LOADING STATE */}
        {verifyStatus === 'loading' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm text-indigo-400 font-medium animate-pulse">Verifying ticket payload...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {verifyStatus === 'success' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 pulse-ring">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Check-In Successful!</h2>
              <p className="text-xs text-slate-400 mt-1">Your attendance has been recorded successfully.</p>
            </div>
            <div className="w-full bg-slate-950/40 p-4 border border-slate-850 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Course Name</span>
              <span className="text-sm font-semibold text-slate-200 mt-0.5 block">{verifiedClass}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-2">Check-in Status</span>
              <span className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center space-x-1">
                <span>Present</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20 animate-pulse" />
              </span>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => { setVerifyStatus('idle'); setManualCode(""); }}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Scan Another
              </button>
              <Link
                to="/dashboard"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white text-center py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center"
              >
                Go Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {verifyStatus === 'error' && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Check-In Failed</h2>
              <p className="text-xs text-slate-400 mt-1">The system could not verify your request.</p>
            </div>
            <div className="w-full bg-red-500/5 p-4 border border-red-500/15 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider block">Error Reason</span>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{errorMessage}</p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setVerifyStatus('idle')}
                className="w-full bg-slate-900 border border-slate-800 text-slate-300 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Try Again
              </button>
              <Link
                to="/dashboard"
                className="w-full bg-indigo-650 hover:bg-indigo-600 text-white text-center py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center"
              >
                Cancel
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default QRScannerPage;
