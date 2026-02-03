import { useState, useEffect } from 'react';
import { LandingPage } from './app/components/LandingPage';
import { LoginForm } from './app/components/LoginForm';
import { OwnerDashboard } from './app/components/OwnerDashboard';
import { AdminDashboard } from './app/components/AdminDashboard';
import { ModeloDashboard } from './app/components/ModeloDashboard';
import { ProgramadorDashboard } from '../components/ProgramadorDashboard';
import { LanguageProvider } from './app/components/LanguageContext';
import { AgendamientosProvider } from './app/components/AgendamientosContext';
import { ServiciosProvider } from './app/components/ServiciosContext';
import { ModelosProvider } from './app/components/ModelosContext';
import { AsistenciaProvider } from './app/components/AsistenciaContext';
import { MultasProvider } from './app/components/MultasContext';
import { PagosProvider } from './app/components/PagosContext';
import { GastosProvider } from './app/components/GastosContext';
import { InventoryProvider } from './app/components/InventoryContext';
import { CarritoProvider } from './app/components/CarritoContext';
import { PublicUsersProvider } from './app/components/PublicUsersContext';
import { TestimoniosProvider } from './app/components/TestimoniosContext';
import { TurnosProvider } from './app/components/TurnosContext';
import { ClientesProvider } from './app/components/ClientesContext';
import { VideosProvider } from './app/components/VideosContext';
import { Toaster } from './app/components/ui/sonner';
import { supabase } from '../lib/supabaseClient';
import { Button } from './app/components/ui/button';
import { ErrorBoundary } from './ErrorBoundary';

interface CurrentUser {
  accessToken: string;
  userId: string;
  email: string;
  role: string;
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🚀 App iniciando...');

  useEffect(() => {
    // Verificar si hay una sesión activa
    const checkSession = async () => {
      try {
        const savedUser = localStorage.getItem('blackDiamondUser');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          
          // Verificar que el token aún es válido
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            setCurrentUser({
              accessToken: session.access_token,
              userId: session.user.id,
              email: session.user.email || '',
              role: user.role
            });
          } else {
            // Si hay error, limpiar la sesión
            localStorage.removeItem('blackDiamondUser');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('blackDiamondUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (accessToken: string, userId: string, email: string, role: string) => {
    const user = { accessToken, userId, email, role };
    setCurrentUser(user);
    localStorage.setItem('blackDiamondUser', JSON.stringify(user));
    setShowLogin(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('blackDiamondUser');
    supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl">Cargando...</div>
      </div>
    );
  }

  // Si hay usuario logueado, mostrar su dashboard correspondiente
  if (currentUser) {
    console.log('🔍 Usuario actual:', currentUser);
    console.log('🔍 Role detectado:', currentUser.role);
    
    return (
      <LanguageProvider>
        <PublicUsersProvider>
          <ModelosProvider>
            <ClientesProvider>
              <AgendamientosProvider>
                <ServiciosProvider>
                  <AsistenciaProvider>
                    <MultasProvider>
                      <PagosProvider>
                        <GastosProvider>
                          <InventoryProvider>
                            <CarritoProvider>
                              <TestimoniosProvider>
                                <TurnosProvider>
                                  <VideosProvider>
                                    <ErrorBoundary>
                                      <div className="min-h-screen bg-black">
                                        {currentUser.role === 'owner' && (
                                          <OwnerDashboard
                                            accessToken={currentUser.accessToken}
                                            userId={currentUser.userId}
                                            onLogout={handleLogout}
                                          />
                                        )}
                                        {currentUser.role === 'admin' && (
                                          <AdminDashboard
                                            accessToken={currentUser.accessToken}
                                            userId={currentUser.userId}
                                            onLogout={handleLogout}
                                          />
                                        )}
                                        {currentUser.role === 'modelo' && (
                                          <ModeloDashboard
                                            accessToken={currentUser.accessToken}
                                            userId={currentUser.userId}
                                            onLogout={handleLogout}
                                          />
                                        )}
                                        {currentUser.role === 'programador' && (
                                          <ProgramadorDashboard
                                            accessToken={currentUser.accessToken}
                                            userId={currentUser.userId}
                                            userEmail={currentUser.email}
                                            onLogout={handleLogout}
                                          />
                                        )}
                                        {/* Fallback si el rol no coincide con ninguno */}
                                        {!['owner', 'admin', 'modelo', 'programador'].includes(currentUser.role) && (
                                          <div className="min-h-screen flex items-center justify-center">
                                            <div className="text-center space-y-4">
                                              <p className="text-red-500 text-xl">Rol no reconocido: {currentUser.role}</p>
                                              <Button onClick={handleLogout}>Cerrar Sesión</Button>
                                            </div>
                                          </div>
                                        )}
                                        <Toaster />
                                      </div>
                                    </ErrorBoundary>
                                  </VideosProvider>
                                </TurnosProvider>
                              </TestimoniosProvider>
                            </CarritoProvider>
                          </InventoryProvider>
                        </GastosProvider>
                      </PagosProvider>
                    </MultasProvider>
                  </AsistenciaProvider>
                </ServiciosProvider>
              </AgendamientosProvider>
            </ClientesProvider>
          </ModelosProvider>
        </PublicUsersProvider>
      </LanguageProvider>
    );
  }

  // Si no hay usuario, mostrar landing page o login
  return (
    <LanguageProvider>
      <PublicUsersProvider>
        <ModelosProvider>
          <ClientesProvider>
            <TestimoniosProvider>
              <VideosProvider>
                <div className="min-h-screen bg-black">
                  {showLogin ? (
                    <LoginForm
                      onLogin={handleLogin}
                      onBackToLanding={() => setShowLogin(false)}
                    />
                  ) : (
                    <LandingPage onAccessSystem={() => setShowLogin(true)} />
                  )}
                  <Toaster />
                </div>
              </VideosProvider>
            </TestimoniosProvider>
          </ClientesProvider>
        </ModelosProvider>
      </PublicUsersProvider>
    </LanguageProvider>
  );
}