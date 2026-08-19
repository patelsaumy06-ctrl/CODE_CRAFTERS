import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../../firebase/firebase"
import LoginscreenBG from '../../assets/LoginscreenBg.png'

export const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setLoading(true)

    try {
      // 1. Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      console.log("Firebase user:", user)

      // 2. Get user's profile from Firestore (by UID or Email)
      let userData = null
      const userRef = doc(db, "users", user.uid)
      const userSnapshot = await getDoc(userRef)

      if (userSnapshot.exists()) {
        userData = userSnapshot.data()
      } else if (user.email) {
        const q = query(collection(db, "users"), where("email", "==", user.email))
        const qSnap = await getDocs(q)
        if (!qSnap.empty) {
          userData = qSnap.docs[0].data()
        }
      }

      if (!userData) {
        alert("User profile not found in Firestore.")
        setLoading(false)
        return
      }

      console.log("Firestore user:", userData)

      // 3. Check account status
      if (userData.status !== "active") {
        alert("Your account is inactive.")
        setLoading(false)
        return
      }

      // Sync local storage for existing session checks
      localStorage.setItem("token", user.accessToken || "token_" + user.uid)
      localStorage.setItem("role", userData.role)
      localStorage.setItem("userEmail", user.email || email)

      // 4. Navigate based on the REAL role
      if (userData.role === "admin") {
        navigate("/admin")
      } else if (userData.role === "responder") {
        navigate("/")
      } else {
        navigate("/")
      }

    } catch (error) {
      console.error("Login error:", error)

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        alert("Invalid email or password.")
      } else if (error.code === "auth/user-not-found") {
        alert("User does not exist.")
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many login attempts. Please try again later.")
      } else if (error.code === "permission-denied") {
        alert("Permission denied accessing Firestore. Please publish rules in Firebase Console.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      let assignedRole = role || "responder"
      if (userSnap.exists()) {
        assignedRole = userSnap.data().role || assignedRole
      } else {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "Google User",
          email: user.email,
          role: assignedRole,
          status: "active",
          createdAt: serverTimestamp()
        })
      }

      localStorage.setItem("token", user.accessToken || "token_" + user.uid)
      localStorage.setItem("role", assignedRole)
      localStorage.setItem("userEmail", user.email)

      navigate("/admin")
    } catch (error) {
      console.error("Google Auth error:", error)
      alert("Google sign in failed: " + (error.message || "Unknown error"))
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

      {/* Login Card */}
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
              Sign in to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] placeholder-[#74777e]"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] placeholder-[#74777e]"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium text-[#43474d] mb-1.5" htmlFor="role">
                Role
              </label>
              <select
                className="input-field w-full px-3 py-2.5 border rounded-lg text-sm text-[#1c1c18] bg-white border-[#E7DED2] cursor-pointer"
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Administrator</option>
                <option value="responder">Responder</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 rounded border-[#E7DED2] text-[#001d36] focus:ring-[#001d36]"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label className="ml-2 block text-xs text-[#43474d]" htmlFor="remember-me">
                  Remember me
                </label>
              </div>
              <a className="text-xs text-[#001d36] hover:underline font-medium" href="#">
                Forgot password?
              </a>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <button
                className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-[#001d36] hover:bg-[#17324d] transition-colors disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#E7DED2]"></div>
                <span className="flex-shrink-0 mx-3 text-xs text-[#74777e]">or</span>
                <div className="flex-grow border-t border-[#E7DED2]"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-[#E7DED2] rounded-lg bg-white text-sm font-medium text-[#1c1c18] hover:bg-[#F7F3EC] transition-colors cursor-pointer"
                type="button"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4"></path>
                  <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.71 5.83 14.11H2.15V16.96C3.96 20.57 7.7 23 12 23Z" fill="#34A853"></path>
                  <path d="M5.83 14.11C5.61 13.45 5.48 12.74 5.48 12C5.48 11.26 5.61 10.55 5.83 9.89V7.04H2.15C1.41 8.52 1 10.21 1 12C1 13.79 1.41 15.48 2.15 16.96L5.83 14.11Z" fill="#FBBC05"></path>
                  <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 3.96 3.43 2.15 7.04L5.83 9.89C6.7 7.29 9.13 5.36 12 5.36Z" fill="#EA4335"></path>
                </svg>
                Continue with Google
              </button>

              <div className="text-center pt-1">
                <span className="text-xs text-[#74777e]">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="font-semibold text-[#001d36] hover:underline"
                  >
                    Register
                  </button>
                </span>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}