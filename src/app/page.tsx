"use client";

import Link from "next/link";
import Image from "next/image";
import { PlusCircle } from "lucide-react";
import { usePlantStore } from "@/hooks/use-plant-store";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MyPlantsPage() {
  const { plants } = usePlantStore();

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">My Plants</h1>
          <p className="text-muted-foreground">Your digital garden.</p>
        </div>
        <Button asChild>
          <Link href="/identify">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Plant
          </Link>
        </Button>
      </div>
      {plants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plants.map((plant) => (
            <Link href={`/plant/${plant.id}`} key={plant.id} className="group">
              <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/80">
                <CardHeader className="p-0">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={plant.photoUrl}
                      alt={plant.customName}
                      fill
                      className="object-cover"
                      data-ai-hint="plant"
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 bg-card">
                  <CardTitle className="text-lg font-semibold font-heading">{plant.customName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plant.commonName}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg bg-card">
          <LeafIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Your garden is empty!</h2>
          <p className="text-muted-foreground mt-2 mb-4">Let's add your first plant to get started.</p>
          <Button asChild>
            <Link href="/identify">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Plant
            </Link>
          </Button>
        </div>
      )}
    </AppLayout>
  );
}

function LeafIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 4 13V8a5 5 0 0 1 10 0v5a7 7 0 0 1-7 7Z" />
      <path d="M20.34 10.66A5 5 0 0 0 14 5V2" />
    </svg>
  )
}
