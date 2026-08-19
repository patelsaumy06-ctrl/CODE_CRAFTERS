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
  const roleHeader = (req.headers["x-user-role"] || req.headers["x-role"] || "").toLowerCase();
  const emailHeader = req.headers["x-user-email"] || req.headers["x-email"] || "admin@disasterlens.ai";
  const defaultRole = Object.values(ROLES).includes(roleHeader) ? roleHeader : ROLES.ADMIN;

  try {
    const authAdmin = getAuth();
    if (!authAdmin) {
      // In dev fallback mode without Firebase service account
      req.user = {
        uid: "dev_admin_uid",
        email: emailHeader,
        role: defaultRole,
        profile: { role: defaultRole },
      };
      return next();
    }

    try {
      const decodedToken = await authAdmin.verifyIdToken(idToken);

      // Fetch user profile from Firestore for role
      const db = getDb();
      let profile = null;
      let role = ROLES.VIEWER;

      const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
      if (userDoc.exists) {
        profile = userDoc.data();
        role = profile.role || ROLES.VIEWER;
      } else if (decodedToken.email) {
        const emailQuery = await db
          .collection(COLLECTIONS.USERS)
          .where("email", "==", decodedToken.email)
          .limit(1)
          .get();
        if (!emailQuery.empty) {
          profile = emailQuery.docs[0].data();
          role = profile.role || ROLES.VIEWER;
        }
      }

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        role: role || defaultRole,
        profile,
      };

      return next();
    } catch (verifyError) {
      if (process.env.NODE_ENV !== "production") {
        // Allow dev session tokens in development mode
        req.user = {
          uid: "dev_user_uid",
          email: emailHeader,
          role: defaultRole,
          profile: { role: defaultRole },
        };
        return next();
      }
      throw verifyError;
    }
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
    if (!authAdmin) {
      const roleHeader = (req.headers["x-user-role"] || req.headers["x-role"] || "").toLowerCase();
      const emailHeader = req.headers["x-user-email"] || req.headers["x-email"] || "user@disasterlens.ai";
      req.user = { uid: "dev_uid", email: emailHeader, role: Object.values(ROLES).includes(roleHeader) ? roleHeader : ROLES.VIEWER };
      return next();
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await authAdmin.verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email || "", role: ROLES.VIEWER };

    const db = getDb();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();
    if (userDoc.exists) {
      req.user.role = userDoc.data().role || ROLES.VIEWER;
    }
  } catch {
    req.user = null;
  }
  next();
}
