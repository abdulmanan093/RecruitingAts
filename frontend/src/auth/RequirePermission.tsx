import { Navigate } from 'react-router-dom'
import { usePermissions } from './usePermission'

export function RequirePermission({ anyOf, children }: { anyOf: string[]; children: React.ReactNode }) {
  const { can } = usePermissions()
  return anyOf.some((permission) => can(permission)) ? children : <Navigate to="/" replace />
}
