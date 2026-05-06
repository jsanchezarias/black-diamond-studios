// import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, DollarSign } from 'lucide-react';

interface RecentActivityItem {
  id: string;
  descripcion: string;
  tiempo: string;
  tipo: string;
}

interface FinancialSummaryItem {
  periodo: string;
  ingresos: number;
  egresos: number;
  neto: number;
}

interface AdministradorResumenPanelProps {
  recentActivity: RecentActivityItem[];
  financialSummary: FinancialSummaryItem[];
}

export function AdministradorResumenPanel({ recentActivity, financialSummary }: AdministradorResumenPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimos eventos del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-secondary rounded-lg border border-border/50"
              >
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.tiempo}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {activity.tipo}
                </Badge>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay actividad reciente</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
          <CardDescription>Ingresos y egresos por período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financialSummary.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.periodo}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-secondary p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
                    <p className="font-bold text-green-500">
                      ${(item.ingresos / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-secondary p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Egresos</p>
                    <p className="font-bold text-destructive">
                      ${(item.egresos / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="bg-secondary p-3 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Neto</p>
                    <p className="font-bold text-primary">
                      ${(item.neto / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {financialSummary.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No hay datos financieros disponibles</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
