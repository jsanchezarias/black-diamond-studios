import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modelo } from '../src/app/components/ModelosContext';

interface EliminarModeloModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  modelo: Modelo | null;
}

export function EliminarModeloModal({ open, onClose, onConfirm, modelo }: EliminarModeloModalProps) {
  const [confirmacion, setConfirmacion] = useState('');
  const [segundaConfirmacion, setSegundaConfirmacion] = useState(false);
  
  const palabraClave = 'ELIMINAR';
  const confirmacionCorrecta = confirmacion === palabraClave;

  const handleConfirmar = () => {
    if (confirmacionCorrecta && segundaConfirmacion) {
      onConfirm();
      handleCerrar();
    }
  };

  const handleCerrar = () => {
    setConfirmacion('');
    setSegundaConfirmacion(false);
    onClose();
  };

  if (!modelo) return null;

  return (
    <Dialog open={open} onOpenChange={handleCerrar}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-xl text-red-500">
                ⚠️ Eliminar Modelo Permanentemente
              </DialogTitle>
              <DialogDescription className="text-red-400/80">
                Esta acción NO se puede deshacer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Información de la modelo */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-lg p-4">
            <h3 className="font-medium text-red-400 mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Modelo a eliminar:
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <img 
                  src={modelo.fotoPerfil} 
                  alt={modelo.nombre}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-white">{modelo.nombre}</p>
                  <p className="text-gray-400 text-xs">{modelo.nombreArtistico}</p>
                </div>
              </div>
              <p className="text-gray-300">
                <span className="text-gray-500">Email:</span> {modelo.email}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Teléfono:</span> {modelo.telefono}
              </p>
              <p className="text-gray-300">
                <span className="text-gray-500">Cédula:</span> {modelo.cedula}
              </p>
            </div>
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-950/20 border border-yellow-500/30 rounded-lg p-4">
            <h4 className="font-medium text-yellow-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              ⚠️ Advertencia Importante
            </h4>
            <ul className="space-y-1 text-sm text-yellow-300/90">
              <li>• Se eliminará permanentemente de la base de datos</li>
              <li>• Su cuenta de acceso será desactivada</li>
              <li>• Se perderá todo su historial y estadísticas</li>
              <li>• Esta acción es <strong className="text-yellow-400">IRREVERSIBLE</strong></li>
            </ul>
          </div>

          {/* Alternativa sugerida */}
          <div className="bg-blue-950/20 border border-blue-500/30 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">💡 ¿Sabías que puedes archivarla?</h4>
            <p className="text-sm text-blue-300/90">
              En lugar de eliminar permanentemente, puedes <strong>archivar</strong> a esta modelo. 
              Esto mantiene su historial intacto y permite restaurarla en el futuro si es necesario.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full border-blue-500/50 hover:bg-blue-500/20 text-blue-400"
              onClick={handleCerrar}
            >
              Cancelar y Archivar en su lugar
            </Button>
          </div>

          {/* Primera confirmación: Escribir palabra clave */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-300">
              1️⃣ Primera verificación: Escribe <code className="bg-red-500/20 px-2 py-0.5 rounded text-red-400 font-mono">{palabraClave}</code> para continuar
            </Label>
            <Input
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value.toUpperCase())}
              placeholder="Escribe ELIMINAR"
              className={`border-2 ${
                confirmacion && !confirmacionCorrecta 
                  ? 'border-red-500 bg-red-950/20' 
                  : confirmacionCorrecta 
                  ? 'border-green-500 bg-green-950/20' 
                  : 'border-border'
              }`}
            />
            {confirmacion && !confirmacionCorrecta && (
              <p className="text-xs text-red-400">
                ❌ Palabra incorrecta. Debes escribir exactamente: {palabraClave}
              </p>
            )}
            {confirmacionCorrecta && (
              <p className="text-xs text-green-400">
                ✅ Primera verificación completada
              </p>
            )}
          </div>

          {/* Segunda confirmación: Checkbox */}
          {confirmacionCorrecta && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-sm font-medium text-gray-300">
                2️⃣ Segunda verificación: Confirma que entiendes las consecuencias
              </Label>
              <div className="flex items-start gap-3 p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
                <input
                  type="checkbox"
                  id="segunda-confirmacion"
                  checked={segundaConfirmacion}
                  onChange={(e) => setSegundaConfirmacion(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-red-500"
                />
                <label 
                  htmlFor="segunda-confirmacion" 
                  className="text-sm text-gray-300 cursor-pointer select-none"
                >
                  Entiendo que esta acción es <strong className="text-red-400">permanente e irreversible</strong>, 
                  y que todos los datos de {modelo.nombre} serán eliminados definitivamente.
                </label>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCerrar}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={!confirmacionCorrecta || !segundaConfirmacion}
              className={`flex-1 ${
                confirmacionCorrecta && segundaConfirmacion
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {confirmacionCorrecta && segundaConfirmacion 
                ? 'Eliminar Permanentemente' 
                : 'Completa ambas verificaciones'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
