import React, { useState, useEffect, lazy, Suspense } from 'react';
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
import { BalanceFinancieroProvider } from './app/components/BalanceFinancieroContext';
import { ErrorMonitorProvider, triggerGlobalError } from './app/components/ErrorMonitorContext';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { LoginForm } from './app/components/LoginForm';
import { Toaster } from 'sonner';

// Lazy loading de dashboards — solo se cargan cuando el usuario los necesita
const LandingPage = lazy(() => import('./app/components/LandingPage').then(m => ({ default: m.LandingPage })));
const ProgramadorDashboard = lazy(() => import('./app/components/ProgramadorDashboard').then(m => ({ default: m.ProgramadorDashboard })));
const OwnerDashboard = lazy(() => import('./app/components/OwnerDashboard').then(m => ({ default: m.OwnerDashboard })));
const AdminDashboard = lazy(() => import('./app/components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ModeloDashboard = lazy(() => import('./app/components/ModeloDashboard').then(m => ({ default: m.ModeloDashboard })));
const ClienteDashboard = lazy(() => import('./app/components/ClienteDashboard').then(m => ({ default: m.ClienteDashboard })));

// ✅ Componente que envuelve todos los providers en un solo lugar
function AllProvidersWrapper({ children }: { children: React.ReactNode }) {
  try {
    return (
      <ErrorMonitorProvider>
        <LanguageProvider>
          <PublicUsersProvider>
            <VideosProvider>
              <ModelosProvider>
                <TestimoniosProvider>
                  <AgendamientosProvider>
                    <ClientesProvider>
                      <ServiciosProvider>
                        <PagosProvider>
                          <MultasProvider>
                            <TurnosProvider>
                              <GastosProvider>
                                <AsistenciaProvider>
                                  <CarritoProvider>
                                    <InventoryProvider>
                                      <NotificacionesProvider>
                                        <AnalyticsProvider>
                                          <BalanceFinancieroProvider>
                                            {children}
                                          </BalanceFinancieroProvider>
                                        </AnalyticsProvider>
                                      </NotificacionesProvider>
                                    </InventoryProvider>
                                  </CarritoProvider>
                                </AsistenciaProvider>
                              </GastosProvider>
                            </TurnosProvider>
                          </MultasProvider>
                        </PagosProvider>
                      </ServiciosProvider>
                    </ClientesProvider>
                  </AgendamientosProvider>
                </TestimoniosProvider>
              </ModelosProvider>
            </VideosProvider>
          </PublicUsersProvider>
        </LanguageProvider>
      </ErrorMonitorProvider>
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

// Wrapper minimal para rutas públicas — solo providers sin fetch de datos internos
function PublicProvidersWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorMonitorProvider>
      <LanguageProvider>
        <PublicUsersProvider>
          <ModelosProvider>
            <TestimoniosProvider>
              <VideosProvider>
                {children}
              </VideosProvider>
            </TestimoniosProvider>
          </ModelosProvider>
        </PublicUsersProvider>
      </LanguageProvider>
    </ErrorMonitorProvider>
  );
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
  nombre?: string;
}

function RealtimeIndicator() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel = supabase.channel('_rt_indicator');
    channel.subscribe((status) => {
      setConnected(status === 'SUBSCRIBED');
    });
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 flex items-center gap-1.5 z-[9999] backdrop-blur-sm rounded-full px-3 py-1.5 border text-[11px] font-medium select-none pointer-events-none"
      style={{
        background: 'rgba(15,16,20,0.8)',
        borderColor: connected ? 'rgba(74,222,128,0.35)' : 'rgba(239,68,68,0.35)',
        color: connected ? '#4ade80' : '#f87171',
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${connected ? 'animate-pulse bg-green-400' : 'bg-red-400'}`} />
      {connected ? 'En vivo' : 'Reconectando...'}
    </div>
  );
}

function clearLocalSession() {
  // Limpiar localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('blackDiamond')) {
      localStorage.removeItem(key);
    }
  });
  // Limpiar sessionStorage (donde ahora vive el token de Supabase)
  if (typeof window !== 'undefined') {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
  }
}

export default function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [verifyingSession, setVerifyingSession] = useState(true);

  // ✅ ROLES VÁLIDOS DEL SISTEMA
  const rolesValidos = ['programador', 'owner', 'administrador', 'modelo', 'cliente'];

  // Verificar localStorage al cargar
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const inicializarSesion = async () => {
      try {
        // 1. Verificar sesión activa en Supabase
        const { data: { session } } = await supabase.auth.getSession();

        // 2. Leer localStorage
        const savedUser = localStorage.getItem('blackDiamondUser');

        if (!session) {
          if (savedUser) {
            localStorage.removeItem('blackDiamondUser');
            setCurrentUser(null);
          }
          setVerifyingSession(false);
          return;
        }

        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);

            if (parsed.userId !== session.user.id) {
              console.warn('⚠️ Sesión no coincide, limpiando...');
              localStorage.removeItem('blackDiamondUser');
              await supabase.auth.signOut();
              setCurrentUser(null);
              setVerifyingSession(false);
              return;
            }
             if (!parsed.userId || !parsed.role) {
              console.warn('⚠️ Sesión incompleta en localStorage');
              return;
            }

            const roleLimpio = String(parsed.role).trim().toLowerCase();

            if (process.env.NODE_ENV === 'development') {
              console.log('📦 [App] LocalStorage Role:', roleLimpio);
            }

            if (!rolesValidos.includes(roleLimpio)) {
              console.warn('⚠️ Rol inválido en localStorage, limpiando sesión');
              localStorage.removeItem('blackDiamondUser');
              setVerifyingSession(false);
              return;
            }

            parsed.role = roleLimpio;
            setCurrentUser({ ...parsed, accessToken: session.access_token });
          } catch (e) {
            console.error('❌ Error leyendo localStorage:', e);
            localStorage.removeItem('blackDiamondUser');
          }
        }

        setVerifyingSession(false);
      } catch (e) {
        // Supabase no respondió (red, timeout, etc.) — mostrar landing de todas formas
        if (process.env.NODE_ENV === 'development') console.error('❌ Error iniciando sesión:', e);
        setVerifyingSession(false);
      }
    };

    // Safety net: si Supabase tarda más de 8s, mostrar la app igual
    timeoutId = setTimeout(() => { setVerifyingSession(false); }, 8000);

    inicializarSesion().finally(() => clearTimeout(timeoutId));

    return () => clearTimeout(timeoutId);
  }, []);

  // Verificar sesión contra Supabase periódicamente
  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          clearLocalSession();
          if (mounted) setCurrentUser(null);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('role, nombre, estado')
          .eq('id', session.user.id)
          .maybeSingle();

        let verifiedUser: CurrentUser | null = null;

        if (!userError && userData?.role) {
          if (userData.estado === 'inactivo' || userData.estado === 'bloqueado') {
            await supabase.auth.signOut();
            clearLocalSession();
            if (mounted) setCurrentUser(null);
            return;
          }

          verifiedUser = {
            accessToken: session.access_token,
            userId: session.user.id,
            email: session.user.email || '',
            nombre: userData.nombre || session.user.email,
            role: userData.role?.trim().toLowerCase(),
          };
        } else {
          // Si no está en usuarios, verificar si es cliente
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('id, email, nombre, bloqueado')
            .or(`user_id.eq.${session.user.id},email.eq.${session.user.email}`)
            .maybeSingle();

          if (clienteData && !clienteData.bloqueado) {
            verifiedUser = {
              accessToken: session.access_token,
              userId: session.user.id,
              email: session.user.email || '',
              nombre: clienteData.nombre || session.user.email,
              role: 'cliente',
            };
          } else if (!clienteData) {
            // 🆕 AUTO-PROVISIÓN: Si el usuario existe en Auth pero no en tablas (post-limpieza)
            // lo registramos como cliente automáticamente para que pueda entrar.
            if (process.env.NODE_ENV === 'development') console.log('🌱 [App] Auto-provisionando perfil de cliente...');
            
            const nombreAuto = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Cliente';
            
            const { data: newCliente, error: createError } = await supabase
              .from('clientes')
              .insert({
                user_id: session.user.id,
                email: session.user.email,
                nombre: nombreAuto,
                telefono: '000-' + session.user.id.substring(0, 8),
                nombre_usuario: nombreAuto.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 100),
                created_at: new Date().toISOString()
              })
              .select()
              .maybeSingle();

            if (createError) {
              console.error('❌ Error creando perfil:', createError);
              toast.error('Fallo al crear perfil: ' + createError.message);
            }

            if (newCliente) {
              verifiedUser = {
                accessToken: session.access_token,
                userId: session.user.id,
                email: session.user.email || '',
                nombre: newCliente.nombre,
                role: 'cliente',
              };
            }
          }
        }

        if (!verifiedUser) {
          if (process.env.NODE_ENV === 'development') console.log('❌ [App] verifySession - Usuario no verificado, cerrando sesión');
          await supabase.auth.signOut();
          clearLocalSession();
          if (mounted) setCurrentUser(null);
          return;
        }

        if (process.env.NODE_ENV === 'development') console.log('✅ [App] verifySession - Usuario OK:', verifiedUser.role);
        
        // Solo actualizar si hay cambios
        // accessToken se mantiene solo en memoria — nunca en localStorage
        const { accessToken: _tok, ...userToSave } = verifiedUser;
        const currentSaved = localStorage.getItem('blackDiamondUser');
        if (!currentSaved || JSON.stringify(userToSave) !== currentSaved) {
          console.log('🔄 Actualizando sesión local:', verifiedUser.role);
          localStorage.setItem('blackDiamondUser', JSON.stringify(userToSave));
          if (mounted) setCurrentUser(verifiedUser);
        } else if (mounted) {
          console.log('✨ Sesión recuperada de caché:', verifiedUser.role);
          setCurrentUser(verifiedUser);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('❌ Error verificando sesión:', error);
      }
    };

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearLocalSession();
        localStorage.clear();
        sessionStorage.clear();
        supabase.removeAllChannels();
        if (mounted) setCurrentUser(null);
        return;
      }

      if (event === 'SIGNED_IN' && session) {
        verifySession();
      }

      if (event === 'TOKEN_REFRESHED' && session) {
        if (mounted) setCurrentUser(prev => prev ? { ...prev, accessToken: session.access_token } : prev);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Listener global — categoriza errores, filtra benignos, registra en monitor + Supabase
  useEffect(() => {
    const BENIGNOS = ['resizeobserver loop', 'script error'];

    const handleError = (event: ErrorEvent) => {
      try {
        const msg = event.message?.toLowerCase() || '';
        if (BENIGNOS.some(b => msg.includes(b))) { event.preventDefault(); return; }

        let categoria: Parameters<typeof triggerGlobalError>[0]['categoria'] = 'desconocido';
        let tipo: Parameters<typeof triggerGlobalError>[0]['tipo'] = 'critico';

        if (msg.includes('tolocalestring') || msg.includes('undefined') || msg.includes('null')) categoria = 'componente';
        else if (msg.includes('supabase') || msg.includes('fetch') || msg.includes('network')) categoria = 'red';
        else if (msg.includes('auth') || msg.includes('session') || msg.includes('token')) categoria = 'autenticacion';
        else if (msg.includes('localstorage')) categoria = 'localStorage';
        else if (msg.includes('router') || msg.includes('route')) { categoria = 'router'; tipo = 'advertencia'; }

        // ✅ Verificación ultra-segura de currentUser
        const userEmail = typeof currentUser !== 'undefined' ? currentUser?.email : undefined;
        const userRole = typeof currentUser !== 'undefined' ? currentUser?.role : undefined;

        triggerGlobalError({ 
          tipo, 
          categoria, 
          mensaje: event.message, 
          archivo: event.filename, 
          linea: event.lineno, 
          usuario: userEmail, 
          rol: userRole, 
          stack: event.error?.stack 
        });

        supabase.from('error_logs').insert({
          tipo, categoria, mensaje: event.message, archivo: event.filename,
          linea: event.lineno, usuario_email: userEmail, rol: userRole,
          stack: event.error?.stack, user_agent: navigator.userAgent, url: window.location.href,
        }).then();
      } catch (err) { /* evitar recursión */ }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        const reasonStr = String(event.reason)?.toLowerCase() || '';
        if (reasonStr.includes('resizeobserver')) { event.preventDefault(); return; }

        let categoria: Parameters<typeof triggerGlobalError>[0]['categoria'] = 'desconocido';
        if (reasonStr.includes('supabase') || reasonStr.includes('fetch')) categoria = 'base_datos';
        else if (reasonStr.includes('auth')) categoria = 'autenticacion';

        // ✅ Verificación ultra-segura de currentUser
        const userEmail = typeof currentUser !== 'undefined' ? currentUser?.email : undefined;
        const userRole = typeof currentUser !== 'undefined' ? currentUser?.role : undefined;

        triggerGlobalError({ 
          tipo: 'critico', 
          categoria, 
          mensaje: `Promise rejection: ${String(event.reason)}`, 
          usuario: userEmail, 
          rol: userRole, 
          stack: event.reason?.stack 
        });

        supabase.from('error_logs').insert({
          tipo: 'critico', categoria, mensaje: `Promise rejection: ${String(event.reason)}`,
          usuario_email: userEmail, rol: userRole,
          stack: event.reason?.stack, user_agent: navigator.userAgent, url: window.location.href,
        }).then();
      } catch (err) { /* evitar recursión */ }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [currentUser]);

  const ROLES_VALIDOS = ['programador', 'owner', 'administrador', 'modelo', 'cliente'];

  const handleLogin = (accessToken: string, userId: string, email: string, role: string) => {
    const roleLimpio = role?.trim().toLowerCase() ?? '';
    
    console.log('=== [AUDITORÍA] handleLogin ===');
    console.log('Role recibido:', role);
    console.log('Role procesado:', roleLimpio);
    console.log('User ID:', userId);

    // LIMPIEZA DE EMERGENCIA: Asegurar que no hay basura de roles antiguos
    localStorage.removeItem('blackDiamondUser');

    // Bloquear cualquier rol que no sea de la lista blanca
    if (!roleLimpio || !ROLES_VALIDOS.includes(roleLimpio)) {
      console.error('❌ ROL NO VÁLIDO:', roleLimpio);
      toast.error('Error de acceso: Rol no reconocido (' + (roleLimpio || 'vacío') + ')');
      supabase.auth.signOut().catch(() => {});
      return;
    }

    const user = { accessToken, userId, email, role: roleLimpio };
    
    // Forzar actualización de estado con limpieza previa
    localStorage.setItem('blackDiamondUser', JSON.stringify({ userId, email, role: roleLimpio }));
    
    // Usar una transición limpia
    setCurrentUser(null);
    setTimeout(() => {
      setShowLogin(false);
      setCurrentUser(user);
      console.log('🚀 [UI-FORCE] Dashboard activado con éxito.');
    }, 50);
  };

  const handleLogout = async () => {
    try {
      // 1. Cerrar canales realtime ANTES de invalidar el token
      //    para que los subscriptores puedan desconectarse limpiamente
      supabase.removeAllChannels();

      // 2. Cerrar sesión en Supabase PRIMERO (invalida el token en el servidor)
      //    De esta forma ninguna query posterior tendrá token válido
      await supabase.auth.signOut({ scope: 'global' }).catch(() => {});

      // 3. Limpiar storage
      localStorage.clear();
      sessionStorage.clear();

      if (process.env.NODE_ENV === 'development') console.log('👋 Sesión cerrada correctamente');

      // 4. Redirigir con recarga dura — esto destruye el árbol de React
      //    de forma nativa (sin pasar por el ciclo de desmontaje de React)
      //    evitando que los contextos intenten acceder a datos ya limpiados
      window.location.replace('/');
    } catch (error) {
      console.error('❌ Error crítico en logout:', error);
      localStorage.clear();
      window.location.replace('/');
    }
  };

  // Si hay usuario logueado, mostrar dashboard según rol
  // Mostrar loading mientras verificamos sesión contra Supabase
  if (verifyingSession) {
    return <GlobalLoadingScreen />;
  }

  // Si hay usuario autenticado, mostrar su dashboard correspondiente
  if (currentUser) {
    return (
      <ErrorBoundary>
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
        <AllProvidersWrapper>
          <Suspense fallback={<GlobalLoadingScreen />}>
          <div className="min-h-screen w-full" style={{ backgroundColor: '#0f1014', color: '#e8e6e3' }}>

                {/* Dashboards según Rol */}
                {currentUser.role === 'programador' && (
                  <Suspense fallback={<GlobalLoadingScreen />}>
                    <ProgramadorDashboard 
                      accessToken={currentUser.accessToken} 
                      userId={currentUser.userId} 
                      userEmail={currentUser.email || ''}
                      onLogout={handleLogout}
                    />
                  </Suspense>
                )}

                {currentUser.role === 'owner' && (
                  <Suspense fallback={<GlobalLoadingScreen />}>
                    <OwnerDashboard 
                      accessToken={currentUser.accessToken} 
                      userId={currentUser.userId} 
                      onLogout={handleLogout}
                    />
                  </Suspense>
                )}

                {currentUser.role === 'administrador' && (
                  <Suspense fallback={<GlobalLoadingScreen />}>
                    <AdminDashboard
                      accessToken={currentUser.accessToken}
                      userId={currentUser.userId}
                      userEmail={currentUser.email}
                      onLogout={handleLogout}
                    />
                  </Suspense>
                )}

                {currentUser.role === 'cliente' && (
                  <Suspense fallback={<GlobalLoadingScreen />}>
                    <ClienteDashboard
                      accessToken={currentUser.accessToken}
                      userId={currentUser.userId}
                      userEmail={currentUser.email}
                      onLogout={handleLogout}
                    />
                  </Suspense>
                )}

                {currentUser.role === 'modelo' && (
                  <Suspense fallback={<GlobalLoadingScreen />}>
                    <ModeloDashboard 
                      accessToken={currentUser.accessToken} 
                      userId={currentUser.userId} 
                      userEmail={currentUser.email || ''}
                      onLogout={handleLogout}
                    />
                  </Suspense>
                )}

              <RealtimeIndicator />
            </div>
          </Suspense>
        </AllProvidersWrapper>
      </ErrorBoundary>
    );
  }

  // Si no hay usuario, mostrar landing page o login
  return (
    <ErrorBoundary>
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
      <PublicProvidersWrapper>
        <div className="min-h-screen w-full" style={{ backgroundColor: '#0f1014', color: '#e8e6e3' }}>
          {showLogin ? (
            <LoginForm
              onLogin={handleLogin}
              onBackToLanding={() => setShowLogin(false)}
            />
          ) : (
            <Suspense fallback={<GlobalLoadingScreen />}>
              <LandingPage 
                onAccessSystem={() => setShowLogin(true)} 
                onLoginSuccess={handleLogin}
                currentUser={currentUser}
              />
            </Suspense>
          )}
        </div>
      </PublicProvidersWrapper>
    </ErrorBoundary>
  );
}