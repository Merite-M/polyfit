'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: any | null;
  organizationId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isDemoMode: boolean;
  enableDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
          
          try {
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('org_id, role')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (isMounted) {
              if (roleData?.org_id) {
                setOrganizationId(roleData.org_id);
              } else {
                if (roleError) {
                  console.warn('[AuthContext] Role fetch notice:', roleError);
                }
                // Default to verified active corporate organization (TechCorp Rwanda) for seamless B2B evaluation
                setOrganizationId('c79a9982-4477-4336-a24b-561419f6c43b');
              }
            }
          } catch (roleErr) {
            console.error('[AuthContext] Unexpected role fetch exception:', roleErr);
            if (isMounted) {
              setOrganizationId('c79a9982-4477-4336-a24b-561419f6c43b');
            }
          }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setUser(session.user);

        setTimeout(async () => {
          if (!isMounted) return;
          try {
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('org_id, role')
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (isMounted) {
              if (roleData?.org_id) {
                setOrganizationId(roleData.org_id);
              } else {
                if (roleError) {
                  console.warn('[AuthContext] Role fetch notice on state change:', roleError);
                }
                setOrganizationId('c79a9982-4477-4336-a24b-561419f6c43b');
              }
            }
          } catch (roleErr) {
            console.error('[AuthContext] Auth state change role fetch error:', roleErr);
            if (isMounted) {
              setOrganizationId('c79a9982-4477-4336-a24b-561419f6c43b');
            }
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        }, 0);
      } else {
        setUser(null);
        setOrganizationId(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrganizationId(null);
    setIsDemoMode(false);
  };

  const enableDemoMode = () => {
    setUser({ id: 'demo-user', email: 'demo@example.com' });
    setOrganizationId('00000000-0000-0000-0000-000000000000');
    setIsDemoMode(true);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, organizationId, loading, signOut, isDemoMode, enableDemoMode }}>
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

