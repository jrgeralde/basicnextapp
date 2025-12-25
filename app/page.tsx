"use client";

import { signIn } from "@/lib/auth-client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { showMessage } from "@/components/MessageModal";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isCapsLock, setIsCapsLock] = useState(false);
    
    const router = useRouter();
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const loginBtnRef = useRef<HTMLButtonElement>(null);

    const checkCaps = (e: React.KeyboardEvent | React.MouseEvent) => {
        setIsCapsLock(e.getModifierState("CapsLock"));
    };
    const handleLogin = async () => {
      // 1. Sanitize the inputs
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();
  
      if (!cleanEmail) {
          await showMessage("Please enter your email address.");
          emailRef.current?.focus();
          return;
      }
  
      if (!cleanPassword) {
          await showMessage("Please enter your password.");
          passwordRef.current?.focus();
          return;
      }
  
      setLoading(true);
  
      // 2. Use the cleaned variables for the sign-in
      await signIn.email({ 
          email: cleanEmail, 
          password: cleanPassword 
      }, {
           onSuccess: async () => {
              // await showMessage("Login successful! Redirecting...");
               router.push("/dashboard");
           },
          onError: async () => {
              setLoading(false);
              
              await showMessage("Invalid email or password.", {
                  okColor: "bg-red-600 hover:bg-red-700"
              });
  
              passwordRef.current?.focus();
              passwordRef.current?.select();
          }
      });
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans text-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">BasicApp</h1>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 ml-1">Email</label>
                        <input 
                            ref={emailRef}
                            autoFocus
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            type="email" 
                            placeholder="email@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyUp={checkCaps}
                            onKeyDown={(e) => {
                                checkCaps(e);
                                if (e.key === "Enter") passwordRef.current?.focus();
                            }}
                            onClick={checkCaps}
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 ml-1">Password</label>
                        <div className="relative">
                            <input 
                                ref={passwordRef}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyUp={checkCaps}
                                onKeyDown={(e) => {
                                    checkCaps(e);
                                    if (e.key === "Enter") loginBtnRef.current?.focus();
                                }}
                                onClick={checkCaps}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPassword(!showPassword);
                                    setTimeout(() => passwordRef.current?.focus(), 0);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Caps Lock Indicator */}
                    <div className="h-6 flex items-center justify-center text-[10px] font-bold">
                        {isCapsLock ? (
                            <div className="flex items-center gap-2 text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 animate-pulse">
                                ⚠️ CAPS LOCK IS ON
                            </div>
                        ) : (
                            <span className="text-gray-300 font-normal uppercase tracking-wider">CAPSLOCK Detection Active</span>
                        )}
                    </div>

                    {/* Button */}
                    <button 
                        ref={loginBtnRef}
                        disabled={loading}
                        className={`w-full py-3 rounded-lg text-white font-semibold transition-all outline-none 
                            ${loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 shadow-md active:scale-95'
                            }`}
                        onClick={handleLogin}
                    >
                        {loading ? "Authenticating..." : "Login"}
                    </button>
                </div>
            </div>
        </div>
    );
}