import vehicleEco from "@/assets/vehicle-eco-clean.png";
import vehicleSedan from "@/assets/vehicle-sedan-clean.png";
import vehiclePremium from "@/assets/vehicle-premium-clean.png";
import vehicleLuxe from "@/assets/vehicle-luxe-clean.png";
import vehiclePmr from "@/assets/vehicle-pmr-clean.png";
import vehicleVan from "@/assets/vehicle-van-clean.png";
import vehicle4x4 from "@/assets/vehicle-4x4-clean.png";
import vehicleMinibus from "@/assets/vehicle-minibus-clean.png";
import vehicleAutocar from "@/assets/vehicle-autocar-clean.png";
import vehicleBus from "@/assets/vehicle-bus-clean.png";

export interface VehicleType {
  id: string;
  name: string;
  description: string;
  image: string;
  minPassengers: number;
  maxPassengers: number;
  bigLuggage: number;
  smallLuggage: number;
  babySeat: boolean;
  pmr: boolean;
  basePrice: number;
}

export const vehicleTypes: VehicleType[] = [
  { id: "eco", name: "ECO", description: "Citadine (Clio, Rio)", image: vehicleEco, minPassengers: 1, maxPassengers: 3, bigLuggage: 2, smallLuggage: 2, babySeat: true, pmr: false, basePrice: 45 },
  { id: "sedan", name: "SEDAN", description: "Berline confort (Passat, Jetta)", image: vehicleSedan, minPassengers: 1, maxPassengers: 4, bigLuggage: 3, smallLuggage: 3, babySeat: true, pmr: false, basePrice: 65 },
  { id: "premium", name: "PREMIUM", description: "Berline luxe (Mercedes E, BMW 5)", image: vehiclePremium, minPassengers: 1, maxPassengers: 3, bigLuggage: 3, smallLuggage: 2, babySeat: true, pmr: false, basePrice: 120 },
  { id: "luxe", name: "LUXE", description: "VIP / Protocole (Mercedes S)", image: vehicleLuxe, minPassengers: 1, maxPassengers: 3, bigLuggage: 3, smallLuggage: 2, babySeat: false, pmr: false, basePrice: 200 },
  { id: "pmr", name: "PMR", description: "Véhicule adapté mobilité réduite", image: vehiclePmr, minPassengers: 1, maxPassengers: 4, bigLuggage: 2, smallLuggage: 2, babySeat: false, pmr: true, basePrice: 85 },
  { id: "van", name: "VAN", description: "Minivan familial (Mercedes Vito)", image: vehicleVan, minPassengers: 1, maxPassengers: 9, bigLuggage: 6, smallLuggage: 6, babySeat: true, pmr: false, basePrice: 95 },
  { id: "4x4", name: "4×4", description: "SUV / Tout-terrain (Land Cruiser)", image: vehicle4x4, minPassengers: 1, maxPassengers: 6, bigLuggage: 4, smallLuggage: 4, babySeat: true, pmr: false, basePrice: 110 },
  { id: "minibus", name: "MINIBUS", description: "Petit groupe (Toyota Coaster)", image: vehicleMinibus, minPassengers: 1, maxPassengers: 20, bigLuggage: 15, smallLuggage: 15, babySeat: false, pmr: false, basePrice: 180 },
  { id: "autocar", name: "AUTOCAR", description: "Groupe moyen (24-27 places)", image: vehicleAutocar, minPassengers: 1, maxPassengers: 27, bigLuggage: 25, smallLuggage: 25, babySeat: false, pmr: false, basePrice: 350 },
  { id: "bus", name: "BUS", description: "Grand tourisme (50+ places)", image: vehicleBus, minPassengers: 1, maxPassengers: 55, bigLuggage: 50, smallLuggage: 50, babySeat: false, pmr: false, basePrice: 500 },
];
