import { doc, getDoc, setDoc, updateDoc, increment, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

export interface Badge {
  id: string;
  name: string;
  pointsRequired: number;
  icon: string;
  color: string;
  bgColor: string;
}

export const BADGES: Badge[] = [
  { id: 'bronze', name: 'Bronze Listener', pointsRequired: 100, icon: '🥉', color: 'text-amber-600', bgColor: 'bg-amber-600/10' },
  { id: 'silver', name: 'Silver Listener', pointsRequired: 500, icon: '🥈', color: 'text-slate-300', bgColor: 'bg-slate-300/10' },
  { id: 'gold', name: 'Gold Listener', pointsRequired: 1000, icon: '🥇', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  { id: 'diamond', name: 'Diamond Listener', pointsRequired: 5000, icon: '💎', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10' },
  { id: 'vip', name: 'VIP Listener', pointsRequired: 10000, icon: '👑', color: 'text-purple-400', bgColor: 'bg-purple-400/10' },
  { id: 'legend', name: 'Legend Listener', pointsRequired: 50000, icon: '🌟', color: 'text-orange-500', bgColor: 'bg-orange-500/10' }
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  pointsAwarded: number;
  icon: string;
  conditionType: 'hours' | 'points' | 'special';
  conditionValue: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_hour', title: 'First Hour', description: 'Écoutez 1 heure de musique non-stop', pointsAwarded: 10, icon: '🎧', conditionType: 'hours', conditionValue: 1 },
  { id: '10_hours', title: '10 Hours', description: 'Écoutez 10 heures cumulées', pointsAwarded: 25, icon: '🎧', conditionType: 'hours', conditionValue: 10 },
  { id: '50_hours', title: '50 Hours', description: 'Écoutez 50 heures cumulées', pointsAwarded: 50, icon: '🎧', conditionType: 'hours', conditionValue: 50 },
  { id: '100_hours', title: '100 Hours', description: 'Écoutez 100 heures cumulées', pointsAwarded: 100, icon: '🎧', conditionType: 'hours', conditionValue: 100 },
  { id: 'top_5_listener', title: 'Top 5 Listener', description: 'Atteindre le top 5 des auditeurs', pointsAwarded: 150, icon: '🏆', conditionType: 'special', conditionValue: 0 },
  { id: 'listener_week', title: 'Listener of the Week', description: 'Devenir l’Auditeur de la Semaine', pointsAwarded: 250, icon: '👑', conditionType: 'special', conditionValue: 0 },
  { id: 'listener_month', title: 'Listener of the Month', description: 'Devenir l’Auditeur du Mois', pointsAwarded: 500, icon: '🌟', conditionType: 'special', conditionValue: 0 }
];

export function getBadgeByPoints(points: number): Badge | null {
  let highestBadge: Badge | null = null;
  for (const badge of BADGES) {
    if (points >= badge.pointsRequired) {
      highestBadge = badge;
    }
  }
  return highestBadge;
}

export async function checkAndAwardAchievements(
  userId: string,
  listeningTimeSeconds: number,
  currentPoints: number,
  onNotifyAchievement: (achievement: Achievement) => void,
  onNotifyBadge: (badge: Badge) => void
) {
  try {
    const hours = listeningTimeSeconds / 3600;

    // Check hour accomplishments
    for (const ach of ACHIEVEMENTS) {
      if (ach.conditionType === 'hours' && hours >= ach.conditionValue) {
        const achDocId = `${userId}_${ach.id}`;
        const achDocRef = doc(db, 'achievements', achDocId);
        const achCheck = await getDoc(achDocRef);

        if (!achCheck.exists()) {
          // Unlocked new achievement! Save to Firestore
          await setDoc(achDocRef, {
            id: achDocId,
            userId,
            achievementId: ach.id,
            title: ach.title,
            pointsAwarded: ach.pointsAwarded,
            unlockedAt: serverTimestamp()
          });

          // Add bonus points to user (both inside user profile doc and reward points)
          const profileRef = doc(db, 'users', userId);
          await updateDoc(profileRef, {
            points: increment(ach.pointsAwarded)
          });

          // Also increment in reward_points
          const rpDocRef = doc(db, 'reward_points', userId);
          await setDoc(rpDocRef, {
            totalPoints: increment(ach.pointsAwarded),
            lifetimePoints: increment(ach.pointsAwarded),
            lastUpdated: serverTimestamp()
          }, { merge: true });

          // Call notify callback
          onNotifyAchievement(ach);
        }
      }
    }

    // Check and update highest Badge
    const targetBadge = getBadgeByPoints(currentPoints);
    if (targetBadge) {
      const badgeDocId = `${userId}_${targetBadge.id}`;
      const badgeDocRef = doc(db, 'listener_badges', badgeDocId);
      const badgeCheck = await getDoc(badgeDocRef);

      if (!badgeCheck.exists()) {
        // Save badge doc
        await setDoc(badgeDocRef, {
          id: badgeDocId,
          userId,
          badgeId: targetBadge.id,
          name: targetBadge.name,
          unlockedAt: serverTimestamp()
        });

        // Save badge name in user profile for global visibility
        const profileRef = doc(db, 'users', userId);
        await updateDoc(profileRef, {
          badge: targetBadge.name
        });

        // Call notification
        onNotifyBadge(targetBadge);
      }
    }
  } catch (error) {
    console.error('Error during automatic gamification checks:', error);
  }
}
