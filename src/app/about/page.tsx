
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, BrainCircuit, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Leaf className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-4xl font-extrabold font-heading tracking-tight sm:text-5xl">
            About VerdantWise
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-muted-foreground">
            Your smart companion for a thriving indoor jungle.
          </p>
        </div>

        <div className="mt-16 space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BrainCircuit className="h-8 w-8 text-primary" />
                <span>Our Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                VerdantWise was born from a love for plants and a fascination with technology. Our mission is to demystify plant care, making it accessible and enjoyable for everyone, from the novice plant parent to the seasoned horticulturalist. We believe that by leveraging the power of AI, we can help you build a deeper connection with your green companions and cultivate a flourishing indoor ecosystem.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Sparkles className="h-8 w-8 text-primary" />
                <span>Powered by AI</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                At the heart of VerdantWise is Sage, your personal AI gardening assistant. Sage uses advanced generative AI models to provide personalized advice, identify plants from a photo, diagnose health issues, and even help you find the perfect nickname for your new plant. It's like having a botanist in your pocket, available 24/7 to answer your questions and guide you on your plant care journey.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
