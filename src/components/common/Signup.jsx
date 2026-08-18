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

      alert("Account successfully created! Redirecting to Command Center...")

      // 4. Redirect based on role
      if (role === "admin") {
        navigate("/admin")
      } else {
        navigate("/admin")
      }
    } catch (error) {
      console.error("Signup error:", error)
      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email address is already registered. Please login instead.")
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
    <div className="text-on-surface min-h-screen flex antialiased relative w-full">
      {/* Background Map */}
      <div className="fixed inset-0 z-0">
        <img
          alt="Global Map Intelligence"
          className="w-full h-full object-cover"
          src={LoginscreenBG}
        />
      </div>

      <main className="relative z-10 flex w-full min-h-screen flex-col items-center justify-center p-4 py-12">
        <div className="glass-panel w-full max-w-xl rounded-2xl p-6 md:p-8 flex flex-col gap-6 relative backdrop-blur-2xl bg-white/70 shadow-2xl border border-white/40">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div
              className="flex items-center gap-2 cursor-pointer select-none"
              onClick={() => navigate("/")}
            >
              <span className="material-symbols-outlined text-[#D98B3A]" style={{ fontSize: '36px' }}>
                radar
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-[#001d36] tracking-tight">
                DisasterLens AI
              </h1>
            </div>
            <h2 className="text-sm text-[#74777e] max-w-md">
              Create an official agency account to access real-time emergency intelligence feeds.
            </h2>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#74777e] mb-1" htmlFor="name">
                FULL NAME / OFFICER TITLE
              </label>
              <input
                className="w-full px-3 py-2 border rounded-lg text-xs text-[#001d36] bg-white/90 border-[#E7DED2] focus:outline-none focus:border-[#D98B3A]"
                id="name"
                type="text"
                placeholder="Officer Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#74777e] mb-1" htmlFor="email">
                OFFICIAL AGENCY EMAIL
              </label>
              <input
                className="w-full px-3 py-2 border rounded-lg text-xs text-[#001d36] bg-white/90 border-[#E7DED2] focus:outline-none focus:border-[#D98B3A]"
                id="email"
                type="email"
                placeholder="a.mercer@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#74777e] mb-1" htmlFor="password">
                PASSWORD (MIN 6 CHARACTERS)
              </label>
              <input
                className="w-full px-3 py-2 border rounded-lg text-xs text-[#001d36] bg-white/90 border-[#E7DED2] focus:outline-none focus:border-[#D98B3A]"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-[#74777e] mb-1" htmlFor="role">
                REQUESTED AGENCY ROLE
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg text-xs text-[#001d36] bg-white/90 border-[#E7DED2] focus:outline-none focus:border-[#D98B3A] cursor-pointer"
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="responder">Responder (Field Operations)</option>
                <option value="admin">Administrator (Full Access)</option>
                <option value="viewer">Viewer (Read-Only Monitoring)</option>
              </select>
            </div>

            <button
              className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider text-white bg-[#001d36] hover:bg-[#17324d] transition-colors shadow-md disabled:opacity-50 mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Agency Account"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#74777e]">
            Already have an active account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-bold text-[#D98B3A] hover:underline"
            >
              Sign In Here
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
export default Signup
