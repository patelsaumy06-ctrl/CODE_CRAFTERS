import React, { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/firebase"

const AuthContext = createContext()

export const useAuth = () => {
  return useContext(AuthContext)
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            const profile = userSnap.data()
            if (profile.status === "active") {
              setCurrentUser(user)
              setUserProfile(profile)
              localStorage.setItem("token", user.accessToken || "token_" + user.uid)
              localStorage.setItem("role", profile.role || "user")
              localStorage.setItem("userEmail", user.email || "")
            } else {
              console.warn("User account is inactive. Signing out.")
              await signOut(auth)
              setCurrentUser(null)
              setUserProfile(null)
              localStorage.clear()
            }
          } else {
            // User exists in Auth but no Firestore profile found yet
            setCurrentUser(user)
            setUserProfile(null)
          }
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error)
          setCurrentUser(user)
          setUserProfile(null)
        }
      } else {
        setCurrentUser(null)
        setUserProfile(null)
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("userEmail")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
    localStorage.clear()
  }

  const value = {
    currentUser,
    userProfile,
    userRole: userProfile?.role || localStorage.getItem("role") || "public",
    loading,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
