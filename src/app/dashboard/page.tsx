"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResponsiveOverlay from "@/components/responsive/ResponsiveOverlay";

export default function DashboardPage() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Producto Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Image
            src="/next.svg" // dummy image en /public
            alt="Dummy"
            width={300}
            height={180}
            className="w-full rounded-md border object-cover"
          />
          <p className="text-sm text-muted-foreground">
            Este es un producto de demostración. Solo texto de relleno.
          </p>
          <p className="text-xs text-muted-foreground">
            Uso: pensado para validar la estructura de la UI.
          </p>

          <ResponsiveOverlay
            open={open}
            onOpenChange={setOpen}
            title="Detalle de producto"
            description="Información extendida en overlay responsivo"
            side="bottom"
          >
            <div className="space-y-4">
              <p>
                Aquí puedes ver un detalle más amplio del producto, usando
                nuestro componente <strong>ResponsiveOverlay</strong>.
              </p>
              <p>
                En desktop esto se muestra como <em>Dialog</em>, y en mobile
                como <em>Drawer</em>.
              </p>
              <p>
                El contenido es scrollable si se hace demasiado largo, para no
                deformar el componente.
              </p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quos, dicta impedit. Modi maxime cupiditate corrupti molestias, praesentium inventore alias labore ratione magnam dicta sint, corporis illum consequatur voluptatibus enim voluptatum?</p>
              <p>Phasellus non felis massa. Donec finibus, nulla eu facilisis sodales, est augue venenatis ligula, in convallis erat felis nec nisi. Curabitur at felis ut velit congue convallis. Nulla facilisi.</p>
              
            </div>
          </ResponsiveOverlay>

          <Button onClick={() => setOpen(true)} className="w-full">
            Ver detalle
          </Button>
        </CardContent>
      </Card>

      {/* Puedes duplicar este bloque para más cards con diferentes dummy data */}
      <Card>
        <CardHeader>
          <CardTitle>Servicio Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Image
            src="/vercel.svg"
            alt="Dummy"
            width={300}
            height={180}
            className="w-full rounded-md border object-cover"
          />
          <p className="text-sm text-muted-foreground">
            Otro ejemplo de card en el dashboard.
          </p>
          <p className="text-xs text-muted-foreground">Uso: test de diseño.</p>
          <Button className="w-full">Explorar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recurso Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Image
            src="/globe.svg"
            alt="Dummy"
            width={300}
            height={180}
            className="w-full rounded-md border object-cover"
          />
          <p className="text-sm text-muted-foreground">
            Tercer ejemplo para completar la grilla de tres columnas.
          </p>
          <p className="text-xs text-muted-foreground">Uso: validar layout.</p>
          <Button className="w-full">Abrir</Button>
        </CardContent>
      </Card>
    </div>
  );
}
