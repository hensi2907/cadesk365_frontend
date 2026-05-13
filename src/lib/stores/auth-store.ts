import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isHighLevel } from "@/lib/constants/roles";

interface AuthState {
  user: string;
  email: string;
  roles: string[];
  employeeId: string;
  isHighLevelUser: boolean;
  canAllocate: boolean;
  defaultCompany: string;
  permittedDoctypes: string[];
  isAuthenticated: boolean;

  setAuth: (data: {
    user: string;
    email: string;
    roles: string[];
    employee_id: string;
    can_allocate: boolean;
    is_high_level: boolean;
    default_company: string;
    permitted_doctypes: string[];
  }) => void;

  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: "",
      email: "",
      roles: [],
      employeeId: "",
      isHighLevelUser: false,
      canAllocate: false,
      defaultCompany: "",
      permittedDoctypes: [],
      isAuthenticated: false,

      setAuth: (data) =>
        set({
          user: data.user,
          email: data.email,
          roles: data.roles,
          employeeId: data.employee_id,
          isHighLevelUser: data.is_high_level || isHighLevel(data.roles),
          canAllocate: data.can_allocate,
          defaultCompany: data.default_company,
          permittedDoctypes: data.permitted_doctypes,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          user: "",
          email: "",
          roles: [],
          employeeId: "",
          isHighLevelUser: false,
          canAllocate: false,
          defaultCompany: "",
          permittedDoctypes: [],
          isAuthenticated: false,
        }),
    }),
    { name: "cadesk365-auth" }
  )
);
