import { AuthProvider } from '@/context/AuthContext.jsx';
import AppRoutes from '@/routes/AppRoutes.jsx';

/**
 * Root application component.
 * AuthProvider wraps the entire tree so any component can access auth state.
 */
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
