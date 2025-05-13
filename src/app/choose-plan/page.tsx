import PlanSelection from '@/components/PlanSelection';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Plan selection page
 * If user is not signed in, PlanSelection will redirect them to sign-up first.
 */
export default function ChoosePlanPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Decorative elements */}
        <div className="absolute top-8 -right-4 w-20 h-20 bg-reslo-turquoise/30 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-reslo-blue/30 rounded-full blur-2xl"></div>
        
        {/* Plan selection component */}
        <PlanSelection />
      </main>
      <Footer />
    </div>
  );
}