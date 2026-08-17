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
      if (userData.role === "admin" || userData.role === "commander") {
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
    <div className="text-on-surface min-h-screen flex antialiased relative w-full">
      {/* Full-Screen Background Map */}
      <div className="fixed inset-0 z-0">
        <img
          alt="Global Map Intelligence"
          className="w-full h-full object-cover"
          src={LoginscreenBG}
        />
      </div>

      {/* Centered Content Layout */}
      <main className="relative z-10 flex w-full min-h-screen flex-col items-center justify-center p-margin-mobile md:p-margin-desktop py-12">
        {/* Glassmorphism Container */}
        <div className="glass-panel w-full max-w-xl rounded-2xl p-margin-mobile md:p-sm flex flex-col gap-md relative backdrop-blur-2xl bg-white/60">

          {/* Combined Branding & Header Section */}
          <div className="flex flex-col items-center text-center gap-xs">
            <div
              className="flex items-center gap-xs cursor-pointer select-none"
              onClick={() => navigate("/")}
            >
              <span className="material-symbols-outlined text-primary-container" style={{ fontSize: '36px', fontVariationSettings: "'FILL' 1" }}>
                radar
              </span>
              <h1 className="font-display-lg text-headline-lg md:text-headline-lg text-primary-container tracking-tight">
                DisasterLens AI
              </h1>
            </div>
            <h2 className="font-body-lg text-body-md md:text-body-lg max-w-md text-primary-container">
              Empowering first responders with real-time, AI-driven disaster intelligence.
            </h2>

            {/* Live Status Indicators */}
            <div className="flex flex-wrap justify-center gap-sm mt-sm">
              <div className="inline-flex items-center gap-sm bg-white/60 backdrop-blur-sm px-sm py-xs rounded-lg border border-white/50">
                <div className="w-2 h-2 rounded-full bg-[#10b981] status-pulse"></div>
                <span className="font-data-label text-data-label text-on-surface uppercase tracking-wider">
                  Systems Operational
                </span>
              </div>
              <div className="inline-flex items-center gap-sm bg-white/60 backdrop-blur-sm px-sm py-xs rounded-lg border border-white/50">
                <div className="w-2 h-2 rounded-full bg-[#10b981] status-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="font-data-label text-data-label text-on-surface uppercase tracking-wider">
                  Intelligence Engine Online
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-outline-variant/30"></div>

          {/* Login Section */}
          <div className="flex flex-col gap-sm">
            <div className="text-center space-y-base">
              <h3 className="font-headline-md text-headline-md text-primary-container">Secure Access</h3>
              <p className="font-body-md text-body-md text-primary-container">Sign in to your command environment.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-sm">
              {/* Email Input */}
              <div className="space-y-base">
                <label className="block font-data-label text-data-label text-primary-container" htmlFor="email">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>
                      mail
                    </span>
                  </div>
                  <input
                    className="input-field w-full pl-xl pr-sm py-sm border rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:ring-0 bg-white/90 border-outline-variant"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="patelsaumy@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-base">
                <label className="block font-data-label text-data-label text-primary-container" htmlFor="password">
                  PASSWORD
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>
                      lock
                    </span>
                  </div>
                  <input
                    className="input-field w-full pl-xl pr-sm py-sm border rounded-lg font-body-md text-body-md text-on-surface placeholder-on-surface-variant focus:ring-0 bg-white/90 border-outline-variant"
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-base">
                <label className="block font-data-label text-data-label text-primary-container" htmlFor="role">
                  SELECT ROLE
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '20px' }}>
                      badge
                    </span>
                  </div>
                  <select
                    className="input-field w-full pl-xl pr-sm py-sm border rounded-lg font-body-md text-body-md text-on-surface focus:ring-0 bg-white/90 border-outline-variant cursor-pointer"
                    id="role"
                    name="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="admin">Administrator / Commander (Full Access)</option>
                    <option value="responder">First Responder (Live Operations)</option>
                    <option value="user">General Public / Citizen (View Only)</option>
                  </select>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between mt-xs">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-outline-variant text-primary-container focus:ring-primary-container bg-white/60"
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                  />
                  <label className="ml-2 block font-body-sm text-body-sm text-primary-container select-none" htmlFor="remember-me">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-body-sm text-body-sm text-primary-container hover:text-secondary-container transition-colors font-medium" href="#">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-sm">
                <button
                  className="w-full flex justify-center py-sm px-4 border border-transparent rounded-lg shadow-sm font-data-value text-data-value text-on-primary bg-primary-container hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container transition-colors disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Authenticating..." : "Sign In"}
                </button>
                {/* Divider */}
                <div className="relative py-xs flex items-center">
                  <div className="flex-grow border-t border-outline-variant/50"></div>
                  <span className="flex-shrink-0 mx-4 font-data-label text-data-label text-outline">OR</span>
                  <div className="flex-grow border-t border-outline-variant/50"></div>
                </div>
                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex justify-center items-center gap-sm py-sm px-4 border border-outline-variant/60 rounded-lg bg-white/40 backdrop-blur-sm font-data-value text-data-value text-on-surface hover:bg-white/70 transition-colors cursor-pointer"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.8 15.72 17.58V20.34H19.29C21.37 18.42 22.56 15.58 22.56 12.25Z" fill="#4285F4"></path>
                    <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.72 17.58C14.73 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.71 5.83 14.11H2.15V16.96C3.96 20.57 7.7 23 12 23Z" fill="#34A853"></path>
                    <path d="M5.83 14.11C5.61 13.45 5.48 12.74 5.48 12C5.48 11.26 5.61 10.55 5.83 9.89V7.04H2.15C1.41 8.52 1 10.21 1 12C1 13.79 1.41 15.48 2.15 16.96L5.83 14.11Z" fill="#FBBC05"></path>
                    <path d="M12 5.36C13.62 5.36 15.07 5.92 16.21 7.02L19.36 3.87C17.45 2.09 14.97 1 12 1C7.7 1 3.96 3.43 2.15 7.04L5.83 9.89C6.7 7.29 9.13 5.36 12 5.36Z" fill="#EA4335"></path>
                  </svg>
                  Continue with Google / SSO
                </button>

                <div className="text-center pt-2">
                  <span className="font-body-sm text-body-sm text-primary-container">
                    Need an official agency account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signup")}
                      className="font-bold text-[#D98B3A] hover:underline"
                    >
                      Register Officer Account
                    </button>
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* Footer Note */}
          <div className="pt-sm border-t border-outline-variant/30 text-center">
            <p className="font-data-label text-data-label text-primary-container">
              © 2024 DISASTERLENS AI. SECURE NETWORK.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}