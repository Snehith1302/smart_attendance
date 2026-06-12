import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  UserCheck, 
  Mail, 
  Lock, 
  User, 
  Globe, 
  UserCircle,
  AlertCircle
} from "lucide-react";

const Login: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<'student' | 'faculty'>("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) throw new Error("Full name is required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await registerWithEmail(email, password, displayName, role);
      } else {
        await loginWithEmail(email, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* GLOW DECORATIONS */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-650/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md glass-premium rounded-3xl p-8 animate-slide-up relative overflow-hidden">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3">
            <UserCheck className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Smart Attendance
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium text-center">
            {isSignUp ? "Create an account to begin tracking" : "Access your secure attendance dashboard"}
          </p>
        </div>

        {/* ERROR BADGE */}
        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-2xl flex items-start space-x-2.5 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 tracking-wide block">FULL NAME</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. snehith@college.edu"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 tracking-wide block">REGISTER AS</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-sm font-medium border transition-all cursor-pointer ${
                    role === "student"
                      ? "bg-indigo-600/15 border-indigo-500 text-indigo-400"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl text-sm font-medium border transition-all cursor-pointer ${
                    role === "faculty"
                      ? "bg-amber-600/15 border-amber-500 text-amber-400"
                      : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  <UserCircle className="w-4 h-4" />
                  <span>Faculty</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-650 to-violet-600 hover:from-indigo-600 hover:to-violet-550 text-white font-semibold py-3 rounded-2xl shadow-lg shadow-indigo-600/20 active:scale-98 transition-all disabled:opacity-50 select-none cursor-pointer text-sm"
          >
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* OR DIVIDER */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <span className="relative bg-slate-950/80 px-3 text-xs font-semibold text-slate-500 tracking-wider">
            OR CONTINUE WITH
          </span>
        </div>

        {/* GOOGLE SIGN IN */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2.5 bg-slate-900 hover:bg-slate-850 text-slate-200 font-semibold py-3 rounded-2xl border border-slate-800 transition-all active:scale-98 disabled:opacity-50 cursor-pointer text-sm"
        >
          <Globe className="w-4.5 h-4.5 text-indigo-400" />
          <span>Sign In with Google</span>
        </button>

        {/* TOGGLE MODE */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            {isSignUp ? "Already have an account?" : "New to Smart Attendance?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-indigo-400 hover:underline font-semibold ml-1 cursor-pointer focus:outline-none"
            >
              {isSignUp ? "Sign In" : "Register Now"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
