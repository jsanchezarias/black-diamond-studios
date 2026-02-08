import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/button';

export function OwnerInitBanner() {
  const handleGoToInit = () => {
    window.location.href = '/?init-owner';
  };

  return (
    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-lg p-6 mx-4 my-4">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
        <div className="flex-1 space-y-3">
          <h3 className="text-xl font-bold text-amber-500">
            ⚠️ Cuenta Owner No Inicializada
          </h3>
          <p className="text-foreground">
            Tu cuenta de propietario existe en Supabase Auth, pero <strong>no está registrada en el sistema KV</strong>.
            Por favor, inicializa tu cuenta para poder acceder a todas las funcionalidades.
          </p>
          <div className="bg-background/50 border border-border rounded p-3 text-sm space-y-1">
            <p className="text-muted-foreground">
              <strong>Email detectado:</strong> jsanchezarias@gmail.com
            </p>
            <p className="text-muted-foreground">
              <strong>ID:</strong> <code className="text-xs bg-secondary px-2 py-1 rounded">bbf5bde5-1e74-4788-93a6-16cf5dbe0e1d</code>
            </p>
          </div>
          <Button
            onClick={handleGoToInit}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            size="lg"
          >
            Inicializar Cuenta Owner Ahora
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}