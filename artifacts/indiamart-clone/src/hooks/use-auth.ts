import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetMe } from '@workspace/api-client-react';

export function useRequireAuth(allowedRoles?: ('buyer' | 'seller' | 'admin')[]) {
  const { data: user, isLoading, error } = useGetMe({
    query: { retry: false }
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation('/login');
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role as any)) {
      setLocation(`/dashboard/${user.role}`);
    }
  }, [user, isLoading, error, setLocation, allowedRoles]);

  return { user, isLoading };
}

export function useRequireGuest() {
  const { data: user, isLoading } = useGetMe({
    query: { retry: false }
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation(`/dashboard/${user.role}`);
    }
  }, [user, isLoading, setLocation]);

  return { isLoading };
}