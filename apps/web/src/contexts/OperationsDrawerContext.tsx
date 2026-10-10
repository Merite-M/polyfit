"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type EntityType = 
  | "organization" 
  | "provider" 
  | "location" 
  | "employee" 
  | "visit" 
  | "invoice"
  | "settlement";

export interface DrawerState {
  isOpen: boolean;
  type: EntityType | null;
  id: string | null;
  title?: string;
  data?: Record<string, any>;
}

export interface BypassModalState {
  isOpen: boolean;
  employeeId: string | null;
  locationId: string | null;
}

interface OperationsDrawerContextType {
  drawerState: DrawerState;
  openDrawer: (type: EntityType, id: string, initialData?: Record<string, any>, title?: string) => void;
  closeDrawer: () => void;
  bypassModalState: BypassModalState;
  openBypassModal: (employeeId?: string | null, locationId?: string | null) => void;
  closeBypassModal: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const OperationsDrawerContext = createContext<OperationsDrawerContextType | undefined>(undefined);

export function OperationsDrawerProvider({ children }: { children: ReactNode }) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    type: null,
    id: null,
  });

  const [bypassModalState, setBypassModalState] = useState<BypassModalState>({
    isOpen: false,
    employeeId: null,
    locationId: null,
  });

  const [refreshKey, setRefreshKey] = useState<number>(0);

  const openDrawer = useCallback((
    type: EntityType,
    id: string,
    initialData?: Record<string, any>,
    title?: string
  ) => {
    setDrawerState({
      isOpen: true,
      type,
      id,
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Details`,
      data: initialData,
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const openBypassModal = useCallback((employeeId: string | null = null, locationId: string | null = null) => {
    setBypassModalState({
      isOpen: true,
      employeeId,
      locationId,
    });
  }, []);

  const closeBypassModal = useCallback(() => {
    setBypassModalState({
      isOpen: false,
      employeeId: null,
      locationId: null,
    });
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <OperationsDrawerContext.Provider
      value={{
        drawerState,
        openDrawer,
        closeDrawer,
        bypassModalState,
        openBypassModal,
        closeBypassModal,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </OperationsDrawerContext.Provider>
  );
}

export function useOperationsDrawer() {
  const context = useContext(OperationsDrawerContext);
  if (!context) {
    throw new Error("useOperationsDrawer must be used within an OperationsDrawerProvider");
  }
  return context;
}
