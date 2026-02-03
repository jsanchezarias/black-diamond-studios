import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Copy, CheckCircle2, Mail, Key, User, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

interface CredencialesModalProps {
  open: boolean;
  onClose: () => void;
  nombre: string;
  email: string;
  password: string;
  role?: string;
}

/**
 * Modal para mostrar credenciales de acceso después de crear un usuario
 * Permite copiar fácilmente el email y contraseña
 */
export function CredencialesModal({ 
  open, 
  onClose, 
  nombre, 
  email, 
  password,
  role = 'modelo'
}: CredencialesModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyToClipboard = async (text: string, type: 'email' | 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'email') {
        setCopiedEmail(true);
        toast.success('Email copiado');
        setTimeout(() => setCopiedEmail(false), 2000);
      } else if (type === 'password') {
        setCopiedPassword(true);
        toast.success('Contraseña copiada');
        setTimeout(() => setCopiedPassword(false), 2000);
      } else {
        setCopiedAll(true);
        toast.success('Credenciales completas copiadas');
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  const credencialesCompletas = `Credenciales de acceso - Black Diamond
Nombre: ${nombre}
Email: ${email}
Contraseña: ${password}
Role: ${role}

La modelo puede iniciar sesión en el sistema con estas credenciales.`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl">¡Usuario Creado!</DialogTitle>
              <DialogDescription>
                Modelo creada exitosamente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Información del usuario */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{nombre}</h3>
              <Badge variant="outline" className="text-xs">{role}</Badge>
            </div>
          </div>

          {/* Credenciales */}
          <div className="space-y-3">
            {/* Email */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span className="font-medium">Email (Usuario)</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background rounded border text-sm font-mono">
                  {email}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(email, 'email')}
                  className="h-9"
                >
                  {copiedEmail ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Key className="w-3 h-3" />
                <span className="font-medium">Contraseña</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background rounded border text-sm font-mono">
                  {password}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(password, 'password')}
                  className="h-9"
                >
                  {copiedPassword ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Copiar todo */}
          <Button
            variant="secondary"
            className="w-full mt-4 gap-2"
            onClick={() => copyToClipboard(credencialesCompletas, 'all')}
          >
            {copiedAll ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Credenciales Copiadas
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar Todo
              </>
            )}
          </Button>
        </Card>

        {/* Advertencia importante */}
        <Card className="p-4 bg-amber-500/5 border-amber-500/20">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                Importante
              </p>
              <ul className="text-muted-foreground space-y-0.5 text-xs list-disc list-inside">
                <li>Guarda estas credenciales de forma segura</li>
                <li>Compártelas con la modelo a través de un canal seguro</li>
                <li>La modelo puede iniciar sesión inmediatamente</li>
                <li>Esta ventana se mostrará solo una vez</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Instrucciones para la modelo */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <h4 className="font-semibold text-sm mb-2">Instrucciones para la modelo:</h4>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Accede al sistema de Black Diamond</li>
            <li>Haz clic en "Iniciar Sesión"</li>
            <li>Usa el email y contraseña proporcionados</li>
            <li>Podrá ver su dashboard y gestionar su perfil</li>
          </ol>
        </Card>

        {/* Botón cerrar */}
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
