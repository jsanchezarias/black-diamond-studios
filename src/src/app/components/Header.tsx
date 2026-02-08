import { LogOut, User, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { LogoIsotipo } from './LogoIsotipo';
import { NotificacionBell } from './NotificacionBell';

interface HeaderProps {
  userEmail: string;
  role: string;
  onLogout: () => void;
}

export function Header({ userEmail, role, onLogout }: HeaderProps) {
  const roleLabels = {
    owner: 'Propietario',
    admin: 'Administrador',
    programador: 'Programador',
    modelo: 'Modelo',
    modelo_demo: 'Modelo',
  };

  const isDemo = role === 'modelo_demo';

  return (
    <header className="border-b border-primary/10 bg-gradient-dark backdrop-blur-premium sticky top-0 z-50 shadow-premium">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Isotipo minimalista de la agencia */}
        <LogoIsotipo size="md" className="flex-shrink-0" />
        
        {/* Información del usuario */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <h1 className="text-sm font-semibold text-foreground font-['Playfair_Display'] tracking-wide">
                {roleLabels[role as keyof typeof roleLabels]}
              </h1>
              {isDemo && (
                <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Demo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          
          {/* Notificaciones */}
          <NotificacionBell />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="border-primary/20 hover:bg-destructive/90 hover:text-foreground hover:border-destructive/50 hover:shadow-lg hover:shadow-destructive/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </header>
  );
}