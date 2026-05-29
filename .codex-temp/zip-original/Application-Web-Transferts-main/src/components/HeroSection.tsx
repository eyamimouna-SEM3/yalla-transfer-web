import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BookingForm from "./BookingForm";
import sliderDesert from "@/assets/slider-desert.png";
import sliderRoad from "@/assets/slider-road.png";
import sliderMountain from "@/assets/slider-mountain.png";
import sliderBus from "@/assets/slider-bus.png";

const slides = [
  { src: sliderDesert, alt: "SUV de luxe dans le désert tunisien" },
  { src: sliderRoad, alt: "Véhicule premium sur la route" },
  { src: sliderMountain, alt: "Voiture sur route de montagne" },
  { src: sliderBus, alt: "Bus touristique sur la côte" },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 3000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Slider background */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={current}
          src={slides[current].src}
          alt={slides[current].alt}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,25%,6%)/0.88] via-[hsl(210,25%,10%)/0.72] to-[hsl(210,25%,6%)/0.55]" />
      {/* Accent glows */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[250px] bg-primary/10 rounded-full blur-[100px]" />
      <div className="absolute top-1/4 right-1/4 w-[250px] h-[250px] bg-accent/8 rounded-full blur-[80px]" />

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === current ? "w-8 bg-primary" : "w-3 bg-white/30 hover:bg-white/50"
            }`}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 lg:px-8 pt-24 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left - Hero Text */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.15] tracking-tight">
              La 1<sup className="text-xl sm:text-2xl lg:text-3xl text-primary">ère</sup> solution spécialisée des transferts{" "}
              <br className="hidden lg:block" />
              <span className="relative inline-block mt-2">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  100% automatisée
                </span>
                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-primary/30 rounded-full" />
              </span>{" "}
              en Tunisie
            </h1>

            <p className="text-white/70 text-lg sm:text-xl leading-relaxed max-w-lg border-l-4 border-primary/40 pl-5 py-1">
              Réservez votre transfert privé en quelques clics. Rapide, fiable et transparent pour tous vos trajets en Tunisie.
            </p>
          </motion.div>

          {/* Right - Booking Card (compact) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto"
          >
            <BookingForm compact />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
