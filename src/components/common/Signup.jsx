import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebase/firebase"
import LoginscreenBG from '../../assets/LoginscreenBg.png'

export const Signup = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('responder')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSignup = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // 2. Create User Profile Document in Firestore
      const userPayload = {
        uid: user.uid,
        name: name || "Agency Officer",
        email: user.email || email,
        role: role,
        status: "active",
        createdAt: serverTimestamp(),
        lastLogin: "Just created"
      }

      await setDoc(doc(db, "users", user.uid), userPayload)

      // 3. Save session token & role in LocalStorage
      localStorage.setItem("token", user.accessToken || "token_" + user.uid)
      localStorage.setItem("role", role)
      localStorage.setItem("userEmail", user.email || email)

      alert("Account created successfully. Redirecting to dashboard...")

      // 4. Redirect based on role
      if (role === "admin") {
        navigate("/admin")
      } else {
        navigate("/admin")
      }
    } catch (error) {
      console.error("Signup error:", error)
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email address is already registered. Please sign in instead.")
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password should be at least 6 characters long.")
      } else {
        setErrorMsg(error.message || "Failed to create account. Please check your network connection.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-[#1c1c18] min-h-screen flex antialiased relative w-full">
      {/* Background Map */}
      <div className="fixed inset-0 z-0">
        <img
          alt="Map background"
          className="w-full h-full object-cover"
          src={LoginscreenBG}
        />
        <div className="absolute inset-0 bg-[#001d36]/30"></div>
      </div>

      <main className="relative z-10 flex w-full min-h-screen flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white rounded-xl border border-[#E7DED2] shadow-lg p-6 md:p-8 flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col items-center text-center gap-1">
            <div
              className="flex items-center gap-2 cursor-pointer select-none mb-2"
              onClick={() => navigate("/")}
            >
              <span className="material-symbols-outlined text-[#D98B3A]" style={{ fontSize: '28px' }}>
                radar
              </span>
              <span className="text-xl font-bold text-[#001d36] tracking-tight">
                DisasterLens
              </span>
            </div>
            <p className="text-sm text-[#74777e]">
              Create a new account
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="name">
                Full name
              </label>
              <input
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] placeholder-[#74777e]"
                id="name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] placeholder-[#74777e]"
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] placeholder-[#74777e]"
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="role">
                Role
              </label>
              <select
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] cursor-pointer"
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="responder">Responder</option>
                <option value="admin">Administrator</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>

            <button
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#001d36] hover:bg-[#17324d] transition-colors disabled:opacity-50 mt-1"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="text-center text-xs text-[#74777e]">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-semibold text-[#001d36] hover:underline"
            >
              Sign in
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
export default Signup
