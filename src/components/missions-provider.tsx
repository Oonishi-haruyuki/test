'use client';

import React, { createContext, useState, useEffect, useCallback } from 'react';
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
  const { addCurrency } = useCurrency();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const getMissionsKey = useCallback(() => 'local-missions', []);

  const getStartOfDayUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  };

  const getStartOfWeekUTC = () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff)).toISOString();
  };

  const getStartOfMonthUTC = () => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  };

  const resetMissions = useCallback((savedMissions: Mission[] = [], savedDate: string, savedWeek: string, savedMonth: string): Mission[] => {
    const today = getStartOfDayUTC();
    const thisWeek = getStartOfWeekUTC();
    const thisMonth = getStartOfMonthUTC();
    
    let needsUpdate = false;

    if (savedDate !== today) {
      needsUpdate = true;
      savedMissions.forEach(mission => {
        if (mission.type === 'daily') {
          mission.progress = 0;
          mission.claimed = false;
        }
      });
    }

    if (savedWeek !== thisWeek) {
      needsUpdate = true;
      savedMissions.forEach(mission => {
        if (mission.type === 'weekly') {
          mission.progress = 0;
          mission.claimed = false;
        }
      });
    }

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
            baseMission.progress = needsUpdate ? baseMission.progress : savedMission.progress;
            baseMission.claimed = needsUpdate ? baseMission.claimed : savedMission.claimed;
        }
        return baseMission;
    });

    if (needsUpdate) {
        localStorage.setItem(getMissionsKey(), JSON.stringify({
            missions: mergedMissions,
            lastDailyReset: today,
            lastWeeklyReset: thisWeek,
            lastMonthlyReset: thisMonth,
        }));
    }

    return mergedMissions;

  }, [getMissionsKey]);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(getMissionsKey());
      if (savedData) {
        const { missions: savedMissions, lastDailyReset, lastWeeklyReset, lastMonthlyReset } = JSON.parse(savedData);
        setMissions(resetMissions(savedMissions, lastDailyReset, lastWeeklyReset, lastMonthlyReset));
      } else {
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
  }, [getMissionsKey, resetMissions]);
  
  const saveMissions = useCallback((updatedMissions: Mission[]) => {
    setMissions(updatedMissions);
    const dataToSave = {
      missions: updatedMissions,
      lastDailyReset: getStartOfDayUTC(),
      lastWeeklyReset: getStartOfWeekUTC(),
      lastMonthlyReset: getStartOfMonthUTC(),
    };
    localStorage.setItem(getMissionsKey(), JSON.stringify(dataToSave));
  }, [getMissionsKey]);


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
        
        const dataToSave = {
          missions: updatedMissions,
          lastDailyReset: getStartOfDayUTC(),
          lastWeeklyReset: getStartOfWeekUTC(),
          lastMonthlyReset: getStartOfMonthUTC(),
        };
        localStorage.setItem(getMissionsKey(), JSON.stringify(dataToSave));
        
        return updatedMissions;
    });

  }, [isInitialized, getMissionsKey]);

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
