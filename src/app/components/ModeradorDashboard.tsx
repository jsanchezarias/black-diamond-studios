import { useState, useEffect } from 'react';
import { MessageSquare, Bell, LogOut, Shield, Star, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { LogoIsotipo } from './LogoIsotipo';
import { NotificacionesPanel } from './NotificacionesPanel';
import { ChatModeratorPanel } from '../../components/ChatModeratorPanel';
import { GestionTestimoniosPanel } from '../../components/GestionTestimoniosPanel';
import { supabase } from '../../utils/supabase/info';

interface ModeradorDashboardProps {
  userEmail: string;
  onLogout?: () => void;
}

const COLOR_PRIMARY = '#c9a961';

export function ModeradorDashboard({ userEmail, onLogout }: ModeradorDashboardProps) {
  const [tab, setTab]                              = useState('chat');
  const [usuariosConectados, setUsuariosConectados] = useState(0);
  const [testimoniosPendientes, setTestimoniosPendientes] = useState(0);

  // ── Cargar contadores ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const cargarContadores = async () => {
      try {
        // Online users: clients updated in last 5 min
        const { count: online } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
        if (mounted && online !== null) setUsuariosConectados(online);

        // Pending testimonials
        const { count: pendientes } = await supabase
          .from('testimonios')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente');
        if (mounted && pendientes !== null) setTestimoniosPendientes(pendientes);
      } catch (_) {}
    };

    cargarContadores();
    const interval = setInterval(cargarContadores, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // ── Realtime subscription — new testimonios ───────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('mod_testimonios_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonios' }, () => {
        supabase
          .from('testimonios')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'pendiente')
          .then(({ count }) => { if (count !== null) setTestimoniosPendientes(count); });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen w-full bg-background" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header Premium Fijo ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-premium border-b border-primary/15 shadow-premium">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LogoIsotipo size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h1 className="text-base sm:text-lg font-bold text-primary uppercase tracking-wide truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Panel Moderación
                </h1>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online users indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs"
              style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#4ade80' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <Users className="w-3 h-3" />
              <span>{usuariosConectados} en línea</span>
            </div>

            {onLogout && (
              <Button 
                onClick={onLogout}
                variant="ghost" 
                size="sm"
                className="hidden sm:flex border-primary/20 hover:bg-primary/10 text-red-400 hover:text-red-500 h-9"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="pt-24 px-4 pb-12 max-w-7xl mx-auto">
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-card/40 border border-primary/10 p-1 h-auto flex-wrap gap-1">
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat en vivo
            </TabsTrigger>
            <TabsTrigger value="notificaciones" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4 mr-2" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="testimonios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Star className="w-4 h-4 mr-2" />
              Testimonios
              {testimoniosPendientes > 0 && (
                <Badge className="ml-2 h-4 px-1.5 text-[10px] bg-amber-500 text-black border-none">
                  {testimoniosPendientes}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0">
            <ChatModeratorPanel userEmail={userEmail} />
          </TabsContent>

          <TabsContent value="notificaciones" className="mt-0">
            <NotificacionesPanel />
          </TabsContent>

          <TabsContent value="testimonios" className="mt-0">
            <GestionTestimoniosPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
