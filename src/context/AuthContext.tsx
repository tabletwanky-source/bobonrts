import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  limit
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile, Page } from "../types";
import { checkAndAwardAchievements } from "../lib/gamification";
import { MOCK_NEWS } from "../constants";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isStreaming: boolean;
  setIsStreaming: (playing: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserAvatar: (avatarUrl: string) => Promise<void>;
  updateProfileDetails: (name: string) => Promise<void>;
  role: "admin" | "listener" | "user" | null;
  authError: string | null;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  "renejohnmike33@gmail.com",
  "thefunniest2020@gmail.com",
  "wanky7713@gmail.com"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // References to keep track of active listening session
  const isStreamingRef = useRef(isStreaming);
  const userRef = useRef(user);
  const sessionDocIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const sessionSecondsRef = useRef(0);
  const intervalRef = useRef<any | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  // Track window/document interactions to support ANTI-CHEAT
  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now();
    };

    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });
    window.addEventListener("click", handleInteraction, { passive: true });
    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  // Keep references updated to prevent stale enclosure states inside intervals
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    userRef.current = user;
    if (!user) {
      // Clear listening session immediately if user logs out
      stopListeningSession();
    }
  }, [user]);

  // Startup Diagnostics and automatic collection creation
  useEffect(() => {
    console.log("Firebase initialized");
    console.log("Project ID: teacher-wanky-website");

    getDocs(query(collection(db, "categories"), limit(1)))
      .then(() => {
        console.log("Firestore connected");
      })
      .catch((err) => {
        console.error("Firestore connection failed: ", err);
      });

    console.log("Authentication connected");

    const ensureCollectionsExist = async () => {
      const collections = ["users", "articles", "categories", "listening_sessions", "leaderboards", "reward_points"];
      for (const colName of collections) {
        try {
          const colRef = collection(db, colName);
          const snap = await getDocs(query(colRef, limit(1)));
          if (snap.empty) {
            console.log(`Collection "${colName}" is empty or missing. Creating automatically...`);
            if (colName === "categories") {
              const defaultCats = ["Sport", "Culture", "Actualités", "International", "Leadership", "Éducation"];
              for (const catName of defaultCats) {
                await addDoc(colRef, {
                  name: catName,
                  description: `Actualités, informations rattachées à la thématique ${catName}`,
                  createdAt: serverTimestamp()
                });
              }
            } else if (colName === "articles") {
              for (const item of MOCK_NEWS) {
                const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                await addDoc(colRef, {
                  title: item.title,
                  slug: slug,
                  content: item.content || item.excerpt,
                  excerpt: item.excerpt,
                  featuredImage: item.image,
                  category: item.category,
                  author: "Directeur RTS",
                  published: true,
                  views: Math.floor(Math.random() * 250) + 12,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                });
              }
            } else {
              await setDoc(doc(colRef, "_init_placeholder"), {
                initialized: true,
                createdAt: serverTimestamp(),
                systemMessage: `Initialisation de la collection ${colName}`
              });
            }
          }
        } catch (err) {
          console.warn(`Could not verify/seed collection "${colName}":`, err);
        }
      }
    };

    ensureCollectionsExist();
  }, []);

  // Auth observer without timeouts or fallback modes
  useEffect(() => {
    setAuthError(null);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError(null);

      if (firebaseUser) {
        setUser(firebaseUser);
        console.log("Auth state received: Authenticated");
        console.log("User email: ", firebaseUser.email || "No email");
        
        const isUserAdmin = ADMIN_EMAILS.includes(firebaseUser.email?.toLowerCase().trim() || "");

        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const profile = userDoc.data() as UserProfile;
            const finalRole = isUserAdmin ? "admin" : (profile.role === "user" ? "listener" : (profile.role || "listener"));
            const updatedProfile: UserProfile = {
              ...profile,
              role: finalRole as any,
              listeningTime: profile.listeningTime ?? profile.totalListeningTime ?? 0,
              points: profile.points ?? 0,
              photoURL: profile.photoURL ?? firebaseUser.photoURL ?? "",
              lastLogin: serverTimestamp()
            };

            setUserProfile(updatedProfile);
            console.log("Current user: ", firebaseUser.uid);
            console.log("Current role: ", finalRole);

            // Update in db
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp(),
              role: finalRole,
              listeningTime: updatedProfile.listeningTime,
              points: updatedProfile.points,
              photoURL: updatedProfile.photoURL
            });

            // Sync reward points (if missing)
            const rpDocRef = doc(db, "reward_points", firebaseUser.uid);
            const rpSnap = await getDoc(rpDocRef);
            if (!rpSnap.exists()) {
              await setDoc(rpDocRef, {
                userId: firebaseUser.uid,
                totalPoints: updatedProfile.points,
                lifetimePoints: updatedProfile.points,
                lastUpdated: serverTimestamp()
              });
            }
          } else {
            console.log("User document is missing in DB. Initializing user profile...");
            const defaultRole = isUserAdmin ? "admin" : "user";
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || "Auditeur",
              email: firebaseUser.email || "",
              role: defaultRole,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              totalListeningTime: 0,
              listeningTime: 0,
              points: 0,
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firebaseUser.email || "listener")}`,
              photoURL: firebaseUser.photoURL || "",
              status: "active"
            };
            
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            console.log("Current user: ", firebaseUser.uid);
            console.log("Current role: ", defaultRole);

            const rpDocRef = doc(db, "reward_points", firebaseUser.uid);
            await setDoc(rpDocRef, {
              userId: firebaseUser.uid,
              totalPoints: 0,
              lifetimePoints: 0,
              lastUpdated: serverTimestamp()
            });
          }
        } catch (dbErr: any) {
          console.error("Firestore database connection failed for user context loading:", dbErr);
          setAuthError(`Erreur Base de Données Firestore : ${dbErr?.message || String(dbErr)}`);
          setUserProfile(null); // Ensure no fake/offline user profiles are set
        }
      } else {
        setUser(null);
        setUserProfile(null);
        console.log("Auth state received: Unauthenticated");
        console.log("Current user: none (guest)");
        console.log("Current role: none");
      }
      
      setLoading(false);
    }, (error) => {
      let friendlyMsg = error.message;
      const isUnauthDomain = (error as any).code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain');
      
      if (isUnauthDomain) {
        const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'ce domaine';
        friendlyMsg = `Ce domaine (${currentHost}) n'est pas autorisé. Ajoutez-le dans l'onglet Authentication > Settings > Authorized domains de votre console Firebase.`;
        console.warn("Auth state observer subscription warning (unauthorized domain): ", friendlyMsg);
      } else {
        console.warn("Auth state observer subscription warning: ", error.message || error);
      }
      
      setAuthError(`Erreur Authentification : ${friendlyMsg}`);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [retryCount]);

  // Manage Realtime Listening Session
  useEffect(() => {
    if (isStreaming && user) {
      startListeningSession();
    } else {
      stopListeningSession();
    }

    return () => {
      stopListeningSession();
    };
  }, [isStreaming, user?.uid]);

  // Handle updates to listening duration
  const startListeningSession = async () => {
    if (intervalRef.current) return; // session already running
    const currUser = userRef.current;
    if (!currUser) return;

    // Reset session trackers
    sessionStartTimeRef.current = new Date();
    sessionSecondsRef.current = 0;
    
    const today = new Date().toISOString().split("T")[0];

    try {
      // Create listening session document in Firestore
      const sessionCol = collection(db, "listening_sessions");
      const docRef = await addDoc(sessionCol, {
        userId: currUser.uid,
        startTime: serverTimestamp(),
        endTime: serverTimestamp(),
        duration: 0,
        pointsEarned: 0,
        date: today
      });
      sessionDocIdRef.current = docRef.id;

      // Start tick interval (every 10 seconds we sync duration increment to database)
      intervalRef.current = setInterval(async () => {
        // ANTI-CHEAT check:
        // 1. User is authenticated (checked below in currentDocId and targetUserId)
        // 2. Radio player is actively playing (isStreaming verified in useEffect)
        // 3. Browser tab is active
        const isOnline = window.navigator.onLine;
        const isTabActive = !document.hidden;
        const inactiveTime = Date.now() - lastInteractionRef.current;
        const isInteracting = inactiveTime < 180000; // 3 minutes threshold

        if (!isOnline || !isTabActive || !isInteracting) {
          console.debug("Anti-cheat: Skipping listening tick because page is inactive, offline, or hidden.", {
            isOnline,
            isTabActive,
            isInteracting
          });
          return;
        }

        sessionSecondsRef.current += 10;
        const currentDocId = sessionDocIdRef.current;
        const targetUserId = currUser.uid;

        if (currentDocId && targetUserId) {
          try {
            const newDuration = sessionSecondsRef.current;
            const previousPointsEarned = Math.floor((newDuration - 10) / 7200) * 10;
            const currentPointsEarned = Math.floor(newDuration / 7200) * 10;
            const pointsToAdd = Math.max(0, currentPointsEarned - previousPointsEarned);

            // Update session document
            const itemDoc = doc(db, "listening_sessions", currentDocId);
            await updateDoc(itemDoc, {
              endTime: serverTimestamp(),
              duration: newDuration,
              pointsEarned: currentPointsEarned
            });

            // Increment user's aggregate listening stats
            const profileRef = doc(db, "users", targetUserId);
            const updates: any = {
              totalListeningTime: increment(10),
              listeningTime: increment(10)
            };

            if (pointsToAdd > 0) {
              updates.points = increment(pointsToAdd);
            }

            await updateDoc(profileRef, updates);

            // Also update 'reward_points' collection
            const rpDocRef = doc(db, "reward_points", targetUserId);
            if (pointsToAdd > 0) {
              await setDoc(rpDocRef, {
                userId: targetUserId,
                totalPoints: increment(pointsToAdd),
                lifetimePoints: increment(pointsToAdd),
                lastUpdated: serverTimestamp()
              }, { merge: true });
            } else {
              await setDoc(rpDocRef, {
                userId: targetUserId,
                lastUpdated: serverTimestamp()
              }, { merge: true });
            }

            let updatedPoints = 0;
            let updatedListeningTime = 0;

            // Reactively update local profile state
            setUserProfile((prev) => {
              if (prev) {
                const currentPoints = (prev.points || 0) + pointsToAdd;
                const currentDuration = (prev.listeningTime || prev.totalListeningTime || 0) + 10;
                updatedPoints = currentPoints;
                updatedListeningTime = currentDuration;
                return {
                  ...prev,
                  totalListeningTime: prev.totalListeningTime + 10,
                  listeningTime: currentDuration,
                  points: currentPoints
                };
              }
              return prev;
            });

            // Perform automatic Badge & Achievement checks
            if (updatedListeningTime > 0) {
              await checkAndAwardAchievements(
                targetUserId,
                updatedListeningTime,
                updatedPoints,
                (ach) => {
                  const event = new CustomEvent("gamification_unlock", {
                    detail: { type: "achievement", item: ach }
                  });
                  window.dispatchEvent(event);
                },
                (badge) => {
                  const event = new CustomEvent("gamification_unlock", {
                    detail: { type: "badge", item: badge }
                  });
                  window.dispatchEvent(event);
                }
              );
            }
          } catch (e) {
            console.error("Failed to commit session slice:", e);
          }
        }
      }, 10000);

    } catch (err) {
      console.error("Could not initialize listening session database node:", err);
    }
  };

  const stopListeningSession = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const finalDocId = sessionDocIdRef.current;
    const finalSeconds = sessionSecondsRef.current;
    
    if (finalDocId && finalSeconds > 0) {
      try {
        const itemDoc = doc(db, "listening_sessions", finalDocId);
        const finalPointsEarned = Math.floor(finalSeconds / 7200) * 10;
        await updateDoc(itemDoc, {
          endTime: serverTimestamp(),
          duration: finalSeconds,
          pointsEarned: finalPointsEarned
        });
      } catch (e) {
        console.error("Failed to send final session update:", e);
      }
    }

    // Reset values
    sessionDocIdRef.current = null;
    sessionStartTimeRef.current = null;
    sessionSecondsRef.current = 0;
  };

  // Auth Operations
  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    
    // Check if account is disabled with safety try/catch block
    try {
      const docRef = doc(db, "users", cred.user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().status === "disabled") {
        await signOut(auth);
        throw new Error("Votre compte a été désactivé par l'administrateur.");
      }
    } catch (e: any) {
      if (e.message?.includes("désactivé")) {
        throw e;
      }
      console.warn("Firestore status check was offline or failed of account check. Allowing bypass:", e);
    }
  };

  const loginWithGoogle = async () => {
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const cred = await signInWithPopup(auth, provider);

    // After success, handle user profile safely in try/catch so Google Sign-In always works
    try {
      const isUserAdmin = ADMIN_EMAILS.includes(cred.user.email?.toLowerCase() || "");
      const userDocRef = doc(db, "users", cred.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const existingData = userDoc.data();
        if (existingData.status === "disabled") {
          await signOut(auth);
          throw new Error("Votre compte a été désactivé par l'administrateur.");
        }
        const targetRole = isUserAdmin ? "admin" : (existingData.role === "admin" ? "admin" : "listener");
        
        const newPoints = existingData.points ?? 0;

        await updateDoc(userDocRef, {
          lastLogin: serverTimestamp(),
          role: targetRole,
          photoURL: cred.user.photoURL || existingData.photoURL || "",
          avatar: cred.user.photoURL || existingData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cred.user.email || "listener")}`
        }).catch(err => console.warn("Google log in doc update failed offline:", err));

        // Synchronize reward_points
        const rpDocRef = doc(db, "reward_points", cred.user.uid);
        await setDoc(rpDocRef, {
          userId: cred.user.uid,
          totalPoints: newPoints,
          lifetimePoints: newPoints,
          lastUpdated: serverTimestamp()
        }, { merge: true }).catch(err => console.warn("Google log in reward update failed offline:", err));

      } else {
        const profile: UserProfile = {
          uid: cred.user.uid,
          fullName: cred.user.displayName || "Auditeur",
          email: cred.user.email || "",
          role: isUserAdmin ? "admin" : "listener",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          totalListeningTime: 0,
          listeningTime: 0,
          points: 0,
          avatar: cred.user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cred.user.email || "listener")}`,
          photoURL: cred.user.photoURL || "",
          status: "active"
        };
        await setDoc(userDocRef, profile).catch(err => console.warn("Google log in doc set failed offline:", err));

        const rpDocRef = doc(db, "reward_points", cred.user.uid);
        await setDoc(rpDocRef, {
          userId: cred.user.uid,
          totalPoints: 0,
          lifetimePoints: 0,
          lastUpdated: serverTimestamp()
        }).catch(err => console.warn("Google log in reward set failed offline:", err));
      }
    } catch (e: any) {
      if (e.message?.includes("désactivé")) {
        throw e;
      }
      console.warn("Firestore interaction failed during Google login, bypassing to allow sign in:", e);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Assign admin role if email matches the preset admins
    const isUserAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
    
    const profile: UserProfile = {
      uid: cred.user.uid,
      fullName: name,
      email: email,
      role: isUserAdmin ? "admin" : "listener",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      totalListeningTime: 0,
      listeningTime: 0,
      points: 0,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      photoURL: "",
      status: "active"
    };

    // Save profile to database safely
    try {
      await setDoc(doc(db, "users", cred.user.uid), profile);

      const rpDocRef = doc(db, "reward_points", cred.user.uid);
      await setDoc(rpDocRef, {
        userId: cred.user.uid,
        totalPoints: 0,
        lifetimePoints: 0,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.warn("Firestore set doc failed during user registration, bypassing safely:", e);
    }
    
    // Update Firebase Auth displayName
    try {
      await updateProfile(cred.user, {
        displayName: name
      });
    } catch (e) {
      console.warn("Auth displayName update failed during registration:", e);
    }

    setUserProfile(profile);

    // Send verification email optionally (fails occasionally but handles nicely)
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn("Could not send immediate confirmation verification email: ", e);
    }
  };

  const logout = async () => {
    try {
      await stopListeningSession();
    } catch (e) {
      console.warn("Stop listening session error during logout:", e);
    }
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserAvatar = async (avatarUrl: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        avatar: avatarUrl
      });
    } catch (e) {
      console.warn("Failed to save updated avatar in Firestore:", e);
    }
    setUserProfile((prev) => prev ? { ...prev, avatar: avatarUrl } : null);
  };

  const updateProfileDetails = async (name: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        fullName: name
      });
    } catch (e) {
      console.warn("Failed to update profile name in Firestore:", e);
    }
    try {
      await updateProfile(user, {
        displayName: name
      });
    } catch (e) {
      console.warn("Failed to update profile displayName in auth:", e);
    }
    setUserProfile((prev) => prev ? { ...prev, fullName: name } : null);
  };

  const retryAuth = () => {
    setAuthError(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  const role = userProfile ? userProfile.role : null;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isStreaming,
      setIsStreaming,
      login,
      loginWithGoogle,
      register,
      logout,
      resetPassword,
      updateUserAvatar,
      updateProfileDetails,
      role,
      authError,
      retryAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be wrapped inside AuthProvider");
  }
  return context;
};
