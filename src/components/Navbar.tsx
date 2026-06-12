import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  UserCheck, 
  LogOut, 
  LayoutDashboard, 
  QrCode, 
  FileText, 
  ShieldAlert, 
  Menu, 
  X,
  BookOpen
} from "lucide-react";

const Navbar: React.FC = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  const roleColors = {
    admin: "bg-red-500/10 text-red-400 border border-red-500/20",
    faculty: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    student: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  };

  const isActive = (path: string) => location.pathname === path;
  const navLinkClass = (path: string) => 
    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive(path) 
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-650/25" 
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <nav className="glass sticky top-0 z-55 w-full border-b border-slate-850 px-4 md:px-8 py-3.5 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <UserCheck className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-350 bg-clip-text text-transparent">
              SmartAttend
            </span>
            <span className="text-xs block text-slate-400 -mt-1 font-medium">NextGen System</span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center space-x-1.5">
          <Link to="/dashboard" className={navLinkClass("/dashboard")}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {userData?.role === "student" && (
            <>
              <Link to="/qr-scan" className={navLinkClass("/qr-scan")}>
                <QrCode className="w-4 h-4" />
                <span>Scan QR</span>
              </Link>
              <Link to="/reports" className={navLinkClass("/reports")}>
                <FileText className="w-4 h-4" />
                <span>Reports & AI</span>
              </Link>
            </>
          )}

          {userData?.role === "faculty" && (
            <>
              <Link to="/classes" className={navLinkClass("/classes")}>
                <BookOpen className="w-4 h-4" />
                <span>My Classes</span>
              </Link>
              <Link to="/reports" className={navLinkClass("/reports")}>
                <FileText className="w-4 h-4" />
                <span>Class Stats & AI</span>
              </Link>
            </>
          )}

          {userData?.role === "admin" && (
            <>
              <Link to="/admin" className={navLinkClass("/admin")}>
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
              <Link to="/reports" className={navLinkClass("/reports")}>
                <FileText className="w-4 h-4" />
                <span>System Reports</span>
              </Link>
            </>
          )}
        </div>

        {/* PROFILE ACTIONS */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-slate-900/60 pl-3 pr-4 py-1.5 rounded-xl border border-slate-800">
            {userData?.photoURL ? (
              <img 
                src={userData.photoURL} 
                alt="Avatar" 
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center ring-2 ring-indigo-500/20">
                <span className="text-xs font-semibold text-slate-350">
                  {userData?.displayName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div className="text-left">
              <span className="text-xs font-semibold block text-slate-100 leading-tight">
                {userData?.displayName}
              </span>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase leading-none mt-0.5 ${roleColors[userData?.role || "student"]}`}>
                {userData?.role}
              </span>
            </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 px-3.5 py-2 rounded-xl text-sm font-medium border border-slate-800 hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* MOBILE MENU BUTTON */}
        <div className="flex md:hidden items-center space-x-3">
          <div className={`text-[10px] font-bold px-2 py-0.8 rounded uppercase border ${roleColors[userData?.role || "student"]}`}>
            {userData?.role}
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-white p-1"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* MOBILE MENU PANEL */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fade-in">
          <Link 
            to="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
              isActive("/dashboard") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          {userData?.role === "student" && (
            <>
              <Link 
                to="/qr-scan" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                  isActive("/qr-scan") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Scan QR Code</span>
              </Link>
              <Link 
                to="/reports" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                  isActive("/reports") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Reports & AI Summary</span>
              </Link>
            </>
          )}

          {userData?.role === "faculty" && (
            <>
              <Link 
                to="/classes" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                  isActive("/classes") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>My Classes</span>
              </Link>
              <Link 
                to="/reports" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                  isActive("/reports") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Class Stats & AI</span>
              </Link>
            </>
          )}

          {userData?.role === "admin" && (
            <>
              <Link 
                to="/admin" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                  isActive("/admin") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
              <Link 
                to="/reports" 
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm font-medium ${
                  isActive("/reports") ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>System Reports</span>
              </Link>
            </>
          )}

          <div className="pt-2 border-t border-slate-850 flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-300">
                  {userData?.displayName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs font-medium block text-slate-200">{userData?.displayName}</span>
                <span className="text-[9px] text-slate-400 block -mt-0.5">{userData?.email}</span>
              </div>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-slate-800 flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
