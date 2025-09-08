
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

const projects = [
  {
    name: 'Recipe Savvy',
    description: 'An intelligent recipe application that helps you discover and create delicious meals.',
    link: 'https://recipesavvy.vercel.app/',
    imageUrl: 'https://images.unsplash.com/photo-1515516969-d4008cc6241a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMXx8cGFzdGF8ZW58MHx8fHwxNzU3MzI4NTk1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    aiHint: 'food recipe'
  },
  {
    name: 'VerdantWise',
    description: 'The very app you are using! An AI-powered smart gardening assistant.',
    link: 'https://verdantwise.vercel.app/',
    imageUrl: 'https://i.ibb.co/m1cGLxv/unnamed.png',
    aiHint: 'plant app'
  },
];

export default function ProjectsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold font-heading tracking-tight sm:text-5xl">
            My Projects
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
            A showcase of applications built by TheVibeCod3r.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-1 md:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.name} className="overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative aspect-video w-full">
                    <Image
                      src={project.imageUrl}
                      alt={`Screenshot of ${project.name}`}
                      fill
                      className="object-cover"
                      data-ai-hint={project.aiHint}
                    />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2">{project.name}</CardTitle>
                <p className="text-muted-foreground mb-4 h-12">
                  {project.description}
                </p>
                <Button asChild>
                  <Link href={project.link} target="_blank" rel="noopener noreferrer">
                    Visit Project
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
