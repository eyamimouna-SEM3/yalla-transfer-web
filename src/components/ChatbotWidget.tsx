import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import chatbotIcon from "@/assets/chatbot-icon.png";

const faqData: Record<string, string> = {
  "réservation": "Pour réserver un transfert, rendez-vous sur la page d'accueil, remplissez le formulaire avec votre lieu de départ, destination, date et nombre de passagers, puis cliquez sur 'Réserver'.",
  "paiement": "Nous acceptons les paiements par Wallet, Click to Pay, Carte internationale et E-Dinar. Pour les réservations de bus, le virement bancaire est également disponible.",
  "annulation": "Vous pouvez annuler votre réservation depuis votre tableau de bord. Les conditions de remboursement dépendent du délai avant le transfert.",
  "remboursement": "Le remboursement est automatique si l'annulation est effectuée plus de 24h avant le transfert. En dessous de 24h, des frais peuvent s'appliquer.",
  "véhicule": "Nous proposons différents types de véhicules adaptés au nombre de passagers : Berline (1-3), Van (4-7), Minibus (8-18), Bus (20+).",
  "chauffeur": "Tous nos chauffeurs et sociétés de transport sont vérifiés et validés par notre équipe avant de pouvoir accepter des courses.",
  "compte": "Pour créer un compte, cliquez sur 'S'inscrire' et choisissez votre profil : Particulier, Corporate, Société de transport ou Chauffeur indépendant.",
  "contact": "Vous pouvez nous contacter via la page Contact ou par email. Notre équipe vous répondra dans les plus brefs délais.",
  "prix": "Les prix sont calculés automatiquement en fonction de la distance, du type de véhicule et du nombre de passagers.",
  "voucher": "Après confirmation de votre réservation, un voucher PDF sera disponible dans votre tableau de bord. Présentez-le au chauffeur le jour du transfert.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, value] of Object.entries(faqData)) {
    if (lower.includes(key)) return value;
  }
  return "Je suis désolé, je n'ai pas compris votre question. Vous pouvez me demander des informations sur : la réservation, le paiement, l'annulation, les véhicules, les chauffeurs, votre compte, les prix ou le voucher.";
}

type Message = { role: "user" | "bot"; content: string };

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Bonjour ! 👋 Je suis l'assistant Yalla Transfer. Comment puis-je vous aider ?" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const botMsg: Message = { role: "bot", content: getResponse(input.trim()) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating icon */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Ouvrir le chatbot"
        >
          <img src={chatbotIcon} alt="Chatbot" className="w-full h-full rounded-full object-cover" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-primary/5">
            <img src={chatbotIcon} alt="Chatbot" className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Assistant Yalla</p>
              <p className="text-[10px] text-muted-foreground">En ligne</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 flex gap-2">
            <Input
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 h-9 text-sm"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
