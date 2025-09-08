
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="py-4 px-4 md:px-6 border-t bg-background">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        Made by :{' '}
        <Link href="/projects" className="font-semibold text-primary hover:underline">
          TheVibeCod3r
        </Link>
      </div>
    </footer>
  );
}
