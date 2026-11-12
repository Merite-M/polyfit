'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@polyfit/supabase-client';

interface AuthContextType {
  user: any | null;
  role: string | null;
  organizationId: string | null;
  providerId: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
  isLoading: boolean;
  signOut: (redirectPath?: string) => Promise<void>;
  isDemoMode: boolean;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const resolveUserRoles = async (authUser: any) => {
    if (!authUser) {
      setRole(null);
      setOrganizationId(null);
      setProviderId(null);
      setIsSuperAdmin(false);
      return;
    }

    try {
      const { data: roleRecords, error: roleError } = await supabase
        .from('user_roles')
        .select('org_id, role, provider_id')
        .eq('user_id', authUser.id);

      if (roleError) {
        console.warn('[AuthContext] Role fetch notice:', roleError.message);
      }

      const roles = Array.isArray(roleRecords) ? roleRecords : [];
      const primaryRole = roles[0]?.role || authUser.user_metadata?.role || null;
      const primaryOrgId = roles.find((r) => r.org_id)?.org_id || authUser.user_metadata?.org_id || null;
      const primaryProvId = roles.find((r) => r.provider_id)?.provider_id || authUser.user_metadata?.provider_id || null;
      const isSuper =
        roles.some((r) => r.role === 'super_admin' || r.role === 'polyfit_ops') ||
        authUser.user_metadata?.role === 'super_admin' ||
        authUser.user_metadata?.role === 'polyfit_ops';

      setRole(primaryRole);
      setOrganizationId(primaryOrgId);
      setProviderId(primaryProvId);
      setIsSuperAdmin(isSuper);
    } catch (err) {
      console.error('[AuthContext] Error resolving user roles:', err);
      // Fallback to metadata
      const metaRole = authUser.user_metadata?.role || null;
      setRole(metaRole);
      setOrganizationId(authUser.user_metadata?.org_id || null);
      setProviderId(authUser.user_metadata?.provider_id || null);
      setIsSuperAdmin(metaRole === 'super_admin' || metaRole === 'polyfit_ops');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } = {}, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[AuthContext] Session retrieval error:', sessionError);
        }

        if (session?.user && isMounted) {
          setUser(session.user);
          await resolveUserRoles(session.user);
        } else if (isMounted) {
          setUser(null);
          setRole(null);
          setOrganizationId(null);
          setProviderId(null);
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error('[AuthContext] checkSession error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);
        setTimeout(async () => {
          if (!isMounted) return;
          await resolveUserRoles(session.user);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setRole(null);
        setOrganizationId(null);
        setProviderId(null);
        setIsSuperAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async (redirectPath?: string) => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Sign out notice:', err);
    }
    setUser(null);
    setRole(null);
    setOrganizationId(null);
    setProviderId(null);
    setIsSuperAdmin(false);
    setIsDemoMode(false);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('polyfit_corporate_active_org');
        localStorage.removeItem('polyfit_partner_provider');
        localStorage.removeItem('polyfit_partner_location_id');
      } catch {}
      if (redirectPath) {
        window.location.href = redirectPath;
      }
    }
  };

  const enableDemoMode = () => {
    setUser({ id: 'demo-user', email: 'demo@example.com' });
    setRole('super_admin');
    setOrganizationId('c79a9982-4477-4336-a24b-561419f6c43b');
    setIsSuperAdmin(true);
    setIsDemoMode(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        organizationId,
        providerId,
        isSuperAdmin,
        loading,
        isLoading: loading,
        signOut,
        isDemoMode,
        enableDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useOrganizationId() {
  const { organizationId } = useAuth();
  return organizationId;
}

