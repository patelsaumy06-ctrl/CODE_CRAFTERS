import { getAuth, getDb } from "../config/firebase.js";
import { COLLECTIONS, ROLES } from "../config/constants.js";

/**
 * Middleware: Verify Firebase ID token from Authorization header.
 * Populates req.user with { uid, email, role, profile }.
 */
export async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "UNAUTHENTICATED",
      message: "Missing or invalid Authorization header. Expected: Bearer <idToken>",
    });
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const authAdmin = getAuth();
    const decodedToken = await authAdmin.verifyIdToken(idToken);

    // Fetch user profile from Firestore for role
    const db = getDb();
    let profile = null;
    let role = ROLES.CITIZEN;

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (userDoc.exists) {
      profile = userDoc.data();
      role = profile.role || ROLES.CITIZEN;
    } else if (decodedToken.email) {
      // Secondary lookup by email
      const emailQuery = await db
        .collection(COLLECTIONS.USERS)
        .where("email", "==", decodedToken.email)
        .limit(1)
        .get();
      if (!emailQuery.empty) {
        profile = emailQuery.docs[0].data();
        role = profile.role || ROLES.CITIZEN;
      }
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      role,
      profile,
    };

    next();
  } catch (error) {
    console.error("[Auth Middleware] Token verification failed:", error.code || error.message);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "TOKEN_EXPIRED", message: "Firebase ID token has expired." });
    }
    if (error.code === "auth/id-token-revoked") {
      return res.status(401).json({ error: "TOKEN_REVOKED", message: "Firebase ID token has been revoked." });
    }
    return res.status(401).json({ error: "INVALID_TOKEN", message: "Invalid Firebase ID token." });
  }
}

/**
 * Middleware factory: Require user to have one of the specified roles.
 * Must be used AFTER authenticateUser.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "UNAUTHENTICATED", message: "Authentication required." });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Optional auth — populates req.user if token present, but doesn't block.
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  try {
    const authAdmin = getAuth();
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email || "", role: ROLES.CITIZEN };

    const db = getDb();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (userDoc.exists) {
      req.user.role = userDoc.data().role || ROLES.CITIZEN;
    }
  } catch {
    req.user = null;
  }
  next();
}
