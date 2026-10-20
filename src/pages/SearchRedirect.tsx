import { Navigate, useLocation } from 'react-router';

/** Search used to have its own page: keep old `/search?…` links working. */
export function SearchRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
}
