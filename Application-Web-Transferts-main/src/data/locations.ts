export interface LocationOption {
  label: string;
  group: string;
}

const governorats = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte",
  "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia",
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Médenine",
  "Tataouine", "Gafsa", "Tozeur", "Kébili"
].map(g => ({ label: g, group: "Gouvernorat" }));

const airports = [
  "Aéroport Tunis-Carthage", "Aéroport Enfidha-Hammamet", "Aéroport Monastir Habib Bourguiba",
  "Aéroport Djerba-Zarzis", "Aéroport Sfax-Thyna", "Aéroport Tozeur-Nefta",
  "Aéroport Tabarka-Aïn Draham", "Aéroport Gafsa-Ksar"
].map(a => ({ label: a, group: "Aéroport" }));

const ports = [
  "Port de La Goulette", "Port de Radès", "Port de Sousse", "Port de Sfax",
  "Port de Gabès", "Port de Bizerte", "Port de Zarzis"
].map(p => ({ label: p, group: "Port" }));

const hotels = [
  "Hôtel The Residence Tunis", "Hôtel Laico Tunis", "Four Seasons Tunis",
  "Mövenpick Sousse", "Hôtel El Mouradi Hammamet", "Radisson Blu Djerba",
  "Hôtel Hasdrubal Thalassa Yasmine Hammamet", "Hôtel Royal Thalassa Monastir",
  "Hôtel Iberostar Djerba", "Hôtel Sentido Djerba Beach", "Hôtel Steigenberger Marhaba Thalasso",
  "Hôtel Concorde Green Park Palace", "Hôtel Vincci Nozha Beach", "Hôtel Golden Tulip Carthage"
].map(h => ({ label: h, group: "Hôtel" }));

export const allLocations: LocationOption[] = [
  ...airports, ...ports, ...hotels, ...governorats
];
