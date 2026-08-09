import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Next renders the root not-found outside the (site) route group, so the
// public chrome is included here explicitly.
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        <section className="py-24 sm:py-32">
          <Container className="flex flex-col items-center text-center">
            <p className="font-display text-6xl font-bold text-accent-strong">404</p>
            <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-primary">
              Page not found
            </h1>
            <p className="mt-3 max-w-md text-text-muted">
              The page you&apos;re looking for doesn&apos;t exist or has moved.
            </p>
            <div className="mt-8">
              <Button href="/" variant="primary">
                Back to Home
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
