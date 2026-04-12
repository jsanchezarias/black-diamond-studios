import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase/info';
import { LanguageProvider } from './app/components/LanguageContext';
import { PublicUsersProvider } from './app/components/PublicUsersContext';
import { VideosProvider } from './app/components/VideosContext';
import { ModelosProvider } from './app/components/ModelosContext';
import { TestimoniosProvider } from './app/components/TestimoniosContext';
import { AgendamientosProvider } from './app/components/AgendamientosContext';
import { ClientesProvider } from './app/components/ClientesContext';
import { ServiciosProvider } from './app/components/ServiciosContext';
import { PagosProvider } from './app/components/PagosContext';
import { MultasProvider } from './app/components/MultasContext';
import { TurnosProvider } from './app/components/TurnosContext';
import { GastosProvider } from './app/components/GastosContext';
import { AsistenciaProvider } from './app/components/AsistenciaContext';
import { CarritoProvider } from './app/components/CarritoContext';
import { InventoryProvider } from './app/components/InventoryContext';
import { NotificacionesProvider } from './app/components/NotificacionesContext';
import { AnalyticsProvider } from './app/components/AnalyticsContext';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { LoginForm } from './app/components/LoginForm';
import { Toaster } from 'sonner';
import { LandingPage } from './app/components/LandingPage';
import { ProgramadorDashboard } from './app/components/ProgramadorDashboard';
import { OwnerDashboard } from './app/components/OwnerDashboard';
import { AdminDashboard } from './app/components/AdminDashboard';
import { ModeloDashboard } from './app/components/ModeloDashboard';
import { ModeradorDashboard } from './app/components/ModeradorDashboard';
import { ContadorDashboard } from './app/components/ContadorDashboard';
import { RecepcionistaDashboard } from './app/components/RecepcionistaDashboard';
import { SupervisorDashboard } from './app/components/SupervisorDashboard';

// ✅ Componente que envuelve todos los providers en un solo lugar
function AllProvidersWrapper({ children }: { children: React.ReactNode }) {
  try {
    return (
      <LanguageProvider>
        {(() => {
          return (
            <PublicUsersProvider>
              {(() => {
                return (
                  <VideosProvider>
                    {(() => {
                      return (
                        <ModelosProvider>
                          {(() => {
                            return (
                              <TestimoniosProvider>
                                {(() => {
                                  return (
                                    <AgendamientosProvider>
                                      {(() => {
                                        return (
                                          <ClientesProvider>
                                            {(() => {
                                              return (
                                                <ServiciosProvider>
                                                  {(() => {
                                                    return (
                                                      <PagosProvider>
                                                        {(() => {
                                                          return (
                                                            <MultasProvider>
                                                              {(() => {
                                                                return (
                                                                  <TurnosProvider>
                                                                    {(() => {
                                                                      return (
                                                                        <GastosProvider>
                                                                          {(() => {
                                                                            return (
                                                                              <AsistenciaProvider>
                                                                                {(() => {
                                                                                  return (
                                                                                    <CarritoProvider>
                                                                                      {(() => {
                                                                                        return (
                                                                                          <InventoryProvider>
                                                                                            {(() => {
                                                                                              return (
                                                                                                <NotificacionesProvider>
                                                                                                  {(() => {
                                                                                                    return (
                                                                                                      <AnalyticsProvider>
                                                                                                        {(() => {
                                                                                                          return children;
                                                                                                        })()}
                                                                                                      </AnalyticsProvider>
                                                                                                    );
                                                                                                  })()}
                                                                                                </NotificacionesProvider>
                                                                                              );
                                                                                            })()}
                                                                                          </InventoryProvider>
                                                                                        );
                                                                                      })()}
                                                                                    </CarritoProvider>
                                                                                  );
                                                                                })()}
                                                                              </AsistenciaProvider>
                                                                            );
                                                                          })()}
                                                                        </GastosProvider>
                                                                      );
                                                                    })()}
                                                                  </TurnosProvider>
                                                                );
                                                              })()}
                                                            </MultasProvider>
                                                          );
                                                        })()}
                                                      </PagosProvider>
                                                    );
                                                  })()}
                                                </ServiciosProvider>
                                              );
                                            })()}
                                          </ClientesProvider>
                                        );
                                      })()}
                                    </AgendamientosProvider>
                                  );
                                })()}
                              </TestimoniosProvider>
                            );
                          })()}
                        </ModelosProvider>
                      );
                    })()}
                  </VideosProvider>
                );
              })()}
            </PublicUsersProvider>
          );
        })()}
      </LanguageProvider>
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ ERROR EN AllProvidersWrapper:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    }
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#0f1014', color: '#e8e6e3' }}>
        <div className="text-center space-y-4 max-w-2xl p-8">
          <h1 className="text-2xl font-bold" style={{ color: '#c9a961' }}>Error al cargar la aplicación</h1>
          <p className="text-red-400">Error: {error instanceof Error ? error.message : String(error)}</p>
          {error instanceof Error && error.stack && (
            <pre className="text-left text-xs bg-black/50 p-4 rounded overflow-auto max-h-64">
              {error.stack}
            </pre>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded font-medium"
            style={{ backgroundColor: '#c9a961', color: '#0f1014' }}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}

// ✅ NUEVO: Componente de carga global
function GlobalLoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#0f1014' }}>
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-transparent border-t-[#c9a961] rounded-full animate-spin mx-auto" />
          <div className="w-20 h-20 border-4 border-transparent border-b-[#b8956a] rounded-full animate-spin mx-auto absolute top-0 left-1/2 -translate-x-1/2" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#c9a961' }}>
            Black Diamond App
          </h2>
          <p className="text-sm" style={{ color: '#e8e6e3' }}>Cargando sistema...</p>
          <p className="text-xs mt-2" style={{ color: '#666' }}>Conectando con base de datos</p>
        </div>
      </div>
    </div>
  );
}

interface CurrentUser {
  accessToken: string;
  userId: string;
  email: string;
  role: string;
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [verifyingSession, setVerifyingSession] = useState(true);

  // Verificar sesión contra Supabase al cargar — no confiar solo en localStorage
  useEffect(() => {
    const verifySession = async () => {
      const savedUser = localStorage.getItem('blackDiamondUser');
      if (!savedUser) {
        setVerifyingSession(false);
        return;
      }

      try {
        const localUser = JSON.parse(savedUser);

        // Verificar que la sesión de Supabase sigue activa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session || session.user.id !== localUser.userId) {
          localStorage.removeItem('blackDiamondUser');
          setVerifyingSession(false);
          return;
        }

        // Verificar el rol desde la base de datos — no desde localStorage
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData?.role) {
          localStorage.removeItem('blackDiamondUser');
          setVerifyingSession(false);
          return;
        }

        // Actualizar con el rol verificado desde la DB (ignora el localStorage si fue manipulado)
        const verifiedUser: CurrentUser = {
          accessToken: session.access_token,
          userId: session.user.id,
          email: session.user.email || localUser.email,
          role: userData.role,
        };
        localStorage.setItem('blackDiamondUser', JSON.stringify(verifiedUser));
        setCurrentUser(verifiedUser);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error verificando sesión:', error);
        localStorage.removeItem('blackDiamondUser');
      } finally {
        setVerifyingSession(false);
      }
    };

    verifySession();
  }, []);

  // ✅ NUEVO: Listener global de errores para capturar throw null
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        // ✅ FILTRAR ERRORES BENIGNOS
        const errorMessage = event.message?.toLowerCase() || '';
        
        // Lista de errores conocidos que podemos ignorar
        const erroresBenignos = [
          'resizeobserver loop',
          'resizeobserver loop completed',
          'script error', // Errores de scripts externos
        ];
        
        // Si es un error benigno, ignorar silenciosamente
        if (erroresBenignos.some(msg => errorMessage.includes(msg))) {
          event.preventDefault(); // Prevenir que se muestre en consola
          return;
        }
        
        // Solo loggear errores reales
        if (process.env.NODE_ENV === 'development') console.error('🚨 ERROR GLOBAL CAPTURADO:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        });
      } catch (e) {
        // Evitar que el manejador de errores cause más errores
        if (process.env.NODE_ENV === 'development') console.error('Error en handleError:', e);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        // ✅ FILTRAR PROMISE REJECTIONS BENIGNOS
        const reasonStr = String(event.reason)?.toLowerCase() || '';
        
        if (reasonStr.includes('resizeobserver')) {
          event.preventDefault();
          return;
        }
        
        if (process.env.NODE_ENV === 'development') console.error('🚨 PROMISE REJECTION GLOBAL:', {
          reason: event.reason,
        });
      } catch (e) {
        // Evitar que el manejador de errores cause más errores
        if (process.env.NODE_ENV === 'development') console.error('Error en handleUnhandledRejection:', e);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
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
  };

  // Si hay usuario logueado, mostrar dashboard según rol
  // Mostrar loading mientras verificamos sesión contra Supabase
  if (verifyingSession) {
    return <GlobalLoadingScreen />;
  }

  if (currentUser) {
    return (
      <ErrorBoundary>
        <AllProvidersWrapper>
          <div className="min-h-screen w-full" style={{ backgroundColor: '#0f1014', color: '#e8e6e3' }}>
            {currentUser.role === 'programador' && (
              <ProgramadorDashboard
                accessToken={currentUser.accessToken}
                userId={currentUser.userId}
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'owner' && (
              <OwnerDashboard
                accessToken={currentUser.accessToken}
                userId={currentUser.userId}
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'admin' && (
              <AdminDashboard
                accessToken={currentUser.accessToken}
                userId={currentUser.userId}
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'modelo' && (
              <ModeloDashboard
                accessToken={currentUser.accessToken}
                userId={currentUser.userId}
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'moderador' && (
              <ModeradorDashboard
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'contador' && (
              <ContadorDashboard
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'recepcionista' && (
              <RecepcionistaDashboard
                userId={currentUser.userId}
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {currentUser.role === 'supervisor' && (
              <SupervisorDashboard
                userEmail={currentUser.email}
                onLogout={handleLogout}
              />
            )}

            {/* Fallback para roles no reconocidos */}
            {!['programador', 'owner', 'admin', 'modelo', 'moderador', 'contador', 'recepcionista', 'supervisor'].includes(currentUser.role) && (
              <div className="flex items-center justify-center min-h-screen flex-col gap-4">
                <h1 className="text-3xl font-bold" style={{ color: '#c9a961' }}>
                  ¡Bienvenido {currentUser.email}!
                </h1>
                <p className="text-xl">Rol: {currentUser.role}</p>
                <p className="text-gray-400">Dashboard no disponible para este rol.</p>
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 rounded font-medium mt-4"
                  style={{ backgroundColor: '#c9a961', color: '#0f1014' }}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
            <Toaster 
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #2a2a2a',
                },
              }}
            />
          </div>
        </AllProvidersWrapper>
      </ErrorBoundary>
    );
  }

  // Si no hay usuario, mostrar landing page o login
  return (
    <ErrorBoundary>
      <AllProvidersWrapper>
        <div className="min-h-screen w-full" style={{ backgroundColor: '#0f1014', color: '#e8e6e3' }}>
          {showLogin ? (
            <LoginForm
              onLogin={handleLogin}
              onBackToLanding={() => setShowLogin(false)}
            />
          ) : (
            <LandingPage onAccessSystem={() => setShowLogin(true)} />
          )}
          <Toaster 
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#ffffff',
                border: '1px solid #2a2a2a',
              },
            }}
          />
        </div>
      </AllProvidersWrapper>
    </ErrorBoundary>
  );
}