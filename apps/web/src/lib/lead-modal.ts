import { create } from "zustand";

export type LeadFormType = "employer" | "provider";

interface LeadModalState {
  isOpen: boolean;
  defaultType: LeadFormType;
  open: (type?: LeadFormType) => void;
  close: () => void;
  setType: (type: LeadFormType) => void;
}

export const useLeadModal = create<LeadModalState>((set) => ({
  isOpen: false,
  defaultType: "employer",
  open: (type = "employer") => set({ isOpen: true, defaultType: type }),
  close: () => set({ isOpen: false }),
  setType: (type: LeadFormType) => set({ defaultType: type }),
}));
