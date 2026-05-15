import { StreamConTimer } from './StreamConTimer';

interface StreamConPaywallProps {
  onRegistrarse: (tipo: 'registro' | 'login') => void;
}

export function StreamConPaywall({ onRegistrarse }: StreamConPaywallProps) {
  return (
    <StreamConTimer
      mostrarModelos={true}
      onRegistrarse={onRegistrarse}
    />
  );
}
