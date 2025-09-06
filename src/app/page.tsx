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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline">My Plants</h1>
        <Button asChild>
          <Link href="/identify">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Plant
          </Link>
        </Button>
      </div>
      {plants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {plants.map((plant) => (
            <Link href={`/plant/${plant.id}`} key={plant.id}>
              <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
                <CardHeader className="p-0">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={plant.photoUrl}
                      alt={plant.customName}
                      fill
                      className="object-cover"
                      data-ai-hint="plant"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold font-headline">{plant.customName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plant.commonName}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Your garden is empty!</h2>
          <p className="text-muted-foreground mt-2 mb-4">Let's add your first plant.</p>
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
