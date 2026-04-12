import { useEffect, useRef, useState } from 'react';
import { Star, Shield, Crown, Sparkles } from 'lucide-react';

interface StatItemProps {
  endValue: number;
  label: string;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  delay?: number;
}

function StatCounter({ endValue, label, prefix = '', suffix = '', icon, delay = 0 }: StatItemProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number;
      const duration = 2000; // 2 seconds

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // easeOutQuart para una desaceleración más premium
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeProgress * endValue));

        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      const timer = setTimeout(() => {
        window.requestAnimationFrame(step);
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [isInView, endValue, delay]);

  return (
    <div 
      ref={ref} 
      className={`flex flex-col items-center justify-center p-6 bg-card/40 backdrop-blur-md rounded-2xl border border-primary/20 hover:border-primary/50 transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.5)] group ${isInView ? 'bd-animate-scale-in' : 'opacity-0'}`} 
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all duration-300">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
        {prefix}{count}{suffix}
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-semibold uppercase tracking-widest text-center">
        {label}
      </div>
    </div>
  );
}

/**
 * HeroStats — Componente de contadores animados de impacto rápido
 * Se despliega debajo del Hero principal para aportar credibilidad inmediata (Social Proof).
 */
export function HeroStats() {
  return (
    <section className="py-12 bg-gradient-to-b from-background via-primary/5 to-background relative z-10 border-y border-primary/10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <StatCounter 
            icon={<Crown className="w-7 h-7" />}
            endValue={4}
            suffix="+"
            label="Años de Excelencia"
            delay={0}
          />
          <StatCounter 
            icon={<Star className="w-7 h-7" />}
            endValue={50}
            suffix="+"
            label="Modelos VIP"
            delay={150}
          />
          <StatCounter 
            icon={<Shield className="w-7 h-7" />}
            endValue={100}
            suffix="%"
            label="Confidencialidad"
            delay={300}
          />
          <StatCounter 
            icon={<Sparkles className="w-7 h-7" />}
            endValue={5}
            suffix="/5"
            label="Calificación Premium"
            delay={450}
          />
        </div>
      </div>
    </section>
  );
}
