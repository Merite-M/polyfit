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

interface OperationsDrawerContextType {
  drawerState: DrawerState;
  openDrawer: (type: EntityType, id: string, initialData?: Record<string, any>, title?: string) => void;
  closeDrawer: () => void;
}

const OperationsDrawerContext = createContext<OperationsDrawerContextType | undefined>(undefined);

export function OperationsDrawerProvider({ children }: { children: ReactNode }) {
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
    type: null,
    id: null,
  });

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

  return (
    <OperationsDrawerContext.Provider value={{ drawerState, openDrawer, closeDrawer }}>
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
