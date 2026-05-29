import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MousePointerClick, MapPin, CreditCard, Clock, Bell, Headphones, Download, Shield, Users, Building2, Plane, Hotel, Briefcase, Globe, Truck, CheckCircle2, Smartphone, ArrowRight } from "lucide-react";
import mockupHandPhone from "@/assets/mockup-hand-app.png";
import mockupHandPhoneClient from "@/assets/mockup-hand-client.png";
import StoreButtons from "@/components/StoreButtons";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const AppPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        {/* Hero */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10" />
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-6 order-2 lg:order-1"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                  <Smartphone className="h-4 w-4 text-accent" />
                  <span className="text-xs font-semibold text-accent uppercase tracking-wide">Application mobile</span>
                </div>
                <h1 className="font-display text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                  Yalla Transfert <span className="text-accent">App</span>
                </h1>
                <p className="text-muted-foreground leading-relaxed max-w-lg text-base lg:text-lg">
                  Entre les appels interminables, les prix flous et l'incertitude sur la disponibilité, organiser un transfert peut vite devenir stressant. <strong className="text-foreground">Yalla Transfer change cette expérience.</strong>
                </p>
                <StoreButtons size="lg" className="pt-2" />
              </motion.div>

              <motion.div
                className="flex justify-center order-1 lg:order-2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative">
                  <img
                    src={mockupHandPhone}
                    alt="Yalla Transfer App mockup"
                    className="w-64 lg:w-72 xl:w-80 drop-shadow-2xl relative z-10 object-contain"
                  />
                  <div className="absolute -inset-8 bg-gradient-to-br from-primary/8 to-accent/8 rounded-full blur-3xl -z-10" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pourquoi choisir */}
        <section className="py-16 lg:py-20 bg-muted/40">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">Avantages</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                Pourquoi choisir Yalla Transfer ?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { icon: MousePointerClick, label: "Réservation rapide sans appels téléphoniques" },
                { icon: CreditCard, label: "Prix clairs et transparents" },
                { icon: Clock, label: "Service disponible selon vos horaires" },
                { icon: Shield, label: "Chauffeurs professionnels vérifiés" },
                { icon: MapPin, label: "Suivi du trajet en temps réel" },
                { icon: CheckCircle2, label: "Expérience simplifiée et sécurisée" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex items-center gap-4 p-5 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-default"
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground leading-snug">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comment fonctionne l'application */}
        <section className="py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background -z-10" />
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">Comment ça marche</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                Comment fonctionne l'application ?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
              {/* Left steps */}
              <div className="space-y-6">
                {[
                  { num: 1, text: "Entrez votre point de départ et votre destination" },
                  { num: 2, text: "Choisissez le type de véhicule adapté à votre besoin" },
                ].map((step, i) => (
                  <motion.div
                    key={step.num}
                    className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-button">
                      {step.num}
                    </div>
                    <span className="text-sm font-medium text-foreground leading-relaxed pt-1.5">{step.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Center phone */}
              <motion.div
                className="flex justify-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative">
                  <img
                    src={mockupHandPhoneClient}
                    alt="Yalla Transfer App - Informations Client"
                    className="w-52 lg:w-60 drop-shadow-2xl relative z-10 object-contain"
                  />
                  <div className="absolute -inset-6 bg-primary/5 rounded-full blur-3xl -z-10" />
                </div>
              </motion.div>

              {/* Right steps */}
              <div className="space-y-6">
                {[
                  { num: 3, text: "Confirmez votre réservation en quelques clics" },
                  { num: 4, text: "Suivez votre chauffeur en temps réel" },
                  { num: 5, text: "Évaluez votre expérience" },
                ].map((step, i) => (
                  <motion.div
                    key={step.num}
                    className="flex items-start gap-4 p-5 bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                    custom={i + 2}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                  >
                    <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm shrink-0 shadow-button">
                      {step.num}
                    </div>
                    <span className="text-sm font-medium text-foreground leading-relaxed pt-1.5">{step.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile fallback list */}
            <div className="lg:hidden mt-10 space-y-4 max-w-md mx-auto">
              {[
                "Entrez votre point de départ et votre destination",
                "Choisissez le type de véhicule adapté",
                "Confirmez votre réservation en quelques clics",
                "Suivez votre chauffeur en temps réel",
                "Évaluez votre expérience",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border/50 shadow-card">
                  <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sécurité & Confiance — Modernized with diagonal layout */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 -z-10" />
          {/* Decorative blobs */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/6 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent/8 rounded-full blur-3xl -z-10" />
          
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">Confiance</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Sécurité & Confiance
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Nous mettons tout en œuvre pour garantir des transferts fiables, sûrs et professionnels.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { 
                  title: "Véhicules assurés", 
                  desc: "Chaque véhicule est déclaré et couvert pour le transport de passagers.", 
                  icon: Shield,
                  accent: "primary" as const,
                  num: "01"
                },
                { 
                  title: "Chauffeurs vérifiés", 
                  desc: "Tous les chauffeurs et sociétés partenaires sont contrôlés et validés avant d'intégrer la plateforme.", 
                  icon: CheckCircle2,
                  accent: "accent" as const,
                  num: "02"
                },
                { 
                  title: "Suivi instantané", 
                  desc: "Notre équipe reste disponible pour vous accompagner en cas de besoin.", 
                  icon: MapPin,
                  accent: "primary" as const,
                  num: "03"
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  className="relative group"
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className="relative p-8 rounded-3xl bg-card border border-border/50 overflow-hidden transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl">
                    {/* Background number watermark */}
                    <span className="absolute top-4 right-6 text-7xl font-black text-muted/20 select-none leading-none">{item.num}</span>
                    
                    {/* Colored accent bar */}
                    <div className={`w-12 h-1.5 rounded-full mb-6 ${item.accent === 'accent' ? 'bg-accent' : 'bg-primary'}`} />
                    
                    {/* Icon with gradient ring */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative ${item.accent === 'accent' ? 'bg-accent/10 group-hover:bg-accent/20' : 'bg-primary/10 group-hover:bg-primary/20'} transition-colors duration-300`}>
                      <item.icon className={`h-7 w-7 ${item.accent === 'accent' ? 'text-accent' : 'text-primary'}`} />
                    </div>
                    
                    <h3 className="font-display font-bold text-foreground mb-3 text-xl">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    
                    {/* Bottom gradient line on hover */}
                    <div className={`absolute bottom-0 left-0 w-full h-1 ${item.accent === 'accent' ? 'bg-gradient-to-r from-accent to-accent/40' : 'bg-gradient-to-r from-primary to-primary/40'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pour qui est faite l'app */}
        <section className="py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-primary/3 to-accent/5 -z-10" />
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div className="mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">Cibles</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-3">
                Pour qui est faite l'app ?
              </h2>
              <p className="text-foreground font-semibold text-lg">
                Une application pensée pour tous vos déplacements
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-6 lg:gap-8 max-w-5xl mx-auto">
              {[
                { icon: Briefcase, label: "Professionnels" },
                { icon: Globe, label: "Tunisien résident à l'étranger" },
                { icon: Plane, label: "Les touristes" },
                { icon: Building2, label: "Agences de voyage" },
                { icon: Truck, label: "Société de transport" },
                { icon: Hotel, label: "Hotels" },
                { icon: Users, label: "Sociétés" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  className="flex flex-col items-center gap-4 group cursor-default"
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className="relative">
                    <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-card border-2 border-border/40 shadow-lg flex items-center justify-center group-hover:shadow-xl group-hover:border-accent/40 group-hover:scale-110 transition-all duration-300">
                      <item.icon className="h-8 w-8 lg:h-9 lg:w-9 text-accent" />
                    </div>
                    <div className="absolute -inset-2 bg-accent/8 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                  <span className="text-sm font-semibold text-foreground text-center leading-snug max-w-[120px]">{item.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="hidden lg:block mt-8">
              <div className="w-3/4 mx-auto h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            </div>
          </div>
        </section>

        {/* Fonctionnement simplifié — White cards with full color hover */}
        <section className="py-16 lg:py-20 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">Simple</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                Fonctionnement simplifié
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: MousePointerClick, title: "Réservation en quelques clics", desc: "Sélectionnez votre trajet, choisissez un véhicule et confirmez en un instant.", hoverBg: "hover:bg-primary" },
                { icon: MapPin, title: "Suivi en temps réel du chauffeur", desc: "Visualisez la position de votre chauffeur en direct, pour une expérience fluide et rassurante.", hoverBg: "hover:bg-accent" },
                { icon: CreditCard, title: "Paiement sécurisé intégré", desc: "Payez directement depuis l'application en toute sécurité.", hoverBg: "hover:bg-primary" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  className={`relative p-8 rounded-3xl bg-card border border-border/50 shadow-card cursor-default group overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${item.hoverBg} hover:border-transparent`}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 group-hover:bg-white/20 flex items-center justify-center mb-5 transition-colors duration-500">
                    <item.icon className="h-6 w-6 text-accent group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground group-hover:text-white mb-2 text-lg transition-colors duration-500">{item.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed transition-colors duration-500">{item.desc}</p>
                  
                  {/* Decorative arrow */}
                  <div className="mt-6 flex items-center gap-2 text-accent group-hover:text-white/90 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    <span className="text-sm font-semibold">En savoir plus</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Fonctionnement de Notre Application */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider mb-4">Fonctionnalités</span>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                Fonctionnement de Notre Application
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: Clock, title: "Historique des trajets", desc: "Retrouvez tous vos trajets passés et réservez à nouveau en un clic.", hoverBg: "hover:bg-accent" },
                { icon: Bell, title: "Notifications push", desc: "Restez informé en temps réel de l'état de votre réservation et de l'arrivée du chauffeur.", hoverBg: "hover:bg-primary" },
                { icon: Headphones, title: "Support 24/7", desc: "Notre équipe est disponible à tout moment pour vous assister.", hoverBg: "hover:bg-accent" },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  className={`relative p-8 rounded-3xl bg-card border border-border/50 shadow-card cursor-default group overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${item.hoverBg} hover:border-transparent`}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-white/20 flex items-center justify-center mb-5 transition-colors duration-500">
                    <item.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground group-hover:text-white mb-2 text-lg transition-colors duration-500">{item.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-white/80 leading-relaxed transition-colors duration-500">{item.desc}</p>
                  
                  <div className="mt-6 flex items-center gap-2 text-primary group-hover:text-white/90 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                    <span className="text-sm font-semibold">En savoir plus</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-3xl p-10 sm:p-14 text-center border border-border/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  Prêt à simplifier vos transferts ?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Téléchargez l'application Yalla Transfer et réservez votre prochain trajet en quelques secondes.
                </p>
                <div className="flex justify-center">
                  <StoreButtons size="lg" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AppPage;
