import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProfileType } from "@/pages/AuthPage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import FormParticulier from "@/components/auth/onboarding/FormParticulier";
import FormCorporate from "@/components/auth/onboarding/FormCorporate";
import FormTransport from "@/components/auth/onboarding/FormTransport";
import FormChauffeur from "@/components/auth/onboarding/FormChauffeur";

interface Props {
  profile: ProfileType;
  name: string;
  email: string;
  onBack: () => void;
}

const StepProfileForm = ({ profile, name, email, onBack }: Props) => {
  if (profile === "particulier") {
    return <FormParticulier name={name} email={email} onBack={onBack} />;
  }
  if (profile === "corporate") {
    return <FormCorporate name={name} email={email} onBack={onBack} />;
  }
  if (profile === "transport") {
    return <FormTransport name={name} email={email} onBack={onBack} />;
  }
  if (profile === "chauffeur") {
    return <FormChauffeur name={name} email={email} onBack={onBack} />;
  }
  return null;
};

export default StepProfileForm;
