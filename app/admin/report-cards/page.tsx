import { BookOpenCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ReportCardsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card className="border-dashed">
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
            <BookOpenCheck className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">Raport Digital</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Modul raport akan dilanjutkan setelah manajemen siswa stabil:
            input nilai, preview raport, generate PDF, dan pengiriman ke orang tua.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
