import React, { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
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
          let profile = null
          const userRef = doc(db, "users", user.uid)
          const userSnap = await getDoc(userRef)

          if (userSnap.exists()) {
            profile = userSnap.data()
          } else if (user.email) {
            // Secondary lookup by email in case document ID was created under different key
            const q = query(collection(db, "users"), where("email", "==", user.email))
            const qSnap = await getDocs(q)
            if (!qSnap.empty) {
              profile = qSnap.docs[0].data()
            }
          }

          if (profile) {
            if (profile.status === "active") {
              setCurrentUser(user)
              setUserProfile(profile)
              localStorage.setItem("userEmail", user.email || "")
            } else {
              console.warn("User account is inactive. Signing out.")
              await signOut(auth)
              setCurrentUser(null)
              setUserProfile(null)
              localStorage.clear()
            }
          } else {
            console.warn("User profile for " + user.email + " not found in Firestore.")
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
    userRole: userProfile?.role || "viewer",
    loading,
    logout
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
