
'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/hooks/use-profile';
import { useCurrency } from '@/hooks/use-currency';
import { useToast } from '@/hooks/use-toast';
import { allMissions, Mission } from '@/lib/missions';

interface MissionsContextType {
  missions: Mission[];
  updateMissionProgress: (action: Mission['action'], amount: number) => void;
  claimMissionReward: (missionId: string) => void;
}

export const MissionsContext = createContext<MissionsContextType | null>(null);

export function MissionsProvider({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useProfile();
  const { addCurrency } = useCurrency();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getMissionsKey = useCallback(() => `${activeProfile}-missions`, [activeProfile]);

  // Function to get the start of the current day in UTC
  const getStartOfDayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  };

  // Function to get the start of the current week (assuming Monday is the first day) in UTC
  const getStartOfWeekUTC = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff)).toISOString();
  };

  // Function to get the start of the current month in UTC
  const getStartOfMonthUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  };

  const resetMissions = useCallback((savedMissions: Mission[] = [], savedDate: string, savedWeek: string, savedMonth: string): Mission[] => {
    const today = getStartOfDayUTC();
    const thisWeek = getStartOfWeekUTC();
    const thisMonth = getStartOfMonthUTC();
    
    let needsUpdate = false;

    // Reset daily missions if the day has changed
    if (savedDate !== today) {
      needsUpdate = true;
      savedMissions.forEach(mission => {
        if (mission.type === 'daily') {
          mission.progress = 0;
          mission.claimed = false;
        }
      });
    }

    // Reset weekly missions if the week has changed
    if (savedWeek !== thisWeek) {
      needsUpdate = true;
      savedMissions.forEach(mission => {
        if (mission.type === 'weekly') {
          mission.progress = 0;
          mission.claimed = false;
        }
      });
    }

    // Reset monthly missions if the month has changed
    if (savedMonth !== thisMonth) {
        needsUpdate = true;
        savedMissions.forEach(mission => {
            if (mission.type === 'monthly') {
                mission.progress = 0;
                mission.claimed = false;
            }
        });
    }
    
    const baseMissions = JSON.parse(JSON.stringify(allMissions));
    
    const mergedMissions = baseMissions.map((baseMission: Mission) => {
        const savedMission = savedMissions.find(sm => sm.id === baseMission.id);
        if (savedMission) {
            // If day/week/month has changed, use reset progress, otherwise use saved progress
            baseMission.progress = needsUpdate ? baseMission.progress : savedMission.progress;
            baseMission.claimed = needsUpdate ? baseMission.claimed : savedMission.claimed;
        }
        return baseMission;
    });

    if (needsUpdate && activeProfile) {
        localStorage.setItem(getMissionsKey(), JSON.stringify({
            missions: mergedMissions,
            lastDailyReset: today,
            lastWeeklyReset: thisWeek,
            lastMonthlyReset: thisMonth,
        }));
    }

    return mergedMissions;

  }, [activeProfile, getMissionsKey]);

  useEffect(() => {
    if (!activeProfile) return;
    try {
      const savedData = localStorage.getItem(getMissionsKey());
      if (savedData) {
        const { missions: savedMissions, lastDailyReset, lastWeeklyReset, lastMonthlyReset } = JSON.parse(savedData);
        setMissions(resetMissions(savedMissions, lastDailyReset, lastWeeklyReset, lastMonthlyReset));
      } else {
        // First time initialization
        const newMissions = JSON.parse(JSON.stringify(allMissions));
        setMissions(newMissions);
        localStorage.setItem(getMissionsKey(), JSON.stringify({
          missions: newMissions,
          lastDailyReset: getStartOfDayUTC(),
          lastWeeklyReset: getStartOfWeekUTC(),
          lastMonthlyReset: getStartOfMonthUTC(),
        }));
      }
    } catch (error) {
      console.error("Failed to load missions from localStorage", error);
      setMissions(JSON.parse(JSON.stringify(allMissions)));
    }
    setIsInitialized(true);
  }, [activeProfile, getMissionsKey, resetMissions]);
  
  const saveMissions = useCallback((updatedMissions: Mission[]) => {
    setMissions(updatedMissions);
    if(activeProfile) {
      const dataToSave = {
        missions: updatedMissions,
        lastDailyReset: getStartOfDayUTC(),
        lastWeeklyReset: getStartOfWeekUTC(),
        lastMonthlyReset: getStartOfMonthUTC(),
      };
      localStorage.setItem(getMissionsKey(), JSON.stringify(dataToSave));
    }
  }, [activeProfile, getMissionsKey]);


  const updateMissionProgress = useCallback((action: Mission['action'], amount: number) => {
    if (!isInitialized) return;

    setMissions(prevMissions => {
        const updatedMissions = prevMissions.map(mission => {
          if (mission.action === action && !mission.claimed && mission.progress < mission.goal) {
            const newProgress = Math.min(mission.progress + amount, mission.goal);
            return { ...mission, progress: newProgress };
          }
          return mission;
        });
        
        // Save to localStorage immediately after state update
        if(activeProfile) {
          const dataToSave = {
            missions: updatedMissions,
            lastDailyReset: getStartOfDayUTC(),
            lastWeeklyReset: getStartOfWeekUTC(),
            lastMonthlyReset: getStartOfMonthUTC(),
          };
          localStorage.setItem(getMissionsKey(), JSON.stringify(dataToSave));
        }
        
        return updatedMissions;
    });

  }, [isInitialized, activeProfile, getMissionsKey]);

  const claimMissionReward = useCallback((missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission && mission.progress >= mission.goal && !mission.claimed) {
      addCurrency(mission.reward);
      toast({
        title: '報酬を受け取りました！',
        description: `「${mission.title}」を達成し、${mission.reward}Gを獲得しました。`,
      });
      const updatedMissions = missions.map(m =>
        m.id === missionId ? { ...m, claimed: true } : m
      );
      saveMissions(updatedMissions);
    }
  }, [missions, addCurrency, toast, saveMissions]);

  return (
    <MissionsContext.Provider value={{ missions, updateMissionProgress, claimMissionReward }}>
      {children}
    </MissionsContext.Provider>
  );
}
