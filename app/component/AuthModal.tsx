"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../service/authService";

export const AuthModal = ({ onClose }: { onClose: () => void }) => {
  const { setUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", first_name: "", last_name: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = isLogin
        ? await authService.login({ email: formData.email, password: formData.password })
        : await authService.register({ ...formData, role: "renter" });

      setUser({
        id: response.user.id,
        email: response.user.email,
        full_name: response.user.user_metadata?.full_name || `${formData.first_name} ${formData.last_name}`,
        role: response.user.user_metadata?.role || "renter",
      });
      onClose();
    } catch (err) {
      console.error("Auth failed", err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.95 }} animate={{ scale: 1 }}
          className="bg-slate-900 w-full max-w-md p-8 rounded-3xl border border-white/10 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-white"><X size={20} /></button>
          <h2 className="text-2xl font-bold mb-6 text-white">{isLogin ? "Welcome Back" : "Create Account"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="flex gap-2">
                <input placeholder="First" className="w-1/2 bg-black/30 p-4 rounded-xl text-white" onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
                <input placeholder="Last" className="w-1/2 bg-black/30 p-4 rounded-xl text-white" onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full bg-black/30 p-4 rounded-xl text-white" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Password" className="w-full bg-black/30 p-4 rounded-xl text-white" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            <button className="w-full bg-teal-600 py-4 rounded-xl text-white font-bold">{isLogin ? "Login" : "Register"}</button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-400 cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Need an account? Register" : "Already have an account? Login"}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};