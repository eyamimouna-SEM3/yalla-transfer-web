import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import AppSection from "@/components/AppSection";
import ActivitiesSection from "@/components/ActivitiesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import ReassuranceSection from "@/components/ReassuranceSection";
import PartnersSection from "@/components/PartnersSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import DownloadAppSection from "@/components/DownloadAppSection";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <StatsSection />
        <AppSection />
        <ActivitiesSection />
        <HowItWorksSection />
        <ReassuranceSection />
        <PartnersSection />
        <TestimonialsSection />
        <DownloadAppSection />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default Index;
