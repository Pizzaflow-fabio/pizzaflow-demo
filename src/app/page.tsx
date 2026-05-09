"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AppView = "cliente" | "admin";
type ClienteTab = "home" | "menu" | "carrello" | "storico" | "profilo";
type TipoOrdine = "ritiro" | "consegna";
type AdminFiltro = "tutti" | "ritiro" | "consegna";
type KanbanColonna =
  | "ricevuto"
  | "accettato"
  | "in preparazione"
  | "pronto-in-consegna"
  | "completato";
type SlotStato = "disponibile" | "quasi pieno" | "pieno";
type SlotFiltro =
  | "tutti"
  | "ritiro-disponibili"
  | "ritiro-pieni"
  | "consegna-disponibili"
  | "consegna-pieni"
  | "cucina-piena";
type AdminTab =
  | "dashboard"
  | "ordini"
  | "kanban"
  | "capacita"
  | "ordine-telefonico"
  | "crm"
  | "rfm"
  | "prodotti"
  | "marketing"
  | "archivio";
type StatoOrdine =
  | "ricevuto"
  | "accettato"
  | "in preparazione"
  | "pronto per il ritiro"
  | "ritirato"
  | "in consegna"
  | "consegnato";

type IndirizzoSalvato = {
  id: string;
  etichetta: string;
  viaNumero: string;
  citta: string;
  citofonoInterno: string;
  noteConsegna: string;
};

type ProfiloClienteDemo = {
  nome: string;
  telefono: string;
  email: string;
  indirizziSalvati: IndirizzoSalvato[];
  savedOrders: SavedOrder[];
};

type SavedOrderItem = {
  pizzaId: string;
  nome: string;
  quantita: number;
  extra: string[];
  ingredientiRimossi: string[];
  note: string;
};

type SavedOrder = {
  id: string;
  nomeOrdine: string;
  prodotti: SavedOrderItem[];
  tipoPreferito: TipoOrdine;
  indirizzoPreferitoId?: string;
  totaleStimato: number;
};

type Pizza = {
  id: string;
  nome: string;
  descrizione: string;
  prezzo: number;
  ingredienti: string[];
};

type RigaCarrello = {
  id: string;
  pizzaId: string;
  nome: string;
  basePrezzo: number;
  extra: string[];
  note: string;
  quantita: number;
  ingredientiRimossi?: string[];
};

type PaymentMethod =
  | "cash_on_delivery"
  | "card_on_delivery"
  | "cash_at_pickup"
  | "card_at_pickup"
  | "card_saved_demo"
  | "card_online_demo"
  | "wallet_pay_demo"
  | "satispay_demo"
  | "paypal_demo";

type PaymentStatus = "da pagare" | "pagato";
type OrderSource = "app" | "telefono" | "admin";
type CustomerSource = "app" | "telefono";

type Ordine = {
  id: string;
  clienteId: string;
  clienteNome: string;
  orderDate: string;
  createdAt: string;
  dataISO: string;
  tipoOrdine: TipoOrdine;
  orarioScelto: string;
  stato: StatoOrdine;
  righe: RigaCarrello[];
  costoConsegna: number;
  totaleFinale: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  needsPos: boolean;
  paidAt?: string;
  origineIndirizzo?: "salvato" | "nuovo";
  etichettaIndirizzo?: string;
  indirizzo?: string;
  citofonoInterno?: string;
  telefonoCliente?: string;
  noteRider?: string;
  source: OrderSource;
  printed: boolean;
  printedAt?: string;
  archived: boolean;
  archivedAt?: string;
  serviceDate: string;
};

type Cliente = {
  id: string;
  nome: string;
  telefono: string;
  email?: string;
  ordiniTotali: number;
  ultimoOrdineGiorniFa: number;
  preferenzaWeekend: boolean;
  hasApp: boolean;
  source: CustomerSource;
};

const EXTRA_PREZZI: Record<string, number> = {
  Burrata: 2.5,
  Nduja: 1.5,
  "Funghi porcini": 2,
  "Olive taggiasche": 1.5,
  "Cipolla caramellata": 1,
  "Doppia mozzarella": 1.5,
};
const ORARI_PIZZERIA = {
  openingTime: "18:30",
  closingTime: "22:30",
  slotIntervalMinutes: 15,
} as const;

type SlotCapacityConfig = {
  maxTotalPizzasPerSlot: number;
  maxPickupPizzasPerSlot: number;
  maxDeliveryPizzasPerSlot: number;
  maxPickupOrdersPerSlot: number;
  maxDeliveryOrdersPerSlot: number;
  ridersAvailable: number;
  deliveriesPerRiderPerSlot: number;
  maxPizzasPerDeliveryOrder: number;
};

const DEFAULT_SLOT_CAPACITY: SlotCapacityConfig = {
  maxTotalPizzasPerSlot: 30,
  maxPickupPizzasPerSlot: 18,
  maxDeliveryPizzasPerSlot: 14,
  maxPickupOrdersPerSlot: 8,
  maxDeliveryOrdersPerSlot: 4,
  ridersAvailable: 2,
  deliveriesPerRiderPerSlot: 2,
  maxPizzasPerDeliveryOrder: 20,
};

const PIPELINE_RITIRO: StatoOrdine[] = [
  "ricevuto",
  "accettato",
  "in preparazione",
  "pronto per il ritiro",
  "ritirato",
];

const PIPELINE_CONSEGNA: StatoOrdine[] = [
  "ricevuto",
  "accettato",
  "in preparazione",
  "in consegna",
  "consegnato",
];

const EXTRA_INGREDIENTI = [
  "Burrata",
  "Nduja",
  "Funghi porcini",
  "Olive taggiasche",
  "Cipolla caramellata",
  "Doppia mozzarella",
];

const MENU_PIZZE: Pizza[] = [
  { id: "margherita", nome: "Margherita", descrizione: "Classica napoletana", prezzo: 7.5, ingredienti: ["Pomodoro", "Fior di latte", "Basilico"] },
  { id: "diavola", nome: "Diavola", descrizione: "Piccante al punto giusto", prezzo: 9.5, ingredienti: ["Pomodoro", "Fior di latte", "Salame piccante"] },
  { id: "quattro-formaggi", nome: "Quattro Formaggi", descrizione: "Cremosa e intensa", prezzo: 10.5, ingredienti: ["Fior di latte", "Gorgonzola", "Fontina", "Grana"] },
  { id: "capricciosa", nome: "Capricciosa", descrizione: "Ricca e bilanciata", prezzo: 10, ingredienti: ["Pomodoro", "Fior di latte", "Prosciutto cotto", "Funghi", "Carciofi"] },
  { id: "prosciutto-funghi", nome: "Prosciutto e Funghi", descrizione: "Evergreen da asporto", prezzo: 9.5, ingredienti: ["Pomodoro", "Fior di latte", "Prosciutto cotto", "Funghi"] },
  { id: "bufalina", nome: "Bufalina", descrizione: "Premium con bufala", prezzo: 11, ingredienti: ["Pomodoro", "Mozzarella di bufala", "Pomodorini", "Basilico"] },
  { id: "ortolana", nome: "Ortolana", descrizione: "Verdure grigliate", prezzo: 9, ingredienti: ["Pomodoro", "Fior di latte", "Zucchine", "Melanzane", "Peperoni"] },
  { id: "tonno-cipolla", nome: "Tonno e Cipolla", descrizione: "Saporita e decisa", prezzo: 9.5, ingredienti: ["Pomodoro", "Fior di latte", "Tonno", "Cipolla rossa"] },
  { id: "salsiccia-friarelli", nome: "Salsiccia e Friarielli", descrizione: "Tradizione campana", prezzo: 11, ingredienti: ["Fior di latte", "Salsiccia", "Friarielli"] },
  { id: "tartufo", nome: "Tartufo Gourmet", descrizione: "Aroma premium", prezzo: 13.5, ingredienti: ["Crema tartufata", "Fior di latte", "Funghi", "Scaglie di grana"] },
];

const CLIENTI_DEMO: Cliente[] = [
  { id: "c1", nome: "Giulia B.", telefono: "333 1002001", email: "giulia@email.demo", ordiniTotali: 18, ultimoOrdineGiorniFa: 2, preferenzaWeekend: true, hasApp: true, source: "app" },
  { id: "c2", nome: "Luca P.", telefono: "333 1002002", email: "luca@email.demo", ordiniTotali: 4, ultimoOrdineGiorniFa: 26, preferenzaWeekend: false, hasApp: true, source: "app" },
  { id: "c3", nome: "Marta R.", telefono: "333 1002003", email: "marta@email.demo", ordiniTotali: 12, ultimoOrdineGiorniFa: 8, preferenzaWeekend: true, hasApp: true, source: "app" },
  { id: "c4", nome: "Davide F.", telefono: "333 1002004", email: "davide@email.demo", ordiniTotali: 1, ultimoOrdineGiorniFa: 3, preferenzaWeekend: false, hasApp: true, source: "app" },
];

function buildOrdiniDemoIniziali(): Ordine[] {
  const oggi = getTodayOrderDate();
  const [y, mo, d] = oggi.split("-").map(Number);
  const ieriDate = new Date(y, mo - 1, d - 1);
  const ieri = `${ieriDate.getFullYear()}-${String(ieriDate.getMonth() + 1).padStart(2, "0")}-${String(ieriDate.getDate()).padStart(2, "0")}`;

  const operativi: Ordine[] = [
    {
      id: "PF-2041",
      clienteId: "c1",
      clienteNome: "Giulia B.",
      orderDate: oggi,
      createdAt: `${oggi}T18:12:00`,
      dataISO: `${oggi}T16:12:00.000Z`,
      tipoOrdine: "ritiro",
      orarioScelto: "19:30",
      stato: "pronto per il ritiro",
      righe: [{ id: "r1", pizzaId: "bufalina", nome: "Bufalina", basePrezzo: 11, extra: ["Burrata"], note: "Tagliare in 6 fette", quantita: 1 }],
      costoConsegna: 0,
      totaleFinale: 12.5,
      paymentMethod: "card_at_pickup",
      paymentStatus: "da pagare",
      needsPos: true,
      telefonoCliente: "333 1002001",
      source: "app",
      printed: false,
      archived: false,
      serviceDate: oggi,
    },
    {
      id: "PF-2042",
      clienteId: "c3",
      clienteNome: "Marta R.",
      orderDate: oggi,
      createdAt: `${oggi}T18:26:00`,
      dataISO: `${oggi}T16:26:00.000Z`,
      tipoOrdine: "consegna",
      orarioScelto: "20:00",
      stato: "in consegna",
      righe: [{ id: "r2", pizzaId: "diavola", nome: "Diavola", basePrezzo: 9.5, extra: [], note: "", quantita: 2 }],
      costoConsegna: 2.5,
      totaleFinale: 21.5,
      paymentMethod: "cash_on_delivery",
      paymentStatus: "da pagare",
      needsPos: false,
      origineIndirizzo: "salvato",
      etichettaIndirizzo: "Casa",
      indirizzo: "Via Roma 24, Milano",
      citofonoInterno: "Rossi, Int. 3B",
      telefonoCliente: "333 1002003",
      noteRider: "Suonare una volta sola",
      source: "app",
      printed: false,
      archived: false,
      serviceDate: oggi,
    },
    {
      id: "PF-2043",
      clienteId: "c2",
      clienteNome: "Luca P.",
      orderDate: oggi,
      createdAt: `${oggi}T18:35:00`,
      dataISO: `${oggi}T16:35:00.000Z`,
      tipoOrdine: "ritiro",
      orarioScelto: "19:00",
      stato: "accettato",
      righe: [{ id: "r3", pizzaId: "margherita", nome: "Margherita", basePrezzo: 7.5, extra: [], note: "", quantita: 3 }],
      costoConsegna: 0,
      totaleFinale: 22.5,
      paymentMethod: "cash_at_pickup",
      paymentStatus: "da pagare",
      needsPos: false,
      telefonoCliente: "333 1002002",
      source: "app",
      printed: false,
      archived: false,
      serviceDate: oggi,
    },
    {
      id: "PF-2044",
      clienteId: "c4",
      clienteNome: "Davide F.",
      orderDate: oggi,
      createdAt: `${oggi}T18:40:00`,
      dataISO: `${oggi}T16:40:00.000Z`,
      tipoOrdine: "consegna",
      orarioScelto: "20:00",
      stato: "in preparazione",
      righe: [{ id: "r4", pizzaId: "margherita", nome: "Margherita", basePrezzo: 7.5, extra: [], note: "Ordine team", quantita: 18 }],
      costoConsegna: 0,
      totaleFinale: 135,
      paymentMethod: "card_on_delivery",
      paymentStatus: "da pagare",
      needsPos: true,
      origineIndirizzo: "salvato",
      etichettaIndirizzo: "Ufficio",
      indirizzo: "Viale Monza 118, Milano",
      citofonoInterno: "Reception 1",
      telefonoCliente: "333 1002004",
      noteRider: "Consegna reception piano terra",
      source: "app",
      printed: false,
      archived: false,
      serviceDate: oggi,
    },
    {
      id: "PF-2045",
      clienteId: "c1",
      clienteNome: "Giulia B.",
      orderDate: oggi,
      createdAt: `${oggi}T18:50:00`,
      dataISO: `${oggi}T16:50:00.000Z`,
      tipoOrdine: "ritiro",
      orarioScelto: "20:15",
      stato: "ricevuto",
      righe: [{ id: "r5", pizzaId: "diavola", nome: "Diavola", basePrezzo: 9.5, extra: [], note: "", quantita: 15 }],
      costoConsegna: 0,
      totaleFinale: 142.5,
      paymentMethod: "cash_at_pickup",
      paymentStatus: "da pagare",
      needsPos: false,
      telefonoCliente: "333 1002001",
      source: "app",
      printed: false,
      archived: false,
      serviceDate: oggi,
    },
    {
      id: "PF-2046",
      clienteId: "c3",
      clienteNome: "Marta R.",
      orderDate: oggi,
      createdAt: `${oggi}T18:55:00`,
      dataISO: `${oggi}T16:55:00.000Z`,
      tipoOrdine: "consegna",
      orarioScelto: "20:15",
      stato: "accettato",
      righe: [{ id: "r6", pizzaId: "ortolana", nome: "Ortolana", basePrezzo: 9, extra: [], note: "", quantita: 10 }],
      costoConsegna: 2.5,
      totaleFinale: 92.5,
      paymentMethod: "cash_on_delivery",
      paymentStatus: "da pagare",
      needsPos: false,
      origineIndirizzo: "salvato",
      etichettaIndirizzo: "Casa",
      indirizzo: "Via Roma 24, Milano",
      citofonoInterno: "Rossi, Int. 3B",
      telefonoCliente: "333 1002003",
      noteRider: "",
      source: "app",
      printed: false,
      archived: false,
      serviceDate: oggi,
    },
  ];

  const archiviatiDemo: Ordine[] = [
    {
      id: "PF-1988",
      clienteId: "c2",
      clienteNome: "Luca P.",
      orderDate: ieri,
      createdAt: `${ieri}T19:05:00`,
      dataISO: `${ieri}T17:05:00.000Z`,
      tipoOrdine: "ritiro",
      orarioScelto: "19:30",
      stato: "ritirato",
      righe: [{ id: "hx1", pizzaId: "margherita", nome: "Margherita", basePrezzo: 7.5, extra: [], note: "", quantita: 2 }],
      costoConsegna: 0,
      totaleFinale: 15,
      paymentMethod: "cash_at_pickup",
      paymentStatus: "da pagare",
      needsPos: false,
      telefonoCliente: "333 1002002",
      source: "app",
      printed: true,
      printedAt: `${ieri}T19:20:00.000Z`,
      archived: true,
      archivedAt: `${ieri}T22:10:00.000Z`,
      serviceDate: ieri,
    },
    {
      id: "PF-1989",
      clienteId: "c4",
      clienteNome: "Davide F.",
      orderDate: ieri,
      createdAt: `${ieri}T19:40:00`,
      dataISO: `${ieri}T17:40:00.000Z`,
      tipoOrdine: "consegna",
      orarioScelto: "20:00",
      stato: "consegnato",
      righe: [{ id: "hx2", pizzaId: "quattro-formaggi", nome: "Quattro Formaggi", basePrezzo: 10.5, extra: [], note: "", quantita: 3 }],
      costoConsegna: 0,
      totaleFinale: 31.5,
      paymentMethod: "card_on_delivery",
      paymentStatus: "da pagare",
      needsPos: true,
      origineIndirizzo: "salvato",
      etichettaIndirizzo: "Ufficio",
      indirizzo: "Viale Monza 118, Milano",
      citofonoInterno: "Reception 1",
      telefonoCliente: "333 1002004",
      noteRider: "",
      source: "app",
      printed: true,
      printedAt: `${ieri}T19:50:00.000Z`,
      archived: true,
      archivedAt: `${ieri}T22:10:00.000Z`,
      serviceDate: ieri,
    },
    {
      id: "PF-1990",
      clienteId: "c1",
      clienteNome: "Giulia B.",
      orderDate: ieri,
      createdAt: `${ieri}T18:10:00`,
      dataISO: `${ieri}T16:10:00.000Z`,
      tipoOrdine: "ritiro",
      orarioScelto: "19:00",
      stato: "ritirato",
      righe: [{ id: "hx3", pizzaId: "diavola", nome: "Diavola", basePrezzo: 9.5, extra: ["Doppia mozzarella"], note: "", quantita: 1 }],
      costoConsegna: 0,
      totaleFinale: 11,
      paymentMethod: "cash_at_pickup",
      paymentStatus: "da pagare",
      needsPos: false,
      telefonoCliente: "333 1002001",
      source: "telefono",
      printed: false,
      archived: true,
      archivedAt: `${ieri}T22:10:00.000Z`,
      serviceDate: ieri,
    },
  ];

  return [...operativi, ...archiviatiDemo];
}

const PROFILO_CLIENTE_DEMO: ProfiloClienteDemo = {
  nome: "Giulia Bianchi",
  telefono: "333 1002001",
  email: "giulia.bianchi@email.demo",
  indirizziSalvati: [
    {
      id: "addr-casa",
      etichetta: "Casa",
      viaNumero: "Via Leopardi 14",
      citta: "Milano",
      citofonoInterno: "Bianchi, Int. 2A",
      noteConsegna: "Citofonare e attendere",
    },
    {
      id: "addr-ufficio",
      etichetta: "Ufficio",
      viaNumero: "Viale Monza 118",
      citta: "Milano",
      citofonoInterno: "Reception 1",
      noteConsegna: "Consegnare in portineria",
    },
  ],
  savedOrders: [
    {
      id: "so-1",
      nomeOrdine: "La mia solita",
      prodotti: [
        { pizzaId: "diavola", nome: "Diavola", quantita: 1, extra: ["Doppia mozzarella"], ingredientiRimossi: [], note: "" },
        { pizzaId: "margherita", nome: "Margherita", quantita: 1, extra: [], ingredientiRimossi: [], note: "" },
      ],
      tipoPreferito: "ritiro",
      totaleStimato: 18.5,
    },
    {
      id: "so-2",
      nomeOrdine: "Cena famiglia",
      prodotti: [
        { pizzaId: "margherita", nome: "Margherita", quantita: 2, extra: [], ingredientiRimossi: [], note: "" },
        { pizzaId: "prosciutto-funghi", nome: "Prosciutto e Funghi", quantita: 1, extra: [], ingredientiRimossi: [], note: "" },
        { pizzaId: "diavola", nome: "Diavola", quantita: 1, extra: [], ingredientiRimossi: ["Peperoncino"], note: "Poco piccante" },
      ],
      tipoPreferito: "consegna",
      indirizzoPreferitoId: "addr-casa",
      totaleStimato: 34,
    },
    {
      id: "so-3",
      nomeOrdine: "Ordine ufficio",
      prodotti: [
        { pizzaId: "margherita", nome: "Margherita", quantita: 1, extra: [], ingredientiRimossi: [], note: "" },
        { pizzaId: "quattro-formaggi", nome: "Quattro Formaggi", quantita: 1, extra: [], ingredientiRimossi: [], note: "" },
        { pizzaId: "ortolana", nome: "Ortolana", quantita: 1, extra: [], ingredientiRimossi: [], note: "" },
        { pizzaId: "salsiccia-friarelli", nome: "Salsiccia e Friarielli", quantita: 1, extra: [], ingredientiRimossi: [], note: "" },
      ],
      tipoPreferito: "consegna",
      indirizzoPreferitoId: "addr-ufficio",
      totaleStimato: 38.5,
    },
  ],
};

function formatEuro(value: number) {
  return `EUR ${value.toFixed(2)}`;
}

function getExtraPrezzo(extra: string) {
  return EXTRA_PREZZI[extra] ?? 0;
}

function getTotaleExtra(extra: string[]) {
  return extra.reduce((acc, item) => acc + getExtraPrezzo(item), 0);
}

function normalizzaTelefono(telefono: string) {
  return telefono.replace(/\D/g, "");
}

function getRecencyScore(days: number) {
  if (days <= 3) return 5;
  if (days <= 7) return 4;
  if (days <= 15) return 3;
  if (days <= 30) return 2;
  return 1;
}

function getFrequencyScore(ordiniTotali: number) {
  if (ordiniTotali >= 15) return 5;
  if (ordiniTotali >= 10) return 4;
  if (ordiniTotali >= 6) return 3;
  if (ordiniTotali >= 3) return 2;
  return 1;
}

function getMonetaryScore(spesaTotale: number) {
  if (spesaTotale >= 220) return 5;
  if (spesaTotale >= 140) return 4;
  if (spesaTotale >= 90) return 3;
  if (spesaTotale >= 50) return 2;
  return 1;
}

function getRfmSegment(r: number, f: number, m: number) {
  if (r >= 4 && f >= 4 && m >= 4) return "Campioni";
  if (r >= 3 && f >= 4) return "Clienti fedeli";
  if (r >= 4 && f >= 2) return "Alto potenziale";
  if (r >= 4 && f <= 1) return "Nuovi clienti";
  if (r <= 2 && f >= 3 && m >= 3) return "A rischio";
  if (r <= 2 && f >= 2) return "Da riattivare";
  return "Persi";
}

function getRfmAction(segment: string) {
  switch (segment) {
    case "Campioni":
      return "Premio esclusivo, non sconto pesante";
    case "Clienti fedeli":
      return "Vantaggi app e accesso anticipato";
    case "Alto potenziale":
      return "Spingere ordini ricorrenti in app";
    case "Nuovi clienti":
      return "Spingere secondo ordine";
    case "Da riattivare":
      return "Promo entro 7 giorni";
    case "A rischio":
      return "Reminder + omaggio leggero";
    default:
      return "Recupero soft con novita menu";
  }
}

function formatItalianDate(isoDate?: string | null) {
  if (!isoDate || typeof isoDate !== "string" || !isoDate.trim()) {
    return "Data non disponibile";
  }
  const match = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return "Data non disponibile";
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return "Data non disponibile";
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return "Data non disponibile";
  }
  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatItalianTime(time?: string | null) {
  if (!time || typeof time !== "string" || !time.trim()) {
    return "Orario non disponibile";
  }

  const trimmed = time.trim();
  const dateFromIso = new Date(trimmed);
  if (!Number.isNaN(dateFromIso.getTime())) {
    return dateFromIso.toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const hhmmMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!hhmmMatch) {
    return "Orario non disponibile";
  }
  const hours = Number(hhmmMatch[1]);
  const minutes = Number(hhmmMatch[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return "Orario non disponibile";
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getTodayOrderDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function generaSlotOrari() {
  const openingMinutes = parseTimeToMinutes(ORARI_PIZZERIA.openingTime);
  const closingMinutes = parseTimeToMinutes(ORARI_PIZZERIA.closingTime);
  const slots: string[] = [];
  for (
    let cursorMinutes = openingMinutes;
    cursorMinutes <= closingMinutes;
    cursorMinutes += ORARI_PIZZERIA.slotIntervalMinutes
  ) {
    slots.push(formatMinutesToTime(cursorMinutes));
  }
  return slots;
}

function calcolaCostoConsegna(subtotale: number, tipoOrdine: TipoOrdine) {
  if (tipoOrdine === "ritiro") return 0;
  return subtotale >= 25 ? 0 : 2.5;
}

function getSlotStatus(
  ordiniPrenotati: number,
  pizzePrenotate: number,
  maxOrdini: number,
  maxPizze: number
): SlotStato {
  const residualOrders = maxOrdini - ordiniPrenotati;
  const residualPizzas = maxPizze - pizzePrenotate;
  if (residualOrders <= 0 || residualPizzas <= 0) return "pieno";
  if (
    residualOrders / Math.max(maxOrdini, 1) < 0.3 ||
    residualPizzas / Math.max(maxPizze, 1) < 0.3
  ) {
    return "quasi pieno";
  }
  return "disponibile";
}

const PAYMENT_METHODS_RITIRO: Array<{ id: PaymentMethod; label: string }> = [
  { id: "cash_at_pickup", label: "Paga al ritiro in contanti" },
  { id: "card_at_pickup", label: "Paga al ritiro con carta/bancomat" },
  { id: "card_saved_demo", label: "Usa carta salvata demo" },
  { id: "card_online_demo", label: "Carta online demo" },
  { id: "wallet_pay_demo", label: "Apple Pay / Google Pay demo" },
  { id: "satispay_demo", label: "Satispay demo" },
  { id: "paypal_demo", label: "PayPal demo" },
];

const PAYMENT_METHODS_CONSEGNA: Array<{ id: PaymentMethod; label: string }> = [
  { id: "cash_on_delivery", label: "Contanti alla consegna" },
  { id: "card_on_delivery", label: "Carta/bancomat alla consegna" },
  { id: "card_saved_demo", label: "Usa carta salvata demo" },
  { id: "card_online_demo", label: "Carta online demo" },
  { id: "wallet_pay_demo", label: "Apple Pay / Google Pay demo" },
  { id: "satispay_demo", label: "Satispay demo" },
  { id: "paypal_demo", label: "PayPal demo" },
];

const ONLINE_PAYMENT_METHODS: PaymentMethod[] = [
  "card_saved_demo",
  "card_online_demo",
  "wallet_pay_demo",
  "satispay_demo",
  "paypal_demo",
];

function isOnlinePaymentMethod(method: PaymentMethod) {
  return ONLINE_PAYMENT_METHODS.includes(method);
}

function resolvePaymentForMethod(method: PaymentMethod): {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  needsPos: boolean;
  paidAt?: string;
} {
  switch (method) {
    case "cash_on_delivery":
      return { paymentMethod: "cash_on_delivery", paymentStatus: "da pagare", needsPos: false };
    case "card_on_delivery":
      return { paymentMethod: "card_on_delivery", paymentStatus: "da pagare", needsPos: true };
    case "cash_at_pickup":
      return { paymentMethod: "cash_at_pickup", paymentStatus: "da pagare", needsPos: false };
    case "card_at_pickup":
      return { paymentMethod: "card_at_pickup", paymentStatus: "da pagare", needsPos: true };
    case "card_online_demo":
    case "card_saved_demo":
    case "wallet_pay_demo":
    case "satispay_demo":
    case "paypal_demo":
      return { paymentMethod: method, paymentStatus: "da pagare", needsPos: false };
    default:
      return { paymentMethod: "cash_at_pickup", paymentStatus: "da pagare", needsPos: false };
  }
}

function getPaymentMethodLabel(method?: PaymentMethod) {
  switch (method) {
    case "cash_on_delivery":
      return "Contanti alla consegna";
    case "card_on_delivery":
      return "Carta/bancomat alla consegna";
    case "cash_at_pickup":
      return "Contanti al ritiro";
    case "card_at_pickup":
      return "Carta/bancomat al ritiro";
    case "card_saved_demo":
      return "Carta salvata (demo)";
    case "card_online_demo":
      return "Carta online (demo)";
    case "wallet_pay_demo":
      return "Apple Pay / Google Pay (demo)";
    case "satispay_demo":
      return "Satispay (demo)";
    case "paypal_demo":
      return "PayPal (demo)";
    default:
      return "Metodo non specificato";
  }
}

function getPaymentStatusLabel(status?: PaymentStatus) {
  if (status === "pagato") return "Pagato";
  if (status === "da pagare") return "Da pagare";
  return "Stato pagamento non disponibile";
}

function getPipelineByTipo(tipoOrdine: TipoOrdine) {
  return tipoOrdine === "ritiro" ? PIPELINE_RITIRO : PIPELINE_CONSEGNA;
}

function getProgressPercent(tipoOrdine: TipoOrdine, stato: StatoOrdine) {
  const pipeline = getPipelineByTipo(tipoOrdine);
  const index = Math.max(pipeline.indexOf(stato), 0);
  return (index / (pipeline.length - 1)) * 100;
}

function getKanbanColumn(stato: StatoOrdine): KanbanColonna {
  if (stato === "ricevuto") return "ricevuto";
  if (stato === "accettato") return "accettato";
  if (stato === "in preparazione") return "in preparazione";
  if (stato === "pronto per il ritiro" || stato === "in consegna") return "pronto-in-consegna";
  return "completato";
}

const KANBAN_COLUMNS: Array<{ key: KanbanColonna; titolo: string }> = [
  { key: "ricevuto", titolo: "Ricevuto" },
  { key: "accettato", titolo: "Accettato" },
  { key: "in preparazione", titolo: "In preparazione" },
  { key: "pronto-in-consegna", titolo: "Pronto / In consegna" },
  { key: "completato", titolo: "Completato" },
];

export default function Home() {
  const skipTipoOrdinePaymentReset = useRef(false);
  const [view, setView] = useState<AppView>("cliente");
  const [tabCliente, setTabCliente] = useState<ClienteTab>("home");
  const [carrello, setCarrello] = useState<RigaCarrello[]>([]);
  const [ordini, setOrdini] = useState<Ordine[]>(() => buildOrdiniDemoIniziali());
  const [clienti, setClienti] = useState<Cliente[]>(CLIENTI_DEMO);
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [profiloCliente, setProfiloCliente] =
    useState<ProfiloClienteDemo>(PROFILO_CLIENTE_DEMO);
  const [pizzaSelezionata, setPizzaSelezionata] = useState<Pizza | null>(null);
  const [extraSelezionati, setExtraSelezionati] = useState<string[]>([]);
  const [notePizza, setNotePizza] = useState("");
  const [tipoOrdine, setTipoOrdine] = useState<TipoOrdine>("ritiro");
  const [orarioScelto, setOrarioScelto] = useState(generaSlotOrari()[0] ?? ORARI_PIZZERIA.openingTime);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState("");
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [nuovoIndirizzo, setNuovoIndirizzo] = useState<IndirizzoSalvato>({
    id: "new-address",
    etichetta: "Nuovo indirizzo",
    viaNumero: "",
    citta: "",
    citofonoInterno: "",
    noteConsegna: "",
  });
  const [adminFiltro, setAdminFiltro] = useState<AdminFiltro>("tutti");
  const [adminPrintFilter, setAdminPrintFilter] = useState<"tutti" | "da-stampare" | "stampati">("tutti");
  const [showProfileAddressForm, setShowProfileAddressForm] = useState(false);
  const [profileAddressDraft, setProfileAddressDraft] = useState<IndirizzoSalvato>({
    id: "profile-new",
    etichetta: "",
    viaNumero: "",
    citta: "",
    citofonoInterno: "",
    noteConsegna: "",
  });
  const [profileDemoSavedNotice, setProfileDemoSavedNotice] = useState("");
  const [showReorderPicker, setShowReorderPicker] = useState(false);
  const [reorderNotice, setReorderNotice] = useState("");
  const [showCreatePreferredInfo, setShowCreatePreferredInfo] = useState(false);
  const [showSavePreferredForm, setShowSavePreferredForm] = useState(false);
  const [preferredOrderName, setPreferredOrderName] = useState("");
  const [preferredOrderDemoNotice, setPreferredOrderDemoNotice] = useState("");
  const [menuAddToast, setMenuAddToast] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_at_pickup");
  const [onlinePaymentSimulated, setOnlinePaymentSimulated] = useState(false);
  const [simulatedPaidAt, setSimulatedPaidAt] = useState<string | undefined>(undefined);
  const [slotAvailabilityNotice, setSlotAvailabilityNotice] = useState("");
  const [slotFiltro, setSlotFiltro] = useState<SlotFiltro>("tutti");
  const [slotCapacityConfig, setSlotCapacityConfig] = useState(DEFAULT_SLOT_CAPACITY);
  const [slotCapacityDraft, setSlotCapacityDraft] = useState(DEFAULT_SLOT_CAPACITY);
  const [manualCustomerName, setManualCustomerName] = useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = useState("");
  const [manualCustomerEmail, setManualCustomerEmail] = useState("");
  const [manualTipoOrdine, setManualTipoOrdine] = useState<TipoOrdine>("ritiro");
  const [manualAddress, setManualAddress] = useState("");
  const [manualCitofono, setManualCitofono] = useState("");
  const [manualDeliveryNotes, setManualDeliveryNotes] = useState("");
  const [manualOrarioScelto, setManualOrarioScelto] = useState(generaSlotOrari()[0] ?? ORARI_PIZZERIA.openingTime);
  const [manualPaymentMethod, setManualPaymentMethod] = useState<PaymentMethod>("cash_at_pickup");
  const [manualRows, setManualRows] = useState<Array<RigaCarrello & { adminNote: string }>>([]);
  const [manualSelectedPizzaId, setManualSelectedPizzaId] = useState(MENU_PIZZE[0]?.id ?? "");
  const [manualExtraSelezionati, setManualExtraSelezionati] = useState<string[]>([]);
  const [manualPizzaQty, setManualPizzaQty] = useState(1);
  const [manualPizzaNote, setManualPizzaNote] = useState("");
  const [manualOrderNotice, setManualOrderNotice] = useState("");
  const [manualForceInsert, setManualForceInsert] = useState(false);
  const [manualWhatsappMessage, setManualWhatsappMessage] = useState("");
  const [manualWhatsappPhone, setManualWhatsappPhone] = useState("");
  const [manualCopied, setManualCopied] = useState("");
  const [crmPromoNotice, setCrmPromoNotice] = useState("");
  const [marketingMessageNotice, setMarketingMessageNotice] = useState("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printPreviewOrders, setPrintPreviewOrders] = useState<Ordine[]>([]);
  const [adminArchiveNotice, setAdminArchiveNotice] = useState("");
  const [showFineServizioModal, setShowFineServizioModal] = useState(false);
  const [archiveResetConfirmInput, setArchiveResetConfirmInput] = useState("");

  const totaleCarrello = useMemo(
    () =>
      carrello.reduce(
        (acc, item) => acc + (item.basePrezzo + getTotaleExtra(item.extra)) * item.quantita,
        0
      ),
    [carrello]
  );
  const numeroProdottiCarrello = useMemo(
    () => carrello.reduce((acc, item) => acc + item.quantita, 0),
    [carrello]
  );
  const pizzeNelCarrello = useMemo(
    () => carrello.reduce((acc, item) => acc + item.quantita, 0),
    [carrello]
  );

  const indirizzoSalvatoSelezionato = useMemo(
    () =>
      profiloCliente.indirizziSalvati.find(
        (addr) => addr.id === selectedSavedAddressId
      ),
    [profiloCliente.indirizziSalvati, selectedSavedAddressId]
  );
  const indirizzoCheckout = isAddingNewAddress ? nuovoIndirizzo : indirizzoSalvatoSelezionato;
  const indirizzoConsegnaSelezionato =
    tipoOrdine === "consegna" &&
    (isAddingNewAddress
      ? Boolean(
          nuovoIndirizzo.viaNumero.trim() &&
            nuovoIndirizzo.citta.trim() &&
            nuovoIndirizzo.citofonoInterno.trim()
        )
      : Boolean(selectedSavedAddressId && indirizzoSalvatoSelezionato));
  const costoConsegna = useMemo(() => calcolaCostoConsegna(totaleCarrello, tipoOrdine), [totaleCarrello, tipoOrdine]);
  const totaleFinale = totaleCarrello + costoConsegna;
  const paymentOptions = tipoOrdine === "ritiro" ? PAYMENT_METHODS_RITIRO : PAYMENT_METHODS_CONSEGNA;
  const checkoutPayment = useMemo(() => {
    const base = resolvePaymentForMethod(paymentMethod);
    if (isOnlinePaymentMethod(paymentMethod) && onlinePaymentSimulated) {
      return {
        ...base,
        paymentStatus: "pagato" as const,
        needsPos: false,
        paidAt: simulatedPaidAt,
      };
    }
    return base;
  }, [onlinePaymentSimulated, paymentMethod, simulatedPaidAt]);
  const onlinePaymentPending = isOnlinePaymentMethod(paymentMethod) && !onlinePaymentSimulated;
  const consegnaInvalida =
    tipoOrdine === "consegna" &&
    (!indirizzoCheckout?.viaNumero.trim() ||
      !indirizzoCheckout?.citta.trim() ||
      !indirizzoCheckout?.citofonoInterno.trim());

  const ordiniOperativiOggi = useMemo(() => {
    const oggi = getTodayOrderDate();
    return ordini.filter((o) => !o.archived && o.serviceDate === oggi);
  }, [ordini]);
  const fatturatoDemo = useMemo(
    () => ordiniOperativiOggi.reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOperativiOggi]
  );
  const fatturatoStoricoDemo = useMemo(
    () => ordini.reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordini]
  );
  const ordiniArchiviatiTotali = useMemo(
    () => ordini.filter((o) => o.archived).length,
    [ordini]
  );
  const ultimaGiornataArchiviataInfo = useMemo(() => {
    const conData = ordini.filter((o) => o.archived && o.archivedAt);
    if (!conData.length) return null;
    const latest = conData.reduce((best, o) => (!best || (o.archivedAt ?? "") > (best.archivedAt ?? "") ? o : best));
    return { serviceDate: latest.serviceDate, archivedAt: latest.archivedAt ?? "" };
  }, [ordini]);
  const riepilogoGiornateArchiviate = useMemo(() => {
    const map = new Map<string, Ordine[]>();
    ordini.forEach((o) => {
      if (!o.archived) return;
      const list = map.get(o.serviceDate) ?? [];
      list.push(o);
      map.set(o.serviceDate, list);
    });
    return [...map.entries()]
      .map(([serviceDate, list]) => {
        const fatturato = list.reduce((acc, o) => acc + o.totaleFinale, 0);
        const pizzeVendute = list.reduce(
          (acc, ordine) => acc + ordine.righe.reduce((sum, riga) => sum + riga.quantita, 0),
          0
        );
        return {
          serviceDate,
          numeroOrdini: list.length,
          fatturato,
          pizzeVendute,
          ordiniRitiro: list.filter((o) => o.tipoOrdine === "ritiro").length,
          ordiniConsegna: list.filter((o) => o.tipoOrdine === "consegna").length,
          ordiniTelefonici: list.filter((o) => o.source === "telefono").length,
          comandeStampate: list.filter((o) => o.printed).length,
          scontrinoMedio: list.length ? fatturato / list.length : 0,
        };
      })
      .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate));
  }, [ordini]);
  const incassoOnlineSimulato = useMemo(
    () =>
      ordiniOperativiOggi
        .filter((o) => o.paymentStatus === "pagato" && isOnlinePaymentMethod(o.paymentMethod))
        .reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOperativiOggi]
  );
  const incassoContantiDaRiscuotere = useMemo(
    () =>
      ordiniOperativiOggi
        .filter(
          (o) =>
            o.paymentStatus === "da pagare" &&
            (o.paymentMethod === "cash_on_delivery" || o.paymentMethod === "cash_at_pickup")
        )
        .reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOperativiOggi]
  );
  const incassoPosDaRiscuotere = useMemo(
    () =>
      ordiniOperativiOggi
        .filter(
          (o) =>
            o.paymentStatus === "da pagare" &&
            (o.paymentMethod === "card_on_delivery" || o.paymentMethod === "card_at_pickup")
        )
        .reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOperativiOggi]
  );
  const scontrinoMedio = ordiniOperativiOggi.length ? fatturatoDemo / ordiniOperativiOggi.length : 0;
  const ordiniAttiviCount = ordiniOperativiOggi.filter((o) => {
    const finalState = o.tipoOrdine === "ritiro" ? "ritirato" : "consegnato";
    return o.stato !== finalState;
  }).length;
  const ordiniFiltratiAdmin = useMemo(() => {
    if (adminFiltro === "tutti") return ordiniOperativiOggi;
    return ordiniOperativiOggi.filter((o) => o.tipoOrdine === adminFiltro);
  }, [adminFiltro, ordiniOperativiOggi]);
  const ordiniFiltratiStampa = useMemo(() => {
    if (adminPrintFilter === "tutti") return ordiniFiltratiAdmin;
    if (adminPrintFilter === "da-stampare") return ordiniFiltratiAdmin.filter((o) => !o.printed);
    return ordiniFiltratiAdmin.filter((o) => o.printed);
  }, [adminPrintFilter, ordiniFiltratiAdmin]);
  const comandeDaStampare = useMemo(
    () => ordiniOperativiOggi.filter((o) => !o.printed).length,
    [ordiniOperativiOggi]
  );
  const comandeStampate = useMemo(
    () => ordiniOperativiOggi.filter((o) => o.printed).length,
    [ordiniOperativiOggi]
  );
  const ordiniAttiviPerSlot = useMemo(
    () =>
      ordiniOperativiOggi.filter(
        (o) =>
          !["ritirato", "consegnato", "completato", "annullato"].includes(o.stato)
      ),
    [ordiniOperativiOggi]
  );
  const calcolaSlotCapacity = useMemo(
    () => (pizzeRichieste: number, tipoOrdineSlot: TipoOrdine) =>
      generaSlotOrari().map((slot) => {
        const ordiniSlot = ordiniAttiviPerSlot.filter((o) => o.orarioScelto === slot);
        const ordiniRitiro = ordiniSlot.filter((o) => o.tipoOrdine === "ritiro");
        const ordiniConsegna = ordiniSlot.filter((o) => o.tipoOrdine === "consegna");
        const pickupOrders = ordiniRitiro.length;
        const deliveryOrders = ordiniConsegna.length;
        const pickupPizzas = ordiniRitiro.reduce(
          (acc, ordine) => acc + ordine.righe.reduce((sum, riga) => sum + riga.quantita, 0),
          0
        );
        const deliveryPizzas = ordiniConsegna.reduce(
          (acc, ordine) => acc + ordine.righe.reduce((sum, riga) => sum + riga.quantita, 0),
          0
        );
        const totalPizzas = pickupPizzas + deliveryPizzas;
        const totalResidualPizzas = slotCapacityConfig.maxTotalPizzasPerSlot - totalPizzas;
        const pickupResidualOrders = slotCapacityConfig.maxPickupOrdersPerSlot - pickupOrders;
        const deliveryResidualOrders = slotCapacityConfig.maxDeliveryOrdersPerSlot - deliveryOrders;
        const pickupResidualPizzas = Math.min(
          slotCapacityConfig.maxPickupPizzasPerSlot - pickupPizzas,
          totalResidualPizzas
        );
        const deliveryResidualPizzas = Math.max(
          slotCapacityConfig.maxDeliveryPizzasPerSlot - deliveryPizzas,
          0
        );
        const pickupStatus = getSlotStatus(
          pickupOrders,
          pickupPizzas,
          slotCapacityConfig.maxPickupOrdersPerSlot,
          slotCapacityConfig.maxPickupPizzasPerSlot
        );
        const deliveryStatus = getSlotStatus(
          deliveryOrders,
          deliveryOrders,
          slotCapacityConfig.maxDeliveryOrdersPerSlot,
          slotCapacityConfig.maxDeliveryOrdersPerSlot
        );
        const kitchenFull = totalResidualPizzas <= 0;
        const pickupOverloaded = pickupPizzas > slotCapacityConfig.maxPickupPizzasPerSlot;
        const deliveryOverloaded = deliveryOrders > slotCapacityConfig.maxDeliveryOrdersPerSlot;
        const kitchenOverloaded = totalPizzas > slotCapacityConfig.maxTotalPizzasPerSlot;
        const pickupFull = pickupStatus === "pieno" || kitchenFull;
        const deliveryFull = deliveryStatus === "pieno" || kitchenFull;
        const riderLimited =
          slotCapacityConfig.ridersAvailable <= 0 ||
          deliveryResidualOrders <= Math.ceil(slotCapacityConfig.deliveriesPerRiderPerSlot);
        const exceedsDeliveryOrderPizzaLimit =
          tipoOrdineSlot === "consegna" &&
          pizzeRichieste > slotCapacityConfig.maxPizzasPerDeliveryOrder;
        const insufficientKitchenForOrder = totalResidualPizzas < Math.max(pizzeRichieste, 1);
        const selectedResidualOrders =
          tipoOrdineSlot === "ritiro" ? pickupResidualOrders : deliveryResidualOrders;
        const selectedResidualPizzas = Math.max(
          tipoOrdineSlot === "ritiro" ? pickupResidualPizzas : totalResidualPizzas,
          0
        );
        const selectedOverloaded =
          tipoOrdineSlot === "ritiro" ? pickupOverloaded || kitchenOverloaded : deliveryOverloaded || kitchenOverloaded;
        const selectedFull = (tipoOrdineSlot === "ritiro" ? pickupFull : deliveryFull) || selectedOverloaded;
        const nonDisponibilePerOrdine =
          !selectedFull &&
          (
            selectedResidualOrders < 1 ||
            selectedResidualPizzas < Math.max(pizzeRichieste, 1) ||
            exceedsDeliveryOrderPizzaLimit ||
            insufficientKitchenForOrder
          );
        const selezionabile = !selectedFull && !nonDisponibilePerOrdine;
        return {
          slot,
          pickupOrders,
          deliveryOrders,
          pickupPizzas,
          deliveryPizzas,
          totalPizzas,
          pickupResidualOrders,
          deliveryResidualOrders,
          pickupResidualPizzas,
          deliveryResidualPizzas,
          totalResidualPizzas,
          pickupStatus,
          deliveryStatus,
          kitchenFull,
          riderLimited,
          exceedsDeliveryOrderPizzaLimit,
          insufficientKitchenForOrder,
          pickupOverloaded,
          deliveryOverloaded,
          kitchenOverloaded,
          stato: tipoOrdineSlot === "ritiro" ? pickupStatus : deliveryStatus,
          full: selectedFull,
          nonDisponibilePerOrdine,
          selezionabile,
        };
      }),
    [ordiniAttiviPerSlot, slotCapacityConfig]
  );
  const slotCapacity = useMemo(
    () => calcolaSlotCapacity(pizzeNelCarrello, tipoOrdine),
    [calcolaSlotCapacity, pizzeNelCarrello, tipoOrdine]
  );
  const adminSlotCapacity = useMemo(
    () => calcolaSlotCapacity(1, "ritiro"),
    [calcolaSlotCapacity]
  );
  const slotSummary = useMemo(
    () => ({
      disponibili: adminSlotCapacity.filter(
        (s) => s.pickupStatus !== "pieno" && s.deliveryStatus !== "pieno" && !s.kitchenFull
      ).length,
      quasiPieni: adminSlotCapacity.filter(
        (s) => s.pickupStatus === "quasi pieno" || s.deliveryStatus === "quasi pieno"
      ).length,
      pieni: adminSlotCapacity.filter(
        (s) => s.pickupStatus === "pieno" || s.deliveryStatus === "pieno" || s.kitchenFull
      ).length,
    }),
    [adminSlotCapacity]
  );
  const slotCriticiCount = useMemo(
    () =>
      adminSlotCapacity.filter(
        (slot) => slot.kitchenOverloaded || slot.pickupOverloaded || slot.deliveryOverloaded
      ).length,
    [adminSlotCapacity]
  );
  const slotCapacityFiltered = useMemo(() => {
    if (slotFiltro === "tutti") return adminSlotCapacity;
    if (slotFiltro === "ritiro-disponibili") {
      return adminSlotCapacity.filter((s) => s.pickupStatus !== "pieno" && !s.kitchenFull);
    }
    if (slotFiltro === "ritiro-pieni") {
      return adminSlotCapacity.filter((s) => s.pickupStatus === "pieno" || s.kitchenFull);
    }
    if (slotFiltro === "consegna-disponibili") {
      return adminSlotCapacity.filter((s) => s.deliveryStatus !== "pieno" && !s.kitchenFull);
    }
    if (slotFiltro === "consegna-pieni") {
      return adminSlotCapacity.filter((s) => s.deliveryStatus === "pieno" || s.kitchenFull);
    }
    return adminSlotCapacity.filter((s) => s.kitchenFull);
  }, [adminSlotCapacity, slotFiltro]);
  const selectedSlotInfo = useMemo(
    () => slotCapacity.find((s) => s.slot === orarioScelto),
    [orarioScelto, slotCapacity]
  );
  const canShowPaymentSection =
    tipoOrdine === "ritiro"
      ? Boolean(orarioScelto && selectedSlotInfo?.selezionabile)
      : Boolean(indirizzoConsegnaSelezionato && orarioScelto && selectedSlotInfo?.selezionabile);
  const manualPizzaCount = useMemo(
    () => manualRows.reduce((acc, item) => acc + item.quantita, 0),
    [manualRows]
  );
  const manualSubtotal = useMemo(
    () =>
      manualRows.reduce(
        (acc, item) => acc + (item.basePrezzo + getTotaleExtra(item.extra)) * item.quantita,
        0
      ),
    [manualRows]
  );
  const manualDeliveryCost = useMemo(
    () => calcolaCostoConsegna(manualSubtotal, manualTipoOrdine),
    [manualSubtotal, manualTipoOrdine]
  );
  const manualTotal = manualSubtotal + manualDeliveryCost;
  const manualSlotCapacity = useMemo(
    () => calcolaSlotCapacity(manualPizzaCount, manualTipoOrdine),
    [calcolaSlotCapacity, manualPizzaCount, manualTipoOrdine]
  );
  const manualSelectedSlotInfo = useMemo(
    () => manualSlotCapacity.find((s) => s.slot === manualOrarioScelto),
    [manualOrarioScelto, manualSlotCapacity]
  );
  const manualPhoneNormalized = useMemo(
    () => normalizzaTelefono(manualCustomerPhone),
    [manualCustomerPhone]
  );
  const matchedManualCustomer = useMemo(
    () => clienti.find((c) => normalizzaTelefono(c.telefono) === manualPhoneNormalized),
    [clienti, manualPhoneNormalized]
  );
  const manualPaymentOptions =
    manualTipoOrdine === "ritiro"
      ? PAYMENT_METHODS_RITIRO.filter((m) => m.id === "cash_at_pickup" || m.id === "card_at_pickup")
      : PAYMENT_METHODS_CONSEGNA.filter((m) => m.id === "cash_on_delivery" || m.id === "card_on_delivery");
  const manualPizzaSelezionata = useMemo(
    () => MENU_PIZZE.find((pizza) => pizza.id === manualSelectedPizzaId) ?? null,
    [manualSelectedPizzaId]
  );
  const calcolataDeliveryCapacityDraft =
    slotCapacityDraft.ridersAvailable * slotCapacityDraft.deliveriesPerRiderPerSlot;
  const clientiConApp = useMemo(() => clienti.filter((c) => c.hasApp), [clienti]);
  const clientiSenzaApp = useMemo(() => clienti.filter((c) => !c.hasApp), [clienti]);
  const clientiDaTelefono = useMemo(() => clienti.filter((c) => c.source === "telefono"), [clienti]);
  const incassoDaRiscuotere = incassoContantiDaRiscuotere + incassoPosDaRiscuotere;
  const ordiniTelefoniciOggi = useMemo(
    () => ordiniOperativiOggi.filter((o) => o.source === "telefono"),
    [ordiniOperativiOggi]
  );
  const pizzeVenduteOggi = useMemo(
    () =>
      ordiniOperativiOggi.reduce(
        (acc, ordine) =>
          acc + ordine.righe.reduce((sum, riga) => sum + riga.quantita, 0),
        0
      ),
    [ordiniOperativiOggi]
  );
  const ordiniPerStoricoCliente = useMemo(
    () =>
      [...ordini].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [ordini]
  );
  const pizzaStats = useMemo(() => {
    const totalePizze = Math.max(
      ordini.reduce(
        (acc, ordine) =>
          acc + ordine.righe.reduce((sum, riga) => sum + riga.quantita, 0),
        0
      ),
      1
    );
    return MENU_PIZZE.map((pizza) => {
      const ordiniPizza = ordini.flatMap((ordine) =>
        ordine.righe.filter((riga) => riga.pizzaId === pizza.id)
      );
      const quantitaVenduta = ordiniPizza.reduce((acc, riga) => acc + riga.quantita, 0);
      const fatturato = ordiniPizza.reduce(
        (acc, riga) => acc + (riga.basePrezzo + getTotaleExtra(riga.extra)) * riga.quantita,
        0
      );
      const percentuale = (quantitaVenduta / totalePizze) * 100;
      const badge = percentuale >= 18 ? "TOP" : percentuale >= 8 ? "MEDIA" : "BASSA";
      return { pizza, quantitaVenduta, fatturato, percentuale, badge };
    }).sort((a, b) => b.quantitaVenduta - a.quantitaVenduta);
  }, [ordini]);
  const ingredientiRealiSistema = useMemo(() => {
    const ingredientiMenu = MENU_PIZZE.flatMap((pizza) => pizza.ingredienti);
    return Array.from(new Set([...ingredientiMenu, ...EXTRA_INGREDIENTI]));
  }, []);
  const ingredientUsageStats = useMemo(() => {
    const ingredientiSet = new Set(ingredientiRealiSistema);
    const pizzaById = new Map(MENU_PIZZE.map((pizza) => [pizza.id, pizza]));
    const usage = new Map<
      string,
      { usi: number; extraUsi: number; ricavoExtra: number; rimossi: number; isExtra: boolean }
    >();
    ingredientiRealiSistema.forEach((ingrediente) =>
      usage.set(ingrediente, {
        usi: 0,
        extraUsi: 0,
        ricavoExtra: 0,
        rimossi: 0,
        isExtra: EXTRA_INGREDIENTI.includes(ingrediente),
      })
    );
    ordini.forEach((ordine) => {
      ordine.righe.forEach((riga) => {
        const pizza = pizzaById.get(riga.pizzaId);
        pizza?.ingredienti.forEach((ingrediente) => {
          if (!ingredientiSet.has(ingrediente)) return;
          const item = usage.get(ingrediente);
          if (!item) return;
          item.usi += riga.quantita;
        });
        riga.extra.forEach((extra) => {
          if (!ingredientiSet.has(extra)) return;
          const item = usage.get(extra);
          if (!item) return;
          item.usi += riga.quantita;
          item.extraUsi += riga.quantita;
          item.ricavoExtra += getExtraPrezzo(extra) * riga.quantita;
        });
        (riga.ingredientiRimossi ?? []).forEach((ingredienteRimosso) => {
          if (!ingredientiSet.has(ingredienteRimosso)) return;
          const item = usage.get(ingredienteRimosso);
          if (!item) return;
          item.rimossi += riga.quantita;
        });
      });
    });
    return [...usage.entries()].map(([ingrediente, values]) => ({ ingrediente, ...values }));
  }, [ingredientiRealiSistema, ordini]);
  const extraStats = useMemo(
    () =>
      ingredientUsageStats
        .filter((item) => item.isExtra)
        .map((item) => ({
          ingrediente: item.ingrediente,
          usi: item.extraUsi,
          ricavo: item.ricavoExtra,
          stato:
            item.extraUsi === 0
              ? "Da monitorare"
              : item.extraUsi <= 2
                ? "Possibile spreco"
                : "Da tenere sempre disponibile",
        }))
        .sort((a, b) => b.usi - a.usi),
    [ingredientUsageStats]
  );
  const ingredientiPocoUsati = useMemo(
    () =>
      ingredientUsageStats
        .filter((item) => item.usi <= 3 || item.extraUsi === 0)
        .map((item) => {
          let suggerimento = "Da monitorare";
          if (item.isExtra && item.extraUsi === 0) suggerimento = "Valutare rimozione dagli extra";
          else if (item.isExtra && item.extraUsi <= 1) suggerimento = "Usare solo come speciale";
          else if (item.ingrediente === "Gorgonzola" || item.ingrediente === "Scaglie di grana") {
            suggerimento = "Tenere se utile a pizze premium";
          }
          const spreco = Number((item.isExtra ? 2 + item.usi * 0.25 : 1 + item.usi * 0.15).toFixed(2));
          return {
            ingrediente: item.ingrediente,
            usi: item.usi,
            ricavoExtra: item.isExtra ? item.ricavoExtra : 0,
            spreco,
            suggerimento,
          };
        })
        .sort((a, b) => a.usi - b.usi || b.spreco - a.spreco)
        .slice(0, 8),
    [ingredientUsageStats]
  );
  const topPizzaDelGiorno = useMemo(() => {
    const map = new Map<string, number>();
    ordiniOperativiOggi.forEach((ordine) =>
      ordine.righe.forEach((riga) =>
        map.set(riga.nome, (map.get(riga.nome) ?? 0) + riga.quantita)
      )
    );
    if (!map.size) return "-";
    return [...map.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }, [ordiniOperativiOggi]);
  const extraPiuUsato = extraStats[0]?.ingrediente ?? "-";
  const customerAnalytics = useMemo(() => {
    return clienti.map((cliente) => {
      const ordiniCliente = ordini.filter((o) => o.clienteId === cliente.id);
      const numeroOrdini = ordiniCliente.length;
      const totaleSpeso = ordiniCliente.reduce((acc, o) => acc + o.totaleFinale, 0);
      const ultimoOrdineDate =
        ordiniCliente.length > 0
          ? ordiniCliente
              .map((o) => new Date(o.createdAt).getTime())
              .sort((a, b) => b - a)[0]
          : null;
      const ultimoOrdine = ultimoOrdineDate ? new Date(ultimoOrdineDate).toISOString() : "";
      const scontrinoMedioCliente = numeroOrdini ? totaleSpeso / numeroOrdini : 0;
      const recency = cliente.ultimoOrdineGiorniFa;
      const recencyScore = getRecencyScore(recency);
      const frequencyScore = getFrequencyScore(numeroOrdini || cliente.ordiniTotali);
      const monetaryScore = getMonetaryScore(totaleSpeso || (cliente.ordiniTotali * 12));
      const segmento = getRfmSegment(recencyScore, frequencyScore, monetaryScore);
      const tags: string[] = [];
      tags.push(cliente.hasApp ? "APP" : "SENZA APP");
      if (cliente.source === "telefono") tags.push("TELEFONICO");
      if ((totaleSpeso || cliente.ordiniTotali * 12) >= 120) tags.push("TOP");
      if (cliente.ultimoOrdineGiorniFa > 20) tags.push("DORMIENTE");
      return {
        ...cliente,
        numeroOrdini,
        totaleSpeso,
        ultimoOrdine,
        scontrinoMedioCliente,
        recencyScore,
        frequencyScore,
        monetaryScore,
        segmento,
        suggerimento: getRfmAction(segmento),
        tags,
      };
    });
  }, [clienti, ordini]);
  const clientiDormienti = useMemo(
    () => customerAnalytics.filter((c) => c.ultimoOrdineGiorniFa > 20),
    [customerAnalytics]
  );
  const clientiMigliori = useMemo(
    () =>
      [...customerAnalytics]
        .sort((a, b) => b.totaleSpeso - a.totaleSpeso)
        .slice(0, 5),
    [customerAnalytics]
  );

  function simulaPagamentoOnline() {
    setOnlinePaymentSimulated(true);
    setSimulatedPaidAt(new Date().toISOString());
  }

  function aggiungiPizza() {
    if (!pizzaSelezionata) return;
    const nomePizza = pizzaSelezionata.nome;
    const nuovaRiga: RigaCarrello = {
      id: crypto.randomUUID(),
      pizzaId: pizzaSelezionata.id,
      nome: pizzaSelezionata.nome,
      basePrezzo: pizzaSelezionata.prezzo,
      extra: extraSelezionati,
      note: notePizza,
      quantita: 1,
    };
    setCarrello((prev) => [...prev, nuovaRiga]);
    setPizzaSelezionata(null);
    setExtraSelezionati([]);
    setNotePizza("");
    setMenuAddToast(`${nomePizza} aggiunta al carrello`);
  }

  function confermaOrdine() {
    if (!carrello.length) return;
    if (consegnaInvalida) return;
    if (onlinePaymentPending) return;
    const nuovoOrdine: Ordine = {
      id: `PF-${2000 + ordini.length + 1}`,
      clienteId: "c1",
      clienteNome: "Giulia B.",
      orderDate: getTodayOrderDate(),
      createdAt: new Date().toISOString(),
      dataISO: new Date().toISOString(),
      tipoOrdine,
      orarioScelto,
      stato: "ricevuto",
      righe: carrello,
      costoConsegna,
      totaleFinale,
      paymentMethod: checkoutPayment.paymentMethod,
      paymentStatus: checkoutPayment.paymentStatus,
      needsPos: checkoutPayment.needsPos,
      paidAt: checkoutPayment.paidAt,
      origineIndirizzo: tipoOrdine === "consegna" ? (isAddingNewAddress ? "nuovo" : "salvato") : undefined,
      etichettaIndirizzo: tipoOrdine === "consegna" ? indirizzoCheckout?.etichetta : undefined,
      indirizzo:
        tipoOrdine === "consegna" && indirizzoCheckout
          ? `${indirizzoCheckout.viaNumero}, ${indirizzoCheckout.citta}`
          : undefined,
      citofonoInterno: tipoOrdine === "consegna" ? indirizzoCheckout?.citofonoInterno : undefined,
      telefonoCliente: profiloCliente.telefono,
      noteRider: tipoOrdine === "consegna" ? indirizzoCheckout?.noteConsegna : undefined,
      source: "app",
      printed: false,
      archived: false,
      serviceDate: getTodayOrderDate(),
    };
    setOrdini((prev) => [nuovoOrdine, ...prev]);
    setClienti((prev) =>
      prev.map((cliente) =>
        cliente.id === "c1"
          ? {
              ...cliente,
              ordiniTotali: cliente.ordiniTotali + 1,
              ultimoOrdineGiorniFa: 0,
            }
          : cliente
      )
    );
    setCarrello([]);
    setTipoOrdine("ritiro");
    setOrarioScelto(generaSlotOrari()[0] ?? ORARI_PIZZERIA.openingTime);
    setIsAddingNewAddress(false);
    setNuovoIndirizzo({
      id: "new-address",
      etichetta: "Nuovo indirizzo",
      viaNumero: "",
      citta: "",
      citofonoInterno: "",
      noteConsegna: "",
    });
    setPaymentMethod("cash_at_pickup");
    setOnlinePaymentSimulated(false);
    setSimulatedPaidAt(undefined);
    setTabCliente("storico");
  }

  function riordinaSolita() {
    setShowReorderPicker(true);
  }

  function caricaUltimoOrdine() {
    const ultimoOrdine = ordini[0];
    if (!ultimoOrdine) return;
    setCarrello(ultimoOrdine.righe.map((r) => ({ ...r, id: crypto.randomUUID() })));
    skipTipoOrdinePaymentReset.current = true;
    setTipoOrdine(ultimoOrdine.tipoOrdine);
    setPaymentMethod(ultimoOrdine.paymentMethod);
    setOnlinePaymentSimulated(ultimoOrdine.paymentStatus === "pagato" && isOnlinePaymentMethod(ultimoOrdine.paymentMethod));
    setSimulatedPaidAt(ultimoOrdine.paidAt);
    if (ultimoOrdine.tipoOrdine === "consegna" && ultimoOrdine.etichettaIndirizzo) {
      const match = profiloCliente.indirizziSalvati.find((a) => a.etichetta === ultimoOrdine.etichettaIndirizzo);
      if (match) setSelectedSavedAddressId(match.id);
    }
    setShowReorderPicker(false);
    setReorderNotice("Ordine preferito caricato nel carrello");
    setTabCliente("carrello");
  }

  function caricaSavedOrder(savedOrder: SavedOrder) {
    const nuoveRighe: RigaCarrello[] = savedOrder.prodotti.map((item) => {
      const pizza = MENU_PIZZE.find((p) => p.id === item.pizzaId);
      return {
        id: crypto.randomUUID(),
        pizzaId: item.pizzaId,
        nome: item.nome,
        basePrezzo: pizza?.prezzo ?? 9,
        extra: item.extra,
        note: [item.note, item.ingredientiRimossi.length ? `Senza: ${item.ingredientiRimossi.join(", ")}` : ""].filter(Boolean).join(" - "),
        quantita: item.quantita,
      };
    });
    setCarrello(nuoveRighe);
    setTipoOrdine(savedOrder.tipoPreferito);
    if (savedOrder.tipoPreferito === "consegna" && savedOrder.indirizzoPreferitoId) {
      setSelectedSavedAddressId(savedOrder.indirizzoPreferitoId);
    }
    setShowReorderPicker(false);
    setReorderNotice("Ordine preferito caricato nel carrello");
    setTabCliente("carrello");
  }

  function avanzaStatoOrdine(ordineId: string) {
    const oggi = getTodayOrderDate();
    setOrdini((prev) =>
      prev.map((ordine) => {
        if (ordine.id !== ordineId) return ordine;
        if (ordine.archived || ordine.serviceDate !== oggi) return ordine;
        const pipeline = getPipelineByTipo(ordine.tipoOrdine);
        const currentIndex = pipeline.indexOf(ordine.stato);
        if (currentIndex === -1 || currentIndex >= pipeline.length - 1) return ordine;
        return { ...ordine, stato: pipeline[currentIndex + 1] };
      })
    );
  }

  function avanzaTuttiOrdiniAttivi() {
    const oggi = getTodayOrderDate();
    setOrdini((prev) =>
      prev.map((ordine) => {
        if (ordine.archived || ordine.serviceDate !== oggi) return ordine;
        const pipeline = getPipelineByTipo(ordine.tipoOrdine);
        const currentIndex = pipeline.indexOf(ordine.stato);
        if (currentIndex === -1 || currentIndex >= pipeline.length - 1) return ordine;
        return { ...ordine, stato: pipeline[currentIndex + 1] };
      })
    );
  }

  function salvaNuovoIndirizzoDemo() {
    if (
      !profileAddressDraft.etichetta.trim() ||
      !profileAddressDraft.viaNumero.trim() ||
      !profileAddressDraft.citta.trim()
    ) {
      return;
    }
    const nuovo: IndirizzoSalvato = {
      ...profileAddressDraft,
      id: crypto.randomUUID(),
    };
    setProfiloCliente((prev) => ({
      ...prev,
      indirizziSalvati: [...prev.indirizziSalvati, nuovo],
    }));
    setSelectedSavedAddressId(nuovo.id);
    setShowProfileAddressForm(false);
    setProfileAddressDraft({
      id: "profile-new",
      etichetta: "",
      viaNumero: "",
      citta: "",
      citofonoInterno: "",
      noteConsegna: "",
    });
    setProfileDemoSavedNotice(
      "Indirizzo demo salvato in UI. Nella versione reale verrebbe salvato nel profilo cliente."
    );
  }

  function salvaOrdinePreferitoDemo() {
    if (!preferredOrderName.trim()) return;
    setPreferredOrderDemoNotice(
      `Ordine "${preferredOrderName}" salvato in demo UI. Nella versione reale verrebbe salvato nel tuo profilo.`
    );
    setPreferredOrderName("");
    setShowSavePreferredForm(false);
  }

  function buildManualRowSignature(row: Pick<RigaCarrello, "pizzaId" | "extra" | "note" | "ingredientiRimossi">) {
    const extra = [...row.extra].sort().join("|");
    const ingredientiRimossi = [...(row.ingredientiRimossi ?? [])].sort().join("|");
    return [row.pizzaId, extra, ingredientiRimossi, row.note.trim().toLowerCase()].join("::");
  }

  function aggiungiPizzaOrdineManuale() {
    const pizza = manualPizzaSelezionata;
    if (!pizza || manualPizzaQty < 1) return;
    const nuovaRiga: RigaCarrello & { adminNote: string } = {
      id: crypto.randomUUID(),
      pizzaId: pizza.id,
      nome: pizza.nome,
      basePrezzo: pizza.prezzo,
      extra: manualExtraSelezionati,
      note: manualPizzaNote.trim(),
      adminNote: manualPizzaNote.trim(),
      quantita: manualPizzaQty,
    };
    setManualRows((prev) => {
      const nuovaFirma = buildManualRowSignature(nuovaRiga);
      const existingIndex = prev.findIndex((row) => buildManualRowSignature(row) === nuovaFirma);
      if (existingIndex === -1) return [...prev, nuovaRiga];
      return prev.map((row, index) =>
        index === existingIndex ? { ...row, quantita: row.quantita + manualPizzaQty } : row
      );
    });
    setManualPizzaQty(1);
    setManualPizzaNote("");
    setManualExtraSelezionati([]);
  }

  function aggiornaQuantitaManualRow(rowId: string, qty: number) {
    if (qty < 1) return;
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, quantita: qty } : row))
    );
  }

  function removeManualRow(rowId: string) {
    setManualRows((prev) => prev.filter((row) => row.id !== rowId));
  }

  function incrementaManualPizzaQty() {
    setManualPizzaQty((prev) => Math.max(1, prev + 1));
  }

  function decrementaManualPizzaQty() {
    setManualPizzaQty((prev) => Math.max(1, prev - 1));
  }

  function buildWhatsappOrderMessage(ordine: Ordine) {
    return [
      `Ciao ${ordine.clienteNome}, il tuo ordine ${ordine.id} e confermato!`,
      `Tipo ordine: ${ordine.tipoOrdine === "ritiro" ? "Ritiro in pizzeria" : "Consegna a domicilio"}`,
      `Orario: ${ordine.orarioScelto}`,
      `Totale: ${formatEuro(ordine.totaleFinale)}`,
      `Pagamento: ${getPaymentMethodLabel(ordine.paymentMethod)}`,
      "",
      "Scarica l'app PizzaFlow per i prossimi ordini:",
      "https://pizzaflow-demo.vercel.app",
      "La prossima volta riordini la tua pizza in 2 click.",
    ].join("\n");
  }

  async function copiaMessaggioWhatsapp(testo: string) {
    if (!testo) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(testo);
        setManualCopied("Messaggio copiato negli appunti.");
        return;
      }
      setManualCopied("Copia automatica non disponibile: seleziona e copia il testo.");
    } catch {
      setManualCopied("Copia automatica non disponibile: seleziona e copia il testo.");
    }
  }

  function apriWhatsapp(phone: string, testo: string) {
    const phoneClean = normalizzaTelefono(phone);
    if (!phoneClean) return;
    const url = `https://wa.me/${phoneClean}?text=${encodeURIComponent(testo)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function buildMarketingMessage(template: "app" | "riattivazione" | "secondo-ordine", nome: string) {
    if (template === "app") {
      return `Ciao ${nome}, dalla prossima volta puoi ordinare la tua pizza in 2 click dalla nostra app: https://pizzaflow-demo.vercel.app`;
    }
    if (template === "riattivazione") {
      return `Ciao ${nome}, e da un po' che non ordini. Questa settimana abbiamo riservato un piccolo omaggio per te.`;
    }
    return `Ciao ${nome}, riordina la tua solita pizza dall'app entro 7 giorni e ricevi un extra omaggio.`;
  }

  function apriModalFineServizio() {
    setArchiveResetConfirmInput("");
    setShowFineServizioModal(true);
  }

  function chiudiModalFineServizio() {
    setShowFineServizioModal(false);
    setArchiveResetConfirmInput("");
  }

  function eseguiArchiviazioneGiornataDopoConferma() {
    if (archiveResetConfirmInput !== "RESET") return;
    const now = new Date().toISOString();
    const oggi = getTodayOrderDate();
    setOrdini((prev) =>
      prev.map((o) =>
        !o.archived && o.serviceDate === oggi ? { ...o, archived: true, archivedAt: now } : o
      )
    );
    setAdminArchiveNotice("Giornata archiviata correttamente. Kanban pronto per il nuovo servizio.");
    chiudiModalFineServizio();
  }

  function creaNuovaGiornataDemo() {
    const oggi = getTodayOrderDate();
    const now = new Date().toISOString();
    const slots = generaSlotOrari();
    const slotA = slots[Math.min(6, Math.max(0, slots.length - 1))] ?? ORARI_PIZZERIA.openingTime;
    const slotB = slots[Math.min(10, Math.max(0, slots.length - 1))] ?? ORARI_PIZZERIA.openingTime;
    const ts = Date.now();
    const nuovi: Ordine[] = [
      {
        id: `PF-${ts}-d1`,
        clienteId: "c2",
        clienteNome: "Luca P.",
        orderDate: oggi,
        createdAt: now,
        dataISO: now,
        tipoOrdine: "ritiro",
        orarioScelto: slotA,
        stato: "ricevuto",
        righe: [
          {
            id: crypto.randomUUID(),
            pizzaId: "margherita",
            nome: "Margherita",
            basePrezzo: 7.5,
            extra: [],
            note: "",
            quantita: 1,
          },
        ],
        costoConsegna: 0,
        totaleFinale: 7.5,
        paymentMethod: "cash_at_pickup",
        paymentStatus: "da pagare",
        needsPos: false,
        telefonoCliente: "333 1002002",
        source: "app",
        printed: false,
        archived: false,
        serviceDate: oggi,
      },
      {
        id: `PF-${ts}-d2`,
        clienteId: "c3",
        clienteNome: "Marta R.",
        orderDate: oggi,
        createdAt: now,
        dataISO: now,
        tipoOrdine: "consegna",
        orarioScelto: slotB,
        stato: "ricevuto",
        righe: [
          {
            id: crypto.randomUUID(),
            pizzaId: "diavola",
            nome: "Diavola",
            basePrezzo: 9.5,
            extra: [],
            note: "",
            quantita: 2,
          },
        ],
        costoConsegna: 2.5,
        totaleFinale: 21.5,
        paymentMethod: "cash_on_delivery",
        paymentStatus: "da pagare",
        needsPos: false,
        origineIndirizzo: "salvato",
        etichettaIndirizzo: "Casa",
        indirizzo: "Via Roma 24, Milano",
        citofonoInterno: "Rossi, Int. 3B",
        telefonoCliente: "333 1002003",
        noteRider: "",
        source: "app",
        printed: false,
        archived: false,
        serviceDate: oggi,
      },
      {
        id: `PF-${ts}-d3`,
        clienteId: "c1",
        clienteNome: "Giulia B.",
        orderDate: oggi,
        createdAt: now,
        dataISO: now,
        tipoOrdine: "ritiro",
        orarioScelto: slotA,
        stato: "accettato",
        righe: [
          {
            id: crypto.randomUUID(),
            pizzaId: "bufalina",
            nome: "Bufalina",
            basePrezzo: 11,
            extra: [],
            note: "Demo nuova giornata",
            quantita: 1,
          },
        ],
        costoConsegna: 0,
        totaleFinale: 11,
        paymentMethod: "card_at_pickup",
        paymentStatus: "da pagare",
        needsPos: true,
        telefonoCliente: "333 1002001",
        source: "telefono",
        printed: false,
        archived: false,
        serviceDate: oggi,
      },
    ];
    setOrdini((prev) => [...nuovi, ...prev]);
    setAdminArchiveNotice("Nuovi ordini demo aggiunti per il Kanban.");
  }

  function applicaCapacitaDemo() {
    const deliveriesByRider = Math.max(
      0,
      slotCapacityDraft.ridersAvailable * slotCapacityDraft.deliveriesPerRiderPerSlot
    );
    const nuovaConfig = {
      ...slotCapacityDraft,
      maxDeliveryOrdersPerSlot: deliveriesByRider,
    };
    setSlotCapacityConfig(nuovaConfig);
    setSlotCapacityDraft(nuovaConfig);
  }

  function apriAnteprimaComanda(ordiniDaStampare: Ordine[]) {
    if (!ordiniDaStampare.length) return;
    setPrintPreviewOrders(ordiniDaStampare);
    setShowPrintPreview(true);
  }

  function stampaComandeAnteprima() {
    if (!printPreviewOrders.length) return;
    const printedAt = new Date().toISOString();
    const ids = new Set(printPreviewOrders.map((o) => o.id));
    setOrdini((prev) =>
      prev.map((ordine) =>
        ids.has(ordine.id)
          ? { ...ordine, printed: true, printedAt }
          : ordine
      )
    );
    window.print();
    setShowPrintPreview(false);
  }

  function resetManualOrderForm() {
    setManualCustomerName("");
    setManualCustomerPhone("");
    setManualCustomerEmail("");
    setManualTipoOrdine("ritiro");
    setManualAddress("");
    setManualCitofono("");
    setManualDeliveryNotes("");
    setManualOrarioScelto(generaSlotOrari()[0] ?? ORARI_PIZZERIA.openingTime);
    setManualPaymentMethod("cash_at_pickup");
    setManualRows([]);
    setManualSelectedPizzaId(MENU_PIZZE[0]?.id ?? "");
    setManualExtraSelezionati([]);
    setManualPizzaQty(1);
    setManualPizzaNote("");
    setManualForceInsert(false);
  }

  function creaOrdineTelefonico() {
    if (!manualCustomerName.trim() || !manualPhoneNormalized || manualRows.length === 0) return;
    if (
      !manualSelectedSlotInfo?.selezionabile &&
      !(manualTipoOrdine === "consegna" && manualForceInsert)
    ) {
      return;
    }
    if (
      manualTipoOrdine === "consegna" &&
      (!manualAddress.trim() || !manualCitofono.trim())
    ) {
      return;
    }
    const paymentDetails = resolvePaymentForMethod(manualPaymentMethod);
    const now = new Date();
    const existingCustomer = matchedManualCustomer;
    const customerId = existingCustomer?.id ?? `c-${crypto.randomUUID().slice(0, 8)}`;
    const nuovoOrdine: Ordine = {
      id: `PF-${2000 + ordini.length + 1}`,
      clienteId: customerId,
      clienteNome: manualCustomerName.trim(),
      orderDate: getTodayOrderDate(),
      createdAt: now.toISOString(),
      dataISO: now.toISOString(),
      tipoOrdine: manualTipoOrdine,
      orarioScelto: manualOrarioScelto,
      stato: "ricevuto",
      righe: manualRows,
      costoConsegna: manualDeliveryCost,
      totaleFinale: manualTotal,
      paymentMethod: paymentDetails.paymentMethod,
      paymentStatus: paymentDetails.paymentStatus,
      needsPos: paymentDetails.needsPos,
      indirizzo: manualTipoOrdine === "consegna" ? manualAddress.trim() : undefined,
      citofonoInterno: manualTipoOrdine === "consegna" ? manualCitofono.trim() : undefined,
      noteRider: manualTipoOrdine === "consegna" ? manualDeliveryNotes.trim() : undefined,
      telefonoCliente: manualCustomerPhone.trim(),
      source: "telefono",
      printed: false,
      archived: false,
      serviceDate: getTodayOrderDate(),
    };
    setOrdini((prev) => [nuovoOrdine, ...prev]);
    setClienti((prev) => {
      if (existingCustomer) {
        return prev.map((c) =>
          c.id === existingCustomer.id
            ? { ...c, nome: manualCustomerName.trim(), email: manualCustomerEmail.trim() || c.email, ordiniTotali: c.ordiniTotali + 1, ultimoOrdineGiorniFa: 0 }
            : c
        );
      }
      return [
        {
          id: customerId,
          nome: manualCustomerName.trim(),
          telefono: manualCustomerPhone.trim(),
          email: manualCustomerEmail.trim() || undefined,
          ordiniTotali: 1,
          ultimoOrdineGiorniFa: 0,
          preferenzaWeekend: false,
          hasApp: false,
          source: "telefono",
        },
        ...prev,
      ];
    });
    const message = buildWhatsappOrderMessage(nuovoOrdine);
    setManualWhatsappMessage(message);
    setManualWhatsappPhone(manualCustomerPhone.trim());
    setManualCopied("");
    setManualOrderNotice("Ordine telefonico creato: visibile in dashboard, kanban e capacità slot.");
    resetManualOrderForm();
  }

  useEffect(() => {
    if (!menuAddToast) return;
    const timeout = window.setTimeout(() => setMenuAddToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [menuAddToast]);

  useEffect(() => {
    if (!adminArchiveNotice) return;
    const timeout = window.setTimeout(() => setAdminArchiveNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [adminArchiveNotice]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (skipTipoOrdinePaymentReset.current) {
        skipTipoOrdinePaymentReset.current = false;
        return;
      }
      setPaymentMethod(tipoOrdine === "ritiro" ? "cash_at_pickup" : "cash_on_delivery");
      setOnlinePaymentSimulated(false);
      setSimulatedPaidAt(undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [tipoOrdine]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setOnlinePaymentSimulated(false);
      setSimulatedPaidAt(undefined);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [paymentMethod]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!orarioScelto) return;
      const selected = slotCapacity.find((slot) => slot.slot === orarioScelto);
      if (!selected) return;
      if (!selected.selezionabile) {
        setOrarioScelto("");
        setSlotAvailabilityNotice(
          selected.exceedsDeliveryOrderPizzaLimit
            ? "Ordine troppo grande per una singola consegna. Contatta la pizzeria."
            : "Lo slot scelto non è più disponibile per il numero di pizze nel carrello."
        );
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [orarioScelto, slotCapacity]);

  return (
    <div className="min-h-screen bg-[#f6ebe2] p-3 text-[#3a1f12]">
      <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-[#e8cdb7] bg-[#fff8f2] shadow-[0_20px_60px_rgba(108,60,35,0.15)]">
        <header className="sticky top-0 z-10 border-b border-[#f0d7c7] bg-[#fff8f2]/95 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a15e3b]">PizzaFlow</p>
          <h1 className="text-xl font-bold">La tua pizza in 2 click</h1>
          <div className="mt-3 grid grid-cols-2 rounded-2xl bg-[#f4dfd0] p-1">
            <button className={`rounded-xl py-2 text-sm font-semibold ${view === "cliente" ? "bg-white text-[#8f3b18]" : ""}`} onClick={() => setView("cliente")}>Cliente</button>
            <button className={`rounded-xl py-2 text-sm font-semibold ${view === "admin" ? "bg-white text-[#8f3b18]" : ""}`} onClick={() => setView("admin")}>Admin</button>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 pb-28">
          {view === "cliente" && (
            <>
              {tabCliente === "home" && (
                <div className="space-y-4">
                  <div className="rounded-3xl bg-gradient-to-br from-[#ad3f18] to-[#de7b34] p-5 text-white">
                    <p className="text-sm opacity-90">Asporto premium</p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight">Ordina ora, ritira senza attese.</h2>
                  </div>
                  <button onClick={() => setTabCliente("menu")} className="w-full rounded-2xl bg-[#8f3b18] px-4 py-4 text-lg font-semibold text-white">Vai al menu</button>
                  <button onClick={riordinaSolita} className="w-full rounded-2xl border border-[#d59e7d] bg-white px-4 py-4 text-lg font-semibold text-[#8f3b18]">Riordina la solita</button>
                  {reorderNotice && (
                    <p className="rounded-xl bg-[#f4dfd0] p-3 text-sm text-[#6d4331]">{reorderNotice}</p>
                  )}
                </div>
              )}

              {tabCliente === "menu" && (
                <div className="space-y-3">
                  {numeroProdottiCarrello > 0 && (
                    <button
                      onClick={() => setTabCliente("carrello")}
                      className="sticky top-0 z-10 w-full rounded-2xl bg-[#8f3b18] px-4 py-3 text-sm font-semibold text-white shadow-sm"
                    >
                      Vai al carrello ({numeroProdottiCarrello})
                    </button>
                  )}
                  {MENU_PIZZE.map((pizza) => (
                    <button key={pizza.id} onClick={() => setPizzaSelezionata(pizza)} className="w-full rounded-2xl border border-[#f0d7c7] bg-white p-4 text-left shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{pizza.nome}</h3>
                          <p className="text-sm text-[#82513a]">{pizza.descrizione}</p>
                          <p className="mt-2 text-xs text-[#9a715c]">{pizza.ingredienti.join(", ")}</p>
                        </div>
                        <p className="font-semibold">{formatEuro(pizza.prezzo)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {tabCliente === "carrello" && (
                <div className="space-y-4">
                  {!carrello.length && <p className="rounded-2xl bg-white p-4 text-sm text-[#82513a]">Carrello vuoto. Aggiungi una pizza dal menu.</p>}
                  {carrello.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">
                          {item.quantita}x {item.nome}
                        </h3>
                        <p className="font-semibold">
                          {formatEuro((item.basePrezzo + getTotaleExtra(item.extra)) * item.quantita)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#82513a]">
                        Prezzo unitario: {formatEuro(item.basePrezzo + getTotaleExtra(item.extra))}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#6d4331]">
                        Totale: {formatEuro((item.basePrezzo + getTotaleExtra(item.extra)) * item.quantita)}
                      </p>
                      {item.extra.length > 0 && <p className="mt-2 text-xs text-[#82513a]">Extra: {item.extra.join(", ")}</p>}
                      {item.note && <p className="mt-1 text-xs text-[#82513a]">Note: {item.note}</p>}
                    </article>
                  ))}
                  <div className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <p className="text-sm font-semibold">Come vuoi ricevere l&apos;ordine?</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTipoOrdine("ritiro")}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold ${tipoOrdine === "ritiro" ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#e8cdb7]"}`}
                      >
                        Ritiro in pizzeria
                      </button>
                      <button
                        onClick={() => setTipoOrdine("consegna")}
                        className={`rounded-xl border px-3 py-3 text-sm font-semibold ${tipoOrdine === "consegna" ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#e8cdb7]"}`}
                      >
                        Consegna a domicilio
                      </button>
                    </div>
                  </div>

                  {tipoOrdine === "consegna" && (
                    <div className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                      <p className="text-sm font-semibold">Indirizzo di consegna</p>
                      <div className="mt-3 space-y-2">
                        {profiloCliente.indirizziSalvati.map((addr) => (
                          <button
                            key={addr.id}
                            onClick={() => {
                              setSelectedSavedAddressId(addr.id);
                              setIsAddingNewAddress(false);
                            }}
                            className={`w-full rounded-xl border p-3 text-left ${
                              !isAddingNewAddress && selectedSavedAddressId === addr.id
                                ? "border-[#8f3b18] bg-[#f4dfd0]"
                                : "border-[#ecc8b1]"
                            }`}
                          >
                            <p className="text-sm font-semibold">{addr.etichetta}</p>
                            <p className="text-xs text-[#6d4331]">{addr.viaNumero}, {addr.citta}</p>
                            <p className="text-xs text-[#6d4331]">{addr.citofonoInterno}</p>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setIsAddingNewAddress((prev) => !prev)}
                        className="mt-3 w-full rounded-xl border border-[#d59e7d] py-2 text-sm font-semibold text-[#8f3b18]"
                      >
                        Aggiungi nuovo indirizzo
                      </button>
                      {isAddingNewAddress && (
                        <div className="mt-3 space-y-2 rounded-xl bg-[#fff7f0] p-3">
                          <input
                            value={nuovoIndirizzo.etichetta}
                            onChange={(e) => setNuovoIndirizzo((prev) => ({ ...prev, etichetta: e.target.value }))}
                            className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                            placeholder="Etichetta (es. Casa, Ufficio)"
                          />
                          <input
                            value={nuovoIndirizzo.viaNumero}
                            onChange={(e) => setNuovoIndirizzo((prev) => ({ ...prev, viaNumero: e.target.value }))}
                            className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                            placeholder="Via e numero"
                          />
                          <input
                            value={nuovoIndirizzo.citta}
                            onChange={(e) => setNuovoIndirizzo((prev) => ({ ...prev, citta: e.target.value }))}
                            className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                            placeholder="Città"
                          />
                          <input
                            value={nuovoIndirizzo.citofonoInterno}
                            onChange={(e) => setNuovoIndirizzo((prev) => ({ ...prev, citofonoInterno: e.target.value }))}
                            className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                            placeholder="Citofono / interno"
                          />
                          <textarea
                            value={nuovoIndirizzo.noteConsegna}
                            onChange={(e) => setNuovoIndirizzo((prev) => ({ ...prev, noteConsegna: e.target.value }))}
                            className="h-20 w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                            placeholder="Note consegna"
                          />
                        </div>
                      )}
                      {!isAddingNewAddress && !selectedSavedAddressId && (
                        <p className="mt-3 rounded-xl bg-amber-100 p-3 text-xs font-semibold text-amber-900">
                          Seleziona un indirizzo di consegna per continuare.
                        </p>
                      )}
                      <div className="mt-3 rounded-xl bg-[#fff7f0] p-3 text-sm text-[#6d4331]">
                        <p className="font-semibold">
                          {isAddingNewAddress
                            ? "Nuovo indirizzo (demo)"
                            : selectedSavedAddressId
                              ? `Indirizzo selezionato: ${indirizzoCheckout?.etichetta}`
                              : "Nessun indirizzo selezionato"}
                        </p>
                        <p>{indirizzoCheckout?.viaNumero}, {indirizzoCheckout?.citta}</p>
                        <p>{indirizzoCheckout?.citofonoInterno}</p>
                        <p>Note: {indirizzoCheckout?.noteConsegna || "-"}</p>
                        <p>Telefono cliente: {profiloCliente.telefono}</p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <p className="text-sm font-semibold">
                      Orario {tipoOrdine === "ritiro" ? "ritiro" : "consegna"}
                    </p>
                    <div className="mt-3 space-y-2">
                      {slotCapacity.map((slot) => (
                        <button
                          key={slot.slot}
                          onClick={() => {
                            if (!slot.selezionabile) return;
                            setOrarioScelto(slot.slot);
                            setSlotAvailabilityNotice("");
                          }}
                          disabled={!slot.selezionabile}
                          className={`w-full rounded-xl border p-3 text-left ${
                            orarioScelto === slot.slot
                              ? "border-[#8f3b18] bg-[#f4dfd0]"
                              : "border-[#ecc8b1] bg-white"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">{slot.slot}</p>
                            <p className="text-xs font-semibold">
                              {slot.full
                                ? slot.kitchenOverloaded || slot.pickupOverloaded || slot.deliveryOverloaded
                                  ? "Non disponibile"
                                  : "Pieno"
                                : slot.nonDisponibilePerOrdine
                                  ? "Non disponibile per questo ordine"
                                  : slot.stato === "quasi pieno"
                                    ? "Quasi pieno"
                                    : "Disponibile"}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-[#6d4331]">
                            {tipoOrdine === "ritiro"
                              ? `Posti residui ritiro: ${Math.max(slot.pickupResidualPizzas, 0)} pizze`
                              : `Consegne residue: ${Math.max(slot.deliveryResidualOrders, 0)}`}
                          </p>
                          {tipoOrdine === "consegna" && (
                            <>
                              <p className="mt-1 text-xs text-[#6d4331]">
                                Cucina residua: {Math.max(slot.totalResidualPizzas, 0)} pizze
                              </p>
                              <p className="mt-1 text-xs text-[#6d4331]">
                                Max per consegna: {slotCapacityConfig.maxPizzasPerDeliveryOrder} pizze
                              </p>
                            </>
                          )}
                          {tipoOrdine === "consegna" && (slot.full || slot.riderLimited || slot.exceedsDeliveryOrderPizzaLimit) && (
                            <p className="mt-1 text-xs font-semibold text-amber-800">
                              {slot.exceedsDeliveryOrderPizzaLimit
                                ? "Ordine troppo grande per una singola consegna. Contatta la pizzeria."
                                : slot.deliveryResidualOrders < 1 && !slot.kitchenFull
                                  ? "Consegne piene, ritiro ancora disponibile."
                                  : slot.full
                                    ? "Non disponibile"
                                    : "RIDER LIMITATO"}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                    {slotAvailabilityNotice && (
                      <p className="mt-3 rounded-xl bg-amber-100 p-3 text-xs font-semibold text-amber-900">
                        {slotAvailabilityNotice}
                      </p>
                    )}
                  </div>
                  {canShowPaymentSection && (
                    <div className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                      <p className="text-sm font-semibold">Come vuoi pagare?</p>
                      <div className="mt-3 space-y-2">
                        {paymentOptions.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setPaymentMethod(option.id)}
                            className={`w-full rounded-xl border p-3 text-left text-sm font-semibold ${
                              paymentMethod === option.id ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#ecc8b1]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {isOnlinePaymentMethod(paymentMethod) && (
                        <div className="mt-3 space-y-2">
                          <button
                            onClick={simulaPagamentoOnline}
                            disabled={onlinePaymentSimulated}
                            className="w-full rounded-xl bg-[#8f3b18] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Simula pagamento riuscito
                          </button>
                          {onlinePaymentSimulated && simulatedPaidAt && (
                            <p className="text-xs text-[#6d4331]">
                              Pagamento registrato alle {formatItalianTime(simulatedPaidAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="rounded-2xl bg-[#f4dfd0] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <p>Subtotale prodotti</p>
                      <p>{formatEuro(totaleCarrello)}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <p>Costo consegna</p>
                      <p>{costoConsegna === 0 ? "Gratis" : formatEuro(costoConsegna)}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-[#d8b9a4] pt-2">
                      <p className="text-sm font-semibold">Totale finale</p>
                      <p className="text-2xl font-bold">{formatEuro(totaleFinale)}</p>
                    </div>
                    <div className="mt-3 rounded-xl bg-white p-3 text-xs text-[#6d4331]">
                      <p>Tipo ordine: {tipoOrdine === "ritiro" ? "Ritiro in pizzeria" : "Consegna a domicilio"}</p>
                      {tipoOrdine === "consegna" && (
                        <>
                          <p>Indirizzo: {indirizzoCheckout?.viaNumero}, {indirizzoCheckout?.citta}</p>
                          <p>Citofono/interno: {indirizzoCheckout?.citofonoInterno}</p>
                          <p>Note consegna: {indirizzoCheckout?.noteConsegna || "-"}</p>
                        </>
                      )}
                      <p>Orario scelto: {orarioScelto}</p>
                      <p>Metodo pagamento: {getPaymentMethodLabel(checkoutPayment.paymentMethod)}</p>
                      <p>Stato pagamento: {getPaymentStatusLabel(checkoutPayment.paymentStatus)}</p>
                      {checkoutPayment.paymentStatus === "pagato" && isOnlinePaymentMethod(checkoutPayment.paymentMethod) && (
                        <p>Pagamento online simulato</p>
                      )}
                      {checkoutPayment.paymentMethod === "card_at_pickup" && (
                        <p>Pagherai al ritiro con carta/bancomat. POS disponibile in pizzeria.</p>
                      )}
                      {checkoutPayment.paymentMethod === "card_on_delivery" && (
                        <p className="font-semibold text-[#8f3b18]">Il rider dovrà portare il POS.</p>
                      )}
                      {(checkoutPayment.paymentMethod === "cash_on_delivery" ||
                        checkoutPayment.paymentMethod === "cash_at_pickup") && (
                        <p>
                          {checkoutPayment.paymentMethod === "cash_on_delivery"
                            ? "Pagamento in contanti alla consegna"
                            : "Pagamento in contanti al ritiro"}
                        </p>
                      )}
                      {checkoutPayment.paidAt && (
                        <p>Pagato alle {formatItalianTime(checkoutPayment.paidAt)}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={confermaOrdine}
                    disabled={consegnaInvalida || onlinePaymentPending || !canShowPaymentSection}
                    className="w-full rounded-2xl bg-[#8f3b18] py-4 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Conferma ordine
                  </button>
                  <button
                    onClick={() => setShowSavePreferredForm((prev) => !prev)}
                    className="w-full rounded-2xl border border-[#d59e7d] bg-white py-3 text-sm font-semibold text-[#8f3b18]"
                  >
                    Salva come ordine preferito
                  </button>
                  {showSavePreferredForm && (
                    <div className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                      <input
                        value={preferredOrderName}
                        onChange={(e) => setPreferredOrderName(e.target.value)}
                        className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                        placeholder="Nome ordine preferito"
                      />
                      <button
                        onClick={salvaOrdinePreferitoDemo}
                        className="mt-3 w-full rounded-xl bg-[#8f3b18] py-3 text-sm font-semibold text-white"
                      >
                        Salva demo
                      </button>
                    </div>
                  )}
                  {preferredOrderDemoNotice && (
                    <p className="rounded-xl bg-[#f4dfd0] p-3 text-sm text-[#6d4331]">
                      {preferredOrderDemoNotice}
                    </p>
                  )}
                </div>
              )}

              {tabCliente === "storico" && (
                <div className="space-y-3">
                  {ordiniPerStoricoCliente.map((ordine) => (
                    <article key={ordine.id} className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{ordine.id}</h3>
                        <span className="rounded-full bg-[#f4dfd0] px-3 py-1 text-xs font-semibold">{ordine.stato}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-[#82513a]">
                        <p>Ordine del {formatItalianDate(ordine.orderDate)}</p>
                        <p>Inserito alle {formatItalianTime(ordine.createdAt)}</p>
                        <p>Tipo ordine: {ordine.tipoOrdine === "ritiro" ? "Ritiro in pizzeria" : "Consegna a domicilio"}</p>
                        <p>Orario: {ordine.orarioScelto}</p>
                        <p>Stato: {ordine.stato}</p>
                        <div className="mt-2 rounded-xl bg-[#fff7f0] p-2 text-xs text-[#6d4331]">
                          <p className="font-semibold">Pagamento</p>
                          <p>Metodo: {getPaymentMethodLabel(ordine.paymentMethod)}</p>
                          <p>Stato: {getPaymentStatusLabel(ordine.paymentStatus)}</p>
                          {ordine.needsPos && <p>POS richiesto</p>}
                          {ordine.paymentMethod === "cash_on_delivery" && <p>Contanti alla consegna</p>}
                          {ordine.paidAt && <p>Pagato alle {formatItalianTime(ordine.paidAt)}</p>}
                        </div>
                        <div className="mt-2 space-y-2 rounded-xl bg-[#fff7f0] p-2">
                          {ordine.righe.map((riga) => {
                            const prezzoUnitario = riga.basePrezzo + getTotaleExtra(riga.extra);
                            const totaleRiga = prezzoUnitario * riga.quantita;
                            return (
                              <div key={riga.id} className="rounded-lg bg-white p-2">
                                <p className="text-xs font-semibold text-[#6d4331]">
                                  {riga.quantita}x {riga.nome}
                                </p>
                                <p className="text-xs text-[#82513a]">
                                  Prezzo unitario: {formatEuro(prezzoUnitario)}
                                </p>
                                <p className="text-xs font-semibold text-[#6d4331]">
                                  Totale: {formatEuro(totaleRiga)}
                                </p>
                                {riga.extra.length > 0 && (
                                  <p className="text-xs text-[#82513a]">Extra: {riga.extra.join(", ")}</p>
                                )}
                                {riga.note && <p className="text-xs text-[#82513a]">Note: {riga.note}</p>}
                              </div>
                            );
                          })}
                        </div>
                        {ordine.tipoOrdine === "consegna" && ordine.indirizzo && (
                          <>
                            <p>
                              Indirizzo: {ordine.indirizzo}
                              {ordine.origineIndirizzo === "nuovo" ? " (nuovo indirizzo)" : ""}
                            </p>
                            <p>Citofono/interno: {ordine.citofonoInterno}</p>
                            <p>Note consegna: {ordine.noteRider || "-"}</p>
                            <p>Telefono cliente: {ordine.telefonoCliente}</p>
                          </>
                        )}
                        <p>Costo consegna: {ordine.costoConsegna === 0 ? "Gratis" : formatEuro(ordine.costoConsegna)}</p>
                        <p className="font-semibold">Totale finale: {formatEuro(ordine.totaleFinale)}</p>
                        <div className="mt-2">
                          <div className="h-2 w-full rounded-full bg-[#f2ddd1]">
                            <div
                              className="h-2 rounded-full bg-[#ad3f18]"
                              style={{ width: `${getProgressPercent(ordine.tipoOrdine, ordine.stato)}%` }}
                            />
                          </div>
                          <div className="mt-2 flex items-start justify-between gap-1">
                            {getPipelineByTipo(ordine.tipoOrdine).map((step) => (
                              <span
                                key={`${ordine.id}-${step}`}
                                className={`max-w-20 text-center text-[10px] leading-tight ${
                                  step === ordine.stato
                                    ? "font-bold text-[#8f3b18]"
                                    : "text-[#9a715c]"
                                }`}
                              >
                                {step}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                  <button onClick={riordinaSolita} className="w-full rounded-2xl border border-[#d59e7d] bg-white py-4 text-base font-semibold text-[#8f3b18]">Riordina la solita</button>
                  {reorderNotice && (
                    <p className="rounded-xl bg-[#f4dfd0] p-3 text-sm text-[#6d4331]">{reorderNotice}</p>
                  )}
                </div>
              )}

              {tabCliente === "profilo" && (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h3 className="font-semibold">Profilo</h3>
                    <div className="mt-2 space-y-1 text-sm text-[#6d4331]">
                      <p>{profiloCliente.nome}</p>
                      <p>{profiloCliente.telefono}</p>
                      <p>{profiloCliente.email}</p>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h3 className="font-semibold">Indirizzi salvati</h3>
                    <div className="mt-3 space-y-2">
                      {profiloCliente.indirizziSalvati.map((addr) => (
                        <article key={addr.id} className="rounded-xl border border-[#ecd7c8] bg-[#fffaf6] p-3">
                          <p className="text-sm font-semibold">{addr.etichetta}</p>
                          <p className="mt-1 text-xs text-[#6d4331]">{addr.viaNumero}, {addr.citta}</p>
                          <p className="text-xs text-[#6d4331]">Citofono/interno: {addr.citofonoInterno}</p>
                          <p className="text-xs text-[#6d4331]">Note consegna: {addr.noteConsegna || "-"}</p>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button className="rounded-lg border border-[#d9b7a3] py-2 text-xs font-semibold text-[#8f3b18]">
                              Modifica
                            </button>
                            <button className="rounded-lg border border-[#e6cfc2] py-2 text-xs font-semibold text-[#9a715c]">
                              Elimina
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowProfileAddressForm((prev) => !prev)}
                      className="mt-3 w-full rounded-xl border border-[#d59e7d] py-3 text-sm font-semibold text-[#8f3b18]"
                    >
                      Aggiungi nuovo indirizzo
                    </button>
                    {showProfileAddressForm && (
                      <div className="mt-3 space-y-2 rounded-xl bg-[#fff7f0] p-3">
                        <input
                          value={profileAddressDraft.etichetta}
                          onChange={(e) =>
                            setProfileAddressDraft((prev) => ({ ...prev, etichetta: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                          placeholder="Etichetta"
                        />
                        <input
                          value={profileAddressDraft.viaNumero}
                          onChange={(e) =>
                            setProfileAddressDraft((prev) => ({ ...prev, viaNumero: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                          placeholder="Via e numero"
                        />
                        <input
                          value={profileAddressDraft.citta}
                          onChange={(e) =>
                            setProfileAddressDraft((prev) => ({ ...prev, citta: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                          placeholder="Città"
                        />
                        <input
                          value={profileAddressDraft.citofonoInterno}
                          onChange={(e) =>
                            setProfileAddressDraft((prev) => ({
                              ...prev,
                              citofonoInterno: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                          placeholder="Citofono/interno"
                        />
                        <textarea
                          value={profileAddressDraft.noteConsegna}
                          onChange={(e) =>
                            setProfileAddressDraft((prev) => ({ ...prev, noteConsegna: e.target.value }))
                          }
                          className="h-20 w-full rounded-xl border border-[#ecc8b1] p-3 text-sm"
                          placeholder="Note consegna"
                        />
                        <button
                          onClick={salvaNuovoIndirizzoDemo}
                          className="w-full rounded-xl bg-[#8f3b18] py-3 text-sm font-semibold text-white"
                        >
                          Salva indirizzo demo
                        </button>
                      </div>
                    )}
                    {profileDemoSavedNotice && (
                      <p className="mt-3 rounded-xl bg-[#f4dfd0] p-3 text-xs text-[#6d4331]">
                        {profileDemoSavedNotice}
                      </p>
                    )}
                  </section>

                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h3 className="font-semibold">Le mie solite pizze</h3>
                    <div className="mt-3 space-y-3">
                      {profiloCliente.savedOrders.map((saved) => (
                        <article key={saved.id} className="rounded-xl border border-[#ecd7c8] bg-[#fffaf6] p-3">
                          <p className="text-sm font-semibold">{saved.nomeOrdine}</p>
                          <div className="mt-1 space-y-1 text-xs text-[#6d4331]">
                            {saved.prodotti.map((p, index) => (
                              <p key={`${saved.id}-${p.pizzaId}-${index}`}>
                                - {p.quantita} {p.nome}
                                {p.extra.length ? ` + ${p.extra.join(", ")}` : ""}
                                {p.ingredientiRimossi.length ? `, senza ${p.ingredientiRimossi.join(", ")}` : ""}
                                {p.note ? ` (${p.note})` : ""}
                              </p>
                            ))}
                          </div>
                          <p className="mt-2 text-xs text-[#6d4331]">
                            Tipo preferito: {saved.tipoPreferito === "ritiro" ? "Ritiro" : "Consegna"}
                          </p>
                          {saved.tipoPreferito === "consegna" && (
                            <p className="text-xs text-[#6d4331]">
                              Indirizzo preferito:{" "}
                              {profiloCliente.indirizziSalvati.find((a) => a.id === saved.indirizzoPreferitoId)?.etichetta ?? "-"}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-[#6d4331]">Totale stimato: {formatEuro(saved.totaleStimato)}</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <button
                              onClick={() => caricaSavedOrder(saved)}
                              className="rounded-lg bg-[#8f3b18] py-2 text-xs font-semibold text-white"
                            >
                              Riordina
                            </button>
                            <button className="rounded-lg border border-[#d9b7a3] py-2 text-xs font-semibold text-[#8f3b18]">
                              Modifica
                            </button>
                            <button className="rounded-lg border border-[#e6cfc2] py-2 text-xs font-semibold text-[#9a715c]">
                              Elimina
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowCreatePreferredInfo((prev) => !prev)}
                      className="mt-3 w-full rounded-xl border border-[#d59e7d] py-3 text-sm font-semibold text-[#8f3b18]"
                    >
                      Crea nuovo ordine preferito
                    </button>
                    {showCreatePreferredInfo && (
                      <p className="mt-3 rounded-xl bg-[#f4dfd0] p-3 text-xs text-[#6d4331]">
                        Nella versione reale potrai salvare il carrello attuale come ordine preferito.
                      </p>
                    )}
                    {reorderNotice && (
                      <p className="mt-3 rounded-xl bg-[#f4dfd0] p-3 text-sm text-[#6d4331]">{reorderNotice}</p>
                    )}
                  </section>

                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h3 className="font-semibold">Vantaggi app</h3>
                    <ul className="mt-2 space-y-1 text-sm text-[#6d4331]">
                      <li>Riordini la solita pizza in 2 click</li>
                      <li>Non reinserisci l&apos;indirizzo ogni volta</li>
                      <li>Ricevi promo personalizzate</li>
                      <li>Segui lo stato del tuo ordine</li>
                    </ul>
                  </section>
                </div>
              )}
            </>
          )}

          {view === "admin" && (
            <div className="space-y-5">
              <div className="overflow-x-auto rounded-2xl border border-[#f0d7c7] bg-white p-1">
                <div className="flex min-w-max gap-2">
                  <button onClick={() => setAdminTab("dashboard")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "dashboard" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Dashboard</button>
                  <button onClick={() => setAdminTab("ordini")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "ordini" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Ordini</button>
                  <button onClick={() => setAdminTab("kanban")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "kanban" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Kanban</button>
                  <button onClick={() => setAdminTab("capacita")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "capacita" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Capacità</button>
                  <button onClick={() => setAdminTab("ordine-telefonico")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "ordine-telefonico" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Ordine telefonico</button>
                  <button onClick={() => setAdminTab("crm")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "crm" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>CRM</button>
                  <button onClick={() => setAdminTab("rfm")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "rfm" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>RFM</button>
                  <button onClick={() => setAdminTab("prodotti")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "prodotti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Prodotti</button>
                  <button onClick={() => setAdminTab("marketing")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "marketing" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Marketing</button>
                  <button onClick={() => setAdminTab("archivio")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${adminTab === "archivio" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Archivio</button>
                </div>
              </div>

              {adminTab === "ordini" && (
                <section className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard titolo="Ordini operativi oggi" valore={String(ordiniOperativiOggi.length)} />
                    <MetricCard titolo="Comande da stampare" valore={String(comandeDaStampare)} />
                  </div>
                  <button
                    onClick={() => apriAnteprimaComanda(ordiniOperativiOggi.filter((o) => !o.printed))}
                    disabled={comandeDaStampare === 0}
                    className="w-full rounded-xl bg-[#8f3b18] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Stampa comande non ancora stampate
                  </button>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#f0d7c7] bg-white p-1">
                    <button onClick={() => setAdminFiltro("tutti")} className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Tutti</button>
                    <button onClick={() => setAdminFiltro("ritiro")} className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "ritiro" ? "bg-amber-100 text-amber-800" : "text-[#82513a]"}`}>Solo ritiro</button>
                    <button onClick={() => setAdminFiltro("consegna")} className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "consegna" ? "bg-sky-100 text-sky-800" : "text-[#82513a]"}`}>Solo consegna</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#f0d7c7] bg-white p-1">
                    <button onClick={() => setAdminPrintFilter("tutti")} className={`rounded-xl py-2 text-xs font-semibold ${adminPrintFilter === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Tutti</button>
                    <button onClick={() => setAdminPrintFilter("da-stampare")} className={`rounded-xl py-2 text-xs font-semibold ${adminPrintFilter === "da-stampare" ? "bg-amber-100 text-amber-800" : "text-[#82513a]"}`}>Da stampare</button>
                    <button onClick={() => setAdminPrintFilter("stampati")} className={`rounded-xl py-2 text-xs font-semibold ${adminPrintFilter === "stampati" ? "bg-emerald-100 text-emerald-800" : "text-[#82513a]"}`}>Stampati</button>
                  </div>
                  <div className="space-y-2">
                    {ordiniFiltratiStampa.map((ordine) => (
                      <article key={`list-${ordine.id}`} className="rounded-2xl border border-[#ecd7c8] bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{ordine.id} - {ordine.clienteNome}</p>
                          <p className="text-xs font-semibold">{formatEuro(ordine.totaleFinale)}</p>
                        </div>
                        <p className="mt-1 text-xs text-[#6d4331]">
                          {ordine.orarioScelto} - {ordine.tipoOrdine === "ritiro" ? "RITIRO" : "CONSEGNA"} - Stato: {ordine.stato}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ordine.printed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                            {ordine.printed ? "STAMPATA" : "DA STAMPARE"}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ordine.source === "telefono" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {ordine.source === "telefono" ? "TELEFONICO" : "APP"}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button onClick={() => avanzaStatoOrdine(ordine.id)} disabled={ordine.stato === (ordine.tipoOrdine === "ritiro" ? "ritirato" : "consegnato")} className="rounded-lg bg-[#8f3b18] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Avanza stato</button>
                          <button onClick={() => apriAnteprimaComanda([ordine])} className="rounded-lg border border-[#8f3b18] bg-white px-3 py-2 text-xs font-semibold text-[#8f3b18]">Stampa comanda</button>
                        </div>
                      </article>
                    ))}
                    {ordiniFiltratiStampa.length === 0 && (
                      <p className="rounded-xl bg-[#fff7f0] p-3 text-xs text-[#82513a]">Nessun ordine per i filtri selezionati.</p>
                    )}
                  </div>
                </section>
              )}

              {adminTab === "kanban" && (
                <section className="space-y-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#9a715c]">Kanban operativo ordini</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <MetricCard titolo="Comande da stampare" valore={String(comandeDaStampare)} />
                    <MetricCard titolo="Comande stampate oggi" valore={String(comandeStampate)} />
                  </div>
                  <button onClick={avanzaTuttiOrdiniAttivi} className="w-full rounded-xl border border-[#d59e7d] bg-white px-4 py-3 text-sm font-semibold text-[#8f3b18]">
                    Avanza tutti gli ordini attivi ({ordiniAttiviCount})
                  </button>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#f0d7c7] bg-white p-1">
                    <button onClick={() => setAdminFiltro("tutti")} className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Tutti</button>
                    <button onClick={() => setAdminFiltro("ritiro")} className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "ritiro" ? "bg-amber-100 text-amber-800" : "text-[#82513a]"}`}>Solo ritiro</button>
                    <button onClick={() => setAdminFiltro("consegna")} className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "consegna" ? "bg-sky-100 text-sky-800" : "text-[#82513a]"}`}>Solo consegna</button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#f0d7c7] bg-white p-1">
                    <button onClick={() => setAdminPrintFilter("tutti")} className={`rounded-xl py-2 text-xs font-semibold ${adminPrintFilter === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Tutti</button>
                    <button onClick={() => setAdminPrintFilter("da-stampare")} className={`rounded-xl py-2 text-xs font-semibold ${adminPrintFilter === "da-stampare" ? "bg-amber-100 text-amber-800" : "text-[#82513a]"}`}>Da stampare</button>
                    <button onClick={() => setAdminPrintFilter("stampati")} className={`rounded-xl py-2 text-xs font-semibold ${adminPrintFilter === "stampati" ? "bg-emerald-100 text-emerald-800" : "text-[#82513a]"}`}>Stampati</button>
                  </div>
                  {ordiniOperativiOggi.length === 0 ? (
                    <p className="rounded-2xl border border-[#ecd7c8] bg-[#fffaf6] p-6 text-center text-sm text-[#6d4331]">
                      Nessun ordine operativo. Il Kanban è pronto per il prossimo servizio.
                    </p>
                  ) : (
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {KANBAN_COLUMNS.map((column) => {
                        const ordiniColonna = ordiniFiltratiStampa.filter((ordine) => getKanbanColumn(ordine.stato) === column.key);
                        return (
                          <div key={column.key} className="w-[16.5rem] shrink-0 rounded-2xl border border-[#f0d7c7] bg-[#fff7f0] p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="text-sm font-bold text-[#8f3b18]">{column.titolo}</h3>
                              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#82513a]">{ordiniColonna.length}</span>
                            </div>
                            <div className="space-y-2">
                              {ordiniColonna.length === 0 && <p className="rounded-xl bg-white p-3 text-xs text-[#9a715c]">Nessun ordine</p>}
                              {ordiniColonna.map((ordine) => (
                                <article key={ordine.id} className="rounded-xl border border-[#ecd7c8] bg-white p-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold">{ordine.id}</p>
                                    <p className="text-xs font-semibold">{formatEuro(ordine.totaleFinale)}</p>
                                  </div>
                                  <p className="mt-1 text-xs text-[#82513a]">Cliente: {ordine.clienteNome}</p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ordine.tipoOrdine === "ritiro" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>{ordine.tipoOrdine === "ritiro" ? "RITIRO" : "CONSEGNA"}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ordine.source === "telefono" ? "bg-orange-100 text-orange-800" : "bg-emerald-100 text-emerald-800"}`}>{ordine.source === "telefono" ? "TELEFONICO" : "APP"}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ordine.printed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{ordine.printed ? "COMANDA STAMPATA" : "DA STAMPARE"}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ordine.paymentStatus === "pagato" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"}`}>{ordine.paymentStatus === "pagato" ? "PAGATO" : "DA INCASSARE"}</span>
                                  </div>
                                  <button onClick={() => avanzaStatoOrdine(ordine.id)} disabled={ordine.stato === (ordine.tipoOrdine === "ritiro" ? "ritirato" : "consegnato")} className="mt-2 w-full rounded-lg bg-[#8f3b18] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Avanza stato</button>
                                </article>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {adminTab === "capacita" && (
                <>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Impostazioni orari</h2>
                    <div className="mt-2 space-y-1 text-sm text-[#6d4331]">
                      <p>Apertura: {ORARI_PIZZERIA.openingTime}</p>
                      <p>Chiusura: {ORARI_PIZZERIA.closingTime}</p>
                      <p>Intervallo slot: {ORARI_PIZZERIA.slotIntervalMinutes} minuti</p>
                    </div>
                    <div className="mt-4 space-y-2 rounded-xl bg-[#fff7f0] p-3 text-xs">
                      <p className="font-semibold uppercase tracking-wide text-[#9a715c]">Capacita ritiro e consegna</p>
                      <label className="block">Pizze totali per slot<input type="number" min={1} value={slotCapacityDraft.maxTotalPizzasPerSlot} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, maxTotalPizzasPerSlot: Math.max(1, Number(e.target.value) || 1) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <label className="block">Pizze ritiro per slot<input type="number" min={1} value={slotCapacityDraft.maxPickupPizzasPerSlot} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, maxPickupPizzasPerSlot: Math.max(1, Number(e.target.value) || 1) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <label className="block">Ordini ritiro per slot<input type="number" min={1} value={slotCapacityDraft.maxPickupOrdersPerSlot} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, maxPickupOrdersPerSlot: Math.max(1, Number(e.target.value) || 1) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <label className="block">Rider disponibili<input type="number" min={0} value={slotCapacityDraft.ridersAvailable} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, ridersAvailable: Math.max(0, Number(e.target.value) || 0) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <label className="block">Consegne massime per rider per slot<input type="number" min={1} value={slotCapacityDraft.deliveriesPerRiderPerSlot} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, deliveriesPerRiderPerSlot: Math.max(1, Number(e.target.value) || 1) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <p>Consegne massime totali per slot (calcolate): <span className="font-semibold">{calcolataDeliveryCapacityDraft}</span></p>
                      <label className="block">Consegne massime totali per slot<input type="number" min={1} value={slotCapacityDraft.maxDeliveryOrdersPerSlot} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, maxDeliveryOrdersPerSlot: Math.max(1, Number(e.target.value) || 1) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <label className="block">Pizze massime per singola consegna<input type="number" min={1} value={slotCapacityDraft.maxPizzasPerDeliveryOrder} onChange={(e) => setSlotCapacityDraft((prev) => ({ ...prev, maxPizzasPerDeliveryOrder: Math.max(1, Number(e.target.value) || 1) }))} className="mt-1 w-full rounded-lg border border-[#ecc8b1] p-2" /></label>
                      <button onClick={applicaCapacitaDemo} className="w-full rounded-xl bg-[#8f3b18] py-2 font-semibold text-white">Applica capacita demo</button>
                    </div>
                  </section>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Capacità slot di oggi</h2>
                    <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#fff7f0] p-2 text-xs">
                      <p className="rounded-lg bg-white p-2 text-center">Disponibili: <span className="font-semibold">{slotSummary.disponibili}</span></p>
                      <p className="rounded-lg bg-white p-2 text-center">Quasi pieni: <span className="font-semibold">{slotSummary.quasiPieni}</span></p>
                      <p className="rounded-lg bg-white p-2 text-center">Pieni: <span className="font-semibold">{slotSummary.pieni}</span></p>
                    </div>
                    <div className="mt-2 rounded-xl bg-[#fff7f0] p-2 text-[11px] text-[#6d4331]">Stati: disponibile · quasi pieno · pieno · sovraccarico</div>
                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#f0d7c7] bg-[#fffaf6] p-1">
                      <button onClick={() => setSlotFiltro("tutti")} className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}>Tutti</button>
                      <button onClick={() => setSlotFiltro("ritiro-disponibili")} className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "ritiro-disponibili" ? "bg-emerald-100 text-emerald-800" : "text-[#82513a]"}`}>Ritiro disponibili</button>
                      <button onClick={() => setSlotFiltro("ritiro-pieni")} className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "ritiro-pieni" ? "bg-red-100 text-red-800" : "text-[#82513a]"}`}>Ritiro pieni</button>
                      <button onClick={() => setSlotFiltro("consegna-disponibili")} className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "consegna-disponibili" ? "bg-sky-100 text-sky-800" : "text-[#82513a]"}`}>Consegna disponibili</button>
                      <button onClick={() => setSlotFiltro("consegna-pieni")} className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "consegna-pieni" ? "bg-orange-100 text-orange-800" : "text-[#82513a]"}`}>Consegna pieni</button>
                      <button onClick={() => setSlotFiltro("cucina-piena")} className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "cucina-piena" ? "bg-stone-200 text-stone-900" : "text-[#82513a]"}`}>Cucina piena</button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {slotCapacityFiltered.map((slot) => (
                        <div key={`cap-${slot.slot}`} className={`rounded-xl border p-3 text-xs ${slot.kitchenOverloaded ? "border-red-700 bg-red-200 ring-2 ring-red-600" : slot.kitchenFull ? "border-stone-400 bg-stone-100" : slot.pickupOverloaded || slot.deliveryOverloaded ? "border-red-600 bg-red-100 ring-2 ring-red-500" : slot.pickupStatus === "pieno" || slot.deliveryStatus === "pieno" ? "border-red-300 bg-red-50" : slot.pickupStatus === "quasi pieno" || slot.deliveryStatus === "quasi pieno" ? "border-amber-300 bg-amber-50" : "border-[#ecd7c8] bg-[#fffaf6]"}`}>
                          <div className="flex items-center justify-between pb-2"><p className="font-semibold">Orario {slot.slot}</p></div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-white p-2"><p className="font-bold text-amber-800">RITIRO</p><p>Ordini: {slot.pickupOrders} / {slotCapacityConfig.maxPickupOrdersPerSlot}</p><p>Pizze: {slot.pickupPizzas} / {slotCapacityConfig.maxPickupPizzasPerSlot}</p><p>Stato: {slot.pickupOverloaded ? "sovraccarico" : slot.pickupStatus}</p></div>
                            <div className="rounded-lg bg-white p-2"><p className="font-bold text-sky-800">CONSEGNA</p><p>Consegne: {slot.deliveryOrders} / {slotCapacityConfig.maxDeliveryOrdersPerSlot}</p><p>Pizze in consegna: {slot.deliveryPizzas} (informativo)</p><p>Max pizze per singola consegna: {slotCapacityConfig.maxPizzasPerDeliveryOrder}</p><p>Rider disponibili: {slotCapacityConfig.ridersAvailable}</p><p>Stato: {slot.deliveryOverloaded ? "sovraccarico" : slot.deliveryStatus}</p></div>
                          </div>
                          <p className="mt-2 rounded-lg bg-white p-2 font-semibold">TOTALE CUCINA - Pizze: {slot.totalPizzas} / {slotCapacityConfig.maxTotalPizzasPerSlot} ({slot.kitchenOverloaded ? "sovraccarico cucina" : slot.kitchenFull ? "pieno" : "ok"})</p>
                          {slot.deliveryResidualOrders < 1 && !slot.kitchenFull && (
                            <p className="mt-2 rounded-lg bg-amber-100 p-2 font-semibold text-amber-900">
                              Consegne piene, ritiro ancora disponibile.
                            </p>
                          )}
                        </div>
                      ))}
                      {slotCapacityFiltered.length === 0 && <p className="rounded-xl bg-[#fff7f0] p-3 text-xs text-[#82513a]">Nessuno slot per il filtro selezionato.</p>}
                    </div>
                  </section>
                </>
              )}

              {adminTab === "ordine-telefonico" && (
                <section className="space-y-3 rounded-2xl border border-[#f0d7c7] bg-white p-4">
                  <h2 className="font-semibold">Inserimento ordine manuale</h2>
                  <div className="space-y-2 rounded-xl bg-[#fff7f0] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9a715c]">Cliente</p>
                    <input value={manualCustomerName} onChange={(e) => setManualCustomerName(e.target.value)} className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Nome cliente" />
                    <input value={manualCustomerPhone} onChange={(e) => setManualCustomerPhone(e.target.value)} className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Telefono cliente" />
                    <input value={manualCustomerEmail} onChange={(e) => setManualCustomerEmail(e.target.value)} className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Email opzionale" />
                    {manualPhoneNormalized.length > 5 && (
                      <p className="rounded-lg bg-white p-2 text-xs font-semibold text-[#6d4331]">
                        {matchedManualCustomer ? "Cliente gia presente" : "Nuovo cliente: verra aggiunto al database demo"}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl bg-[#fff7f0] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9a715c]">Tipo ordine</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button onClick={() => { setManualTipoOrdine("ritiro"); setManualPaymentMethod("cash_at_pickup"); }} className={`rounded-xl border py-3 text-sm font-semibold ${manualTipoOrdine === "ritiro" ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#ecc8b1] bg-white"}`}>Ritiro in pizzeria</button>
                      <button onClick={() => { setManualTipoOrdine("consegna"); setManualPaymentMethod("cash_on_delivery"); }} className={`rounded-xl border py-3 text-sm font-semibold ${manualTipoOrdine === "consegna" ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#ecc8b1] bg-white"}`}>Consegna a domicilio</button>
                    </div>
                    {manualTipoOrdine === "consegna" && (
                      <div className="mt-3 space-y-2">
                        <input value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Indirizzo" />
                        <input value={manualCitofono} onChange={(e) => setManualCitofono(e.target.value)} className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Citofono / interno" />
                        <textarea value={manualDeliveryNotes} onChange={(e) => setManualDeliveryNotes(e.target.value)} className="h-20 w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Note consegna" />
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl bg-[#fff7f0] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9a715c]">Orario</p>
                    <div className="mt-2 space-y-2">
                      {manualSlotCapacity.map((slot) => (
                        <button key={`manual-${slot.slot}`} onClick={() => slot.selezionabile && setManualOrarioScelto(slot.slot)} disabled={!slot.selezionabile} className={`w-full rounded-xl border p-3 text-left text-xs ${manualOrarioScelto === slot.slot ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#ecc8b1] bg-white"} disabled:opacity-50`}>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{slot.slot}</span>
                            <span className="font-semibold">{slot.stato === "disponibile" ? "Disponibile" : slot.stato === "quasi pieno" ? "Quasi pieno" : "Pieno"}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#6d4331]">
                            {manualTipoOrdine === "ritiro"
                              ? `Residuo ritiro: ${Math.max(slot.pickupResidualPizzas, 0)} pizze`
                              : `Consegne residue: ${Math.max(slot.deliveryResidualOrders, 0)}`}
                          </p>
                          {manualTipoOrdine === "consegna" && (
                            <>
                              <p className="mt-1 text-[11px] text-[#6d4331]">
                                Cucina residua: {Math.max(slot.totalResidualPizzas, 0)} pizze
                              </p>
                              <p className="mt-1 text-[11px] text-[#6d4331]">
                                Max per consegna: {slotCapacityConfig.maxPizzasPerDeliveryOrder} pizze
                              </p>
                            </>
                          )}
                          {manualTipoOrdine === "consegna" && slot.riderLimited && (
                            <p className="mt-1 text-[11px] font-semibold text-amber-800">RIDER LIMITATO</p>
                          )}
                          {manualTipoOrdine === "consegna" && (slot.deliveryOverloaded || slot.kitchenOverloaded) && (
                            <p className="mt-1 text-[11px] font-semibold text-red-800">SOVRACCARICO CONSEGNE</p>
                          )}
                        </button>
                      ))}
                    </div>
                    {manualTipoOrdine === "consegna" && manualSelectedSlotInfo?.riderLimited && (
                      <p className="mt-2 rounded-lg bg-amber-100 p-2 text-[11px] font-semibold text-amber-900">
                        Capacita rider limitata in questa fascia oraria.
                      </p>
                    )}
                    {manualTipoOrdine === "consegna" && manualSelectedSlotInfo?.exceedsDeliveryOrderPizzaLimit && (
                      <p className="mt-2 rounded-lg bg-red-100 p-2 text-[11px] font-semibold text-red-900">
                        Ordine troppo grande per una singola consegna. Contatta la pizzeria.
                      </p>
                    )}
                    {manualTipoOrdine === "consegna" && manualSelectedSlotInfo && !manualSelectedSlotInfo.selezionabile && (
                      <div className="mt-2 space-y-2 rounded-lg bg-red-100 p-2 text-[11px] font-semibold text-red-900">
                        <p>
                          {manualSelectedSlotInfo.deliveryResidualOrders < 1 && !manualSelectedSlotInfo.kitchenFull
                            ? "Consegne piene, ritiro ancora disponibile."
                            : "Attenzione: consegne oltre capacità. Aggiungi solo se vuoi forzare manualmente."}
                        </p>
                        <button
                          onClick={() => setManualForceInsert((prev) => !prev)}
                          className={`w-full rounded-lg py-2 ${manualForceInsert ? "bg-red-700 text-white" : "bg-white text-red-800"}`}
                        >
                          {manualForceInsert ? "Forzatura attiva" : "Forza inserimento"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-xl bg-[#fff7f0] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9a715c]">Prodotti</p>
                    <select value={manualSelectedPizzaId} onChange={(e) => setManualSelectedPizzaId(e.target.value)} className="w-full rounded-xl border border-[#ecc8b1] p-3 text-sm">
                      {MENU_PIZZE.map((pizza) => (
                        <option key={pizza.id} value={pizza.id}>{pizza.nome} - {formatEuro(pizza.prezzo)}</option>
                      ))}
                    </select>
                    {manualPizzaSelezionata && (
                      <div className="rounded-xl border border-[#ecd7c8] bg-white p-3 text-xs text-[#6d4331]">
                        <p className="text-sm font-semibold text-[#3a1f12]">{manualPizzaSelezionata.nome}</p>
                        <p>Prezzo unitario: {formatEuro(manualPizzaSelezionata.prezzo)}</p>
                        <p>Ingredienti base: {manualPizzaSelezionata.ingredienti.join(", ")}</p>
                        <p className="mt-2 font-semibold text-[#3a1f12]">Extra disponibili</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {EXTRA_INGREDIENTI.map((extra) => (
                            <button
                              key={`manual-extra-${extra}`}
                              onClick={() =>
                                setManualExtraSelezionati((prev) =>
                                  prev.includes(extra) ? prev.filter((item) => item !== extra) : [...prev, extra]
                                )
                              }
                              className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${
                                manualExtraSelezionati.includes(extra)
                                  ? "border-[#8f3b18] bg-[#f4dfd0] text-[#8f3b18]"
                                  : "border-[#ecc8b1] bg-white text-[#82513a]"
                              }`}
                            >
                              {extra} (+{formatEuro(getExtraPrezzo(extra))})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-[#ecc8b1] bg-white p-2">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9a715c]">Quantita</p>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={decrementaManualPizzaQty}
                          className="h-10 w-10 rounded-xl border border-[#d9b7a3] bg-white text-lg font-bold text-[#8f3b18]"
                          aria-label="Diminuisci quantità"
                        >
                          -
                        </button>
                        <div className="min-w-10 text-center text-xl font-bold text-[#3a1f12]">{manualPizzaQty}</div>
                        <button
                          onClick={incrementaManualPizzaQty}
                          className="h-10 w-10 rounded-xl border border-[#d9b7a3] bg-white text-lg font-bold text-[#8f3b18]"
                          aria-label="Aumenta quantità"
                        >
                          +
                        </button>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={manualPizzaQty}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => setManualPizzaQty(Math.max(1, Number(e.target.value) || 1))}
                        className="mt-2 w-full rounded-xl border border-[#ecc8b1] p-2 text-center text-sm"
                        placeholder="Quantita"
                      />
                    </div>
                    <textarea value={manualPizzaNote} onChange={(e) => setManualPizzaNote(e.target.value)} className="h-20 w-full rounded-xl border border-[#ecc8b1] p-3 text-sm" placeholder="Note pizza" />
                    <button onClick={aggiungiPizzaOrdineManuale} className="w-full rounded-xl bg-[#8f3b18] py-3 text-sm font-semibold text-white">Aggiungi pizza all&apos;ordine</button>
                    {manualRows.map((row) => (
                      <article key={row.id} className="rounded-xl border border-[#ecd7c8] bg-white p-3 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{row.quantita}x {row.nome}</p>
                          <p className="font-semibold">{formatEuro((row.basePrezzo + getTotaleExtra(row.extra)) * row.quantita)}</p>
                        </div>
                        <p className="mt-1 text-xs text-[#6d4331]">Prezzo unitario: {formatEuro(row.basePrezzo + getTotaleExtra(row.extra))}</p>
                        <p className="text-xs font-semibold text-[#6d4331]">Totale riga: {formatEuro((row.basePrezzo + getTotaleExtra(row.extra)) * row.quantita)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => aggiornaQuantitaManualRow(row.id, Math.max(1, row.quantita - 1))}
                            className="h-8 w-8 rounded-lg border border-[#d9b7a3] bg-white text-sm font-bold text-[#8f3b18]"
                            aria-label={`Diminuisci quantità ${row.nome}`}
                          >
                            -
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold">{row.quantita}</span>
                          <button
                            onClick={() => aggiornaQuantitaManualRow(row.id, row.quantita + 1)}
                            className="h-8 w-8 rounded-lg border border-[#d9b7a3] bg-white text-sm font-bold text-[#8f3b18]"
                            aria-label={`Aumenta quantità ${row.nome}`}
                          >
                            +
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={row.quantita}
                            onFocus={(e) => e.currentTarget.select()}
                            onChange={(e) => aggiornaQuantitaManualRow(row.id, Math.max(1, Number(e.target.value) || 1))}
                            className="w-16 rounded-lg border border-[#ecc8b1] p-2 text-center text-xs"
                          />
                          <button onClick={() => removeManualRow(row.id)} className="rounded-lg border border-[#d9b7a3] px-3 py-2 text-xs font-semibold text-[#8f3b18]">Rimuovi</button>
                        </div>
                        {row.extra.length > 0 && <p className="mt-1 text-xs text-[#6d4331]">Extra: {row.extra.join(", ")}</p>}
                        {row.adminNote && <p className="mt-1 text-xs text-[#6d4331]">Note: {row.adminNote}</p>}
                      </article>
                    ))}
                    <p className="rounded-lg bg-white p-2 text-sm font-semibold text-[#6d4331]">Totale ordine: {formatEuro(manualTotal)}</p>
                  </div>

                  <div className="space-y-2 rounded-xl bg-[#fff7f0] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#9a715c]">Pagamento</p>
                    {manualPaymentOptions.map((option) => (
                      <button key={option.id} onClick={() => setManualPaymentMethod(option.id)} className={`w-full rounded-xl border p-3 text-left text-sm font-semibold ${manualPaymentMethod === option.id ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#ecc8b1] bg-white"}`}>
                        {option.label}
                      </button>
                    ))}
                    {manualTipoOrdine === "consegna" && manualPaymentMethod === "card_on_delivery" && (
                      <span className="inline-flex rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                        PORTARE POS
                      </span>
                    )}
                  </div>

                  <button onClick={creaOrdineTelefonico} disabled={(!manualSelectedSlotInfo?.selezionabile && !(manualTipoOrdine === "consegna" && manualForceInsert)) || manualRows.length === 0} className="w-full rounded-2xl bg-[#8f3b18] py-4 text-base font-bold text-white disabled:opacity-50">
                    Crea ordine telefonico
                  </button>
                  {manualOrderNotice && <p className="rounded-xl bg-[#f4dfd0] p-3 text-sm text-[#6d4331]">{manualOrderNotice}</p>}

                  {manualWhatsappMessage && (
                    <div className="space-y-2 rounded-xl border border-[#dcb39a] bg-[#fff1e8] p-3">
                      <p className="text-sm font-bold text-[#8f3b18]">Messaggio WhatsApp pronto</p>
                      <textarea value={manualWhatsappMessage} readOnly className="h-40 w-full rounded-xl border border-[#ecc8b1] bg-white p-3 text-xs" />
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => copiaMessaggioWhatsapp(manualWhatsappMessage)} className="rounded-xl border border-[#d59e7d] bg-white py-3 text-xs font-semibold text-[#8f3b18]">Copia messaggio WhatsApp</button>
                        <button onClick={() => apriWhatsapp(manualWhatsappPhone, manualWhatsappMessage)} className="rounded-xl bg-[#25D366] py-3 text-xs font-semibold text-white">Apri WhatsApp</button>
                      </div>
                      {manualCopied && <p className="text-xs text-[#6d4331]">{manualCopied}</p>}
                    </div>
                  )}
                </section>
              )}

              {adminTab === "crm" && (
                <>
                  <section className="grid grid-cols-2 gap-3">
                    <MetricCard titolo="Clienti totali" valore={String(clienti.length)} />
                    <MetricCard titolo="Clienti con app" valore={String(clientiConApp.length)} />
                    <MetricCard titolo="Clienti senza app" valore={String(clientiSenzaApp.length)} />
                    <MetricCard titolo="Acquisiti da telefono" valore={String(clientiDaTelefono.length)} />
                    <MetricCard titolo="Clienti da convertire" valore={String(clientiSenzaApp.length)} />
                    <MetricCard titolo="Clienti dormienti" valore={String(clientiDormienti.length)} />
                    <MetricCard titolo="Clienti migliori" valore={String(clientiMigliori.length)} />
                  </section>

                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Lista clienti CRM</h2>
                    <div className="mt-3 space-y-2">
                      {customerAnalytics.map((cliente) => (
                        <article key={`conv-${cliente.id}`} className="rounded-xl border border-[#ecd7c8] bg-[#fffaf6] p-3">
                          <p className="text-sm font-semibold">{cliente.nome}</p>
                          <p className="text-xs text-[#6d4331]">{cliente.telefono}</p>
                          {cliente.email && <p className="text-xs text-[#6d4331]">{cliente.email}</p>}
                          <p className="text-xs text-[#6d4331]">Ordini: {cliente.numeroOrdini} - Totale speso: {formatEuro(cliente.totaleSpeso)}</p>
                          <p className="text-xs text-[#6d4331]">Scontrino medio: {formatEuro(cliente.scontrinoMedioCliente)}</p>
                          <p className="text-xs text-[#6d4331]">Ultimo ordine: {cliente.ultimoOrdine ? formatItalianDate(cliente.ultimoOrdine.slice(0, 10)) : "N/D"}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {cliente.tags.map((tag) => (
                              <span key={`${cliente.id}-${tag}`} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#6d4331]">{tag}</span>
                            ))}
                          </div>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <button onClick={() => { const msg = buildMarketingMessage("app", cliente.nome); setCrmPromoNotice(msg); copiaMessaggioWhatsapp(msg); }} className="w-full rounded-xl border border-[#d59e7d] bg-white py-2 text-xs font-semibold text-[#8f3b18]">Invia promo scarica app</button>
                            <button onClick={() => { const msg = buildMarketingMessage("riattivazione", cliente.nome); setCrmPromoNotice(msg); copiaMessaggioWhatsapp(msg); }} className="w-full rounded-xl border border-[#d59e7d] bg-white py-2 text-xs font-semibold text-[#8f3b18]">Invia promo riattivazione</button>
                            <button onClick={() => { const msg = `Ciao ${cliente.nome}, grazie per essere un cliente fedele: abbiamo un vantaggio esclusivo per te.`; setCrmPromoNotice(msg); copiaMessaggioWhatsapp(msg); }} className="w-full rounded-xl border border-[#d59e7d] bg-white py-2 text-xs font-semibold text-[#8f3b18]">Premia cliente fedele</button>
                          </div>
                        </article>
                      ))}
                    </div>
                    {crmPromoNotice && <p className="mt-3 rounded-xl bg-[#f4dfd0] p-3 text-xs text-[#6d4331]">{crmPromoNotice}</p>}
                  </section>

                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Clienti demo</h2>
                    <div className="mt-2 space-y-2 text-sm">
                      {clienti.map((cliente) => (
                        <div key={cliente.id} className="rounded-xl bg-[#fffaf6] p-3">
                          <p className="font-semibold">{cliente.nome} - {cliente.telefono}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cliente.hasApp ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {cliente.hasApp ? "APP" : "SENZA APP"}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cliente.source === "telefono" ? "bg-orange-100 text-orange-800" : "bg-sky-100 text-sky-800"}`}>
                              {cliente.source === "telefono" ? "TELEFONICO" : "APP"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {adminTab === "rfm" && (
                <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                  <h2 className="font-semibold">Matrice RFM</h2>
                  <p className="mt-1 text-xs text-[#6d4331]">R = Recency, F = Frequency, M = Monetary</p>
                  <div className="mt-3 space-y-2">
                    {customerAnalytics.map((cliente) => (
                      <article key={`rfm-${cliente.id}`} className="rounded-xl border border-[#ecd7c8] bg-[#fffaf6] p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{cliente.nome}</p>
                          <span className="rounded-full bg-[#f4dfd0] px-2 py-0.5 text-[10px] font-bold text-[#8f3b18]">{cliente.segmento}</span>
                        </div>
                        <p>R:{cliente.recencyScore} F:{cliente.frequencyScore} M:{cliente.monetaryScore}</p>
                        <p className="text-[#6d4331]">{cliente.suggerimento}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {adminTab === "prodotti" && (
                <>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <p className="text-xs text-[#6d4331]">
                      Dati demo calcolati sugli ordini presenti nella simulazione. Nella versione reale questi dati saranno generati dagli ordini effettivi.
                    </p>
                  </section>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Pizze più vendute</h2>
                    <div className="mt-2 space-y-2 text-sm">
                      {pizzaStats.map((item) => (
                        <article key={item.pizza.id} className="rounded-xl bg-[#fffaf6] p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{item.pizza.nome}</p>
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold">{item.badge}</span>
                          </div>
                          <p className="text-xs text-[#6d4331]">Quantita venduta: {item.quantitaVenduta}</p>
                          <p className="text-xs text-[#6d4331]">Fatturato: {formatEuro(item.fatturato)}</p>
                          <p className="text-xs text-[#6d4331]">Percentuale vendite: {item.percentuale.toFixed(1)}%</p>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Ingredienti extra più usati</h2>
                    <div className="mt-2 space-y-2 text-sm">
                      {extraStats.map((item) => (
                        <article key={item.ingrediente} className="rounded-xl bg-[#fffaf6] p-3">
                          <p className="font-semibold">{item.ingrediente}</p>
                          <p className="text-xs text-[#6d4331]">Volte usato: {item.usi}</p>
                          <p className="text-xs text-[#6d4331]">Ricavo extra: {formatEuro(item.ricavo)}</p>
                          <p className={`text-xs font-semibold ${item.usi === 0 ? "text-amber-800" : "text-emerald-700"}`}>{item.stato}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Ingredienti poco usati / possibili sprechi</h2>
                    <div className="mt-2 space-y-2 text-sm">
                      {ingredientiPocoUsati.map((item) => (
                        <article key={item.ingrediente} className="rounded-xl bg-[#fffaf6] p-3">
                          <p className="font-semibold">{item.ingrediente}</p>
                          <p className="text-xs text-[#6d4331]">Volte usato: {item.usi}</p>
                          <p className="text-xs text-[#6d4331]">Ricavo extra: {formatEuro(item.ricavoExtra)}</p>
                          <p className="text-xs text-[#6d4331]">Costo/spreco stimato: {formatEuro(item.spreco)}</p>
                          <p className="text-xs font-semibold text-amber-800">{item.suggerimento}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {adminTab === "marketing" && (
                <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                  <h2 className="font-semibold">Marketing operativo</h2>
                  <div className="mt-3 space-y-3">
                    {[
                      { titolo: "Clienti senza app da convertire", gruppo: customerAnalytics.filter((c) => !c.hasApp), obiettivo: "Conversione app", template: "app" as const },
                      { titolo: "Clienti dormienti", gruppo: customerAnalytics.filter((c) => c.ultimoOrdineGiorniFa > 20), obiettivo: "Riattivazione", template: "riattivazione" as const },
                      { titolo: "Clienti weekend da spingere in settimana", gruppo: customerAnalytics.filter((c) => c.preferenzaWeekend), obiettivo: "Bilanciare domanda", template: "riattivazione" as const },
                      { titolo: "Clienti da secondo ordine", gruppo: customerAnalytics.filter((c) => c.numeroOrdini <= 1), obiettivo: "Aumentare frequenza", template: "secondo-ordine" as const },
                      { titolo: "Clienti top da premiare", gruppo: clientiMigliori, obiettivo: "Retention premium", template: "app" as const },
                    ].map((item) => (
                      <article key={item.titolo} className="rounded-xl border border-[#ecd7c8] bg-[#fffaf6] p-3 text-xs">
                        <p className="font-semibold text-sm">{item.titolo}</p>
                        <p>Numero clienti: {item.gruppo.length}</p>
                        <p>Obiettivo: {item.obiettivo}</p>
                        <p className="mt-1 text-[#6d4331]">{buildMarketingMessage(item.template, "{nome}")}</p>
                        <button
                          onClick={() => {
                            const nome = item.gruppo[0]?.nome ?? "cliente";
                            const message = buildMarketingMessage(item.template, nome);
                            setMarketingMessageNotice(message);
                            copiaMessaggioWhatsapp(message);
                          }}
                          className="mt-2 w-full rounded-xl border border-[#d59e7d] bg-white py-2 text-xs font-semibold text-[#8f3b18]"
                        >
                          Copia messaggio WhatsApp
                        </button>
                      </article>
                    ))}
                  </div>
                  {marketingMessageNotice && <p className="mt-3 rounded-xl bg-[#f4dfd0] p-3 text-xs text-[#6d4331]">{marketingMessageNotice}</p>}
                </section>
              )}

              {adminTab === "archivio" && (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-[#9a715c]">Archivio giornate</h2>
                  <p className="text-xs text-[#6d4331]">
                    Riepiloghi calcolati dagli ordini archiviati nella demo locale.
                  </p>
                  {riepilogoGiornateArchiviate.length === 0 ? (
                    <p className="rounded-xl bg-[#fff7f0] p-3 text-xs text-[#82513a]">Nessuna giornata archiviata ancora.</p>
                  ) : (
                    <div className="grid gap-3">
                      {riepilogoGiornateArchiviate.map((g) => (
                        <article key={g.serviceDate} className="rounded-2xl border border-[#ecd7c8] bg-white p-4 text-sm">
                          <p className="font-semibold text-[#8f3b18]">{formatItalianDate(g.serviceDate)}</p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6d4331]">
                            <p>
                              Ordini: <span className="font-semibold">{g.numeroOrdini}</span>
                            </p>
                            <p>
                              Fatturato: <span className="font-semibold">{formatEuro(g.fatturato)}</span>
                            </p>
                            <p>
                              Pizze vendute: <span className="font-semibold">{g.pizzeVendute}</span>
                            </p>
                            <p>
                              Scontrino medio: <span className="font-semibold">{formatEuro(g.scontrinoMedio)}</span>
                            </p>
                            <p>
                              Ordini ritiro: <span className="font-semibold">{g.ordiniRitiro}</span>
                            </p>
                            <p>
                              Ordini consegna: <span className="font-semibold">{g.ordiniConsegna}</span>
                            </p>
                            <p>
                              Ordini telefonici: <span className="font-semibold">{g.ordiniTelefonici}</span>
                            </p>
                            <p>
                              Comande stampate: <span className="font-semibold">{g.comandeStampate}</span>
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {adminTab === "dashboard" && (
                <>
                  {adminArchiveNotice && (
                    <p className="rounded-xl bg-[#f4dfd0] p-3 text-sm font-semibold text-[#6d4331]">{adminArchiveNotice}</p>
                  )}
                  <section className="rounded-2xl border border-[#d59e7d] bg-[#fff7f0] p-4">
                    <h2 className="font-semibold text-[#8f3b18]">Fine servizio</h2>
                    <p className="mt-2 text-sm text-[#6d4331]">
                      Archivia gli ordini di oggi e prepara il Kanban per una nuova giornata. Gli ordini resteranno nello storico clienti e nelle statistiche.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={apriModalFineServizio}
                        className="rounded-xl bg-[#8f3b18] px-4 py-3 text-sm font-semibold text-white"
                      >
                        Archivia giornata e resetta Kanban
                      </button>
                      <button
                        type="button"
                        onClick={creaNuovaGiornataDemo}
                        className="rounded-xl border border-[#d59e7d] bg-white px-4 py-3 text-sm font-semibold text-[#8f3b18]"
                      >
                        Crea nuova giornata demo
                      </button>
                    </div>
                  </section>
                  <section className="grid grid-cols-2 gap-3">
                    <MetricCard titolo="Ordini operativi oggi" valore={String(ordiniOperativiOggi.length)} />
                    <MetricCard titolo="Ordini archiviati totali" valore={String(ordiniArchiviatiTotali)} />
                    <MetricCard
                      titolo="Ultima giornata archiviata"
                      valore={
                        ultimaGiornataArchiviataInfo
                          ? formatItalianDate(ultimaGiornataArchiviataInfo.serviceDate)
                          : "—"
                      }
                    />
                    <MetricCard titolo="Fatturato storico demo" valore={formatEuro(fatturatoStoricoDemo)} />
                    <MetricCard titolo="Fatturato oggi (operativo)" valore={formatEuro(fatturatoDemo)} />
                    <MetricCard titolo="Scontrino medio (oggi)" valore={formatEuro(scontrinoMedio)} />
                    <MetricCard titolo="Pizze vendute oggi" valore={String(pizzeVenduteOggi)} />
                    <MetricCard titolo="Comande da stampare" valore={String(comandeDaStampare)} />
                    <MetricCard titolo="Slot critici/sovraccarichi" valore={String(slotCriticiCount)} />
                  </section>
                  <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                    <h2 className="font-semibold">Riepilogo operativo breve</h2>
                    <div className="mt-3 space-y-2 text-sm text-[#6d4331]">
                      <p>Ordini telefonici oggi: <span className="font-semibold">{ordiniTelefoniciOggi.length}</span></p>
                      <p>Incasso online simulato: <span className="font-semibold">{formatEuro(incassoOnlineSimulato)}</span></p>
                      <p>Incasso da riscuotere: <span className="font-semibold">{formatEuro(incassoDaRiscuotere)}</span></p>
                      <p>Slot pieni: <span className="font-semibold">{slotSummary.pieni}</span> - Quasi pieni: <span className="font-semibold">{slotSummary.quasiPieni}</span></p>
                      <p>Top pizza del giorno: <span className="font-semibold">{topPizzaDelGiorno}</span> - Extra piu usato: <span className="font-semibold">{extraPiuUsato}</span></p>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </section>

        {view === "cliente" && (
          <nav className="fixed bottom-3 left-1/2 z-10 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-[#e8cdb7] bg-white p-2 shadow-lg">
            <div className="grid grid-cols-5 gap-1 text-xs font-semibold">
              <button className={`rounded-xl py-2 ${tabCliente === "home" ? "bg-[#f4dfd0]" : ""}`} onClick={() => setTabCliente("home")}>Home</button>
              <button className={`rounded-xl py-2 ${tabCliente === "menu" ? "bg-[#f4dfd0]" : ""}`} onClick={() => setTabCliente("menu")}>Menu</button>
              <button className={`rounded-xl py-2 ${tabCliente === "carrello" ? "bg-[#f4dfd0]" : ""}`} onClick={() => setTabCliente("carrello")}>
                Carrello{numeroProdottiCarrello > 0 ? ` (${numeroProdottiCarrello})` : ""}
              </button>
              <button className={`rounded-xl py-2 ${tabCliente === "storico" ? "bg-[#f4dfd0]" : ""}`} onClick={() => setTabCliente("storico")}>Storico</button>
              <button className={`rounded-xl py-2 ${tabCliente === "profilo" ? "bg-[#f4dfd0]" : ""}`} onClick={() => setTabCliente("profilo")}>Profilo</button>
            </div>
          </nav>
        )}
      </main>

      {menuAddToast && view === "cliente" && (
        <div className="fixed bottom-24 left-1/2 z-20 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-[#8f3b18] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
          {menuAddToast}
        </div>
      )}

      {showReorderPicker && (
        <div className="fixed inset-0 z-20 bg-black/30 p-3">
          <div className="mx-auto mt-16 max-w-md rounded-3xl bg-white p-5">
            <h3 className="text-lg font-bold">Scegli cosa riordinare</h3>
            <div className="mt-3 space-y-2">
              <button
                onClick={caricaUltimoOrdine}
                className="w-full rounded-xl border border-[#d59e7d] bg-[#fff7f0] p-3 text-left"
              >
                <p className="text-sm font-semibold">Riordina ultimo ordine</p>
                <p className="text-xs text-[#6d4331]">Carica l&apos;ultimo ordine effettuato</p>
              </button>
              {profiloCliente.savedOrders.map((saved) => (
                <button
                  key={saved.id}
                  onClick={() => caricaSavedOrder(saved)}
                  className="w-full rounded-xl border border-[#d59e7d] bg-[#fff7f0] p-3 text-left"
                >
                  <p className="text-sm font-semibold">{saved.nomeOrdine}</p>
                  <p className="text-xs text-[#6d4331]">
                    {saved.prodotti.reduce((acc, p) => acc + p.quantita, 0)} pizze - {formatEuro(saved.totaleStimato)}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReorderPicker(false)}
              className="mt-4 w-full rounded-xl border border-[#d59e7d] py-3 text-sm font-semibold text-[#8f3b18]"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {pizzaSelezionata && (
        <div className="fixed inset-0 z-20 bg-black/30 p-3">
          <div className="mx-auto mt-16 max-w-md rounded-3xl bg-white p-5">
            <h3 className="text-lg font-bold">{pizzaSelezionata.nome}</h3>
            <p className="mt-1 text-sm text-[#82513a]">{pizzaSelezionata.ingredienti.join(", ")}</p>
            <p className="mt-1 font-semibold">{formatEuro(pizzaSelezionata.prezzo)}</p>
            <div className="mt-4">
              <p className="text-sm font-semibold">Extra ingredienti</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {EXTRA_INGREDIENTI.map((extra) => (
                  <button
                    key={extra}
                    onClick={() =>
                      setExtraSelezionati((prev) =>
                        prev.includes(extra) ? prev.filter((x) => x !== extra) : [...prev, extra]
                      )
                    }
                    className={`rounded-xl border px-3 py-2 text-sm ${extraSelezionati.includes(extra) ? "border-[#8f3b18] bg-[#f4dfd0]" : "border-[#e8cdb7]"}`}
                  >
                    {extra} + {formatEuro(getExtraPrezzo(extra))}
                  </button>
                ))}
              </div>
            </div>
            <label className="mt-4 block text-sm font-semibold">
              Note
              <textarea value={notePizza} onChange={(e) => setNotePizza(e.target.value)} className="mt-2 h-20 w-full rounded-xl border border-[#e8cdb7] p-3 text-sm" placeholder="Es. ben cotta, senza origano..." />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={() => setPizzaSelezionata(null)} className="rounded-xl border border-[#d59e7d] py-3 font-semibold">Annulla</button>
              <button onClick={aggiungiPizza} className="rounded-xl bg-[#8f3b18] py-3 font-semibold text-white">Aggiungi</button>
            </div>
          </div>
        </div>
      )}

      {showFineServizioModal && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-3 pt-8 pb-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fine-servizio-modal-title"
          onClick={chiudiModalFineServizio}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[#ecc8b1] bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="fine-servizio-modal-title" className="text-lg font-bold text-[#3a1f12]">
              Conferma fine servizio
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#6d4331]">
              Stai per archiviare tutti gli ordini operativi di oggi e svuotare il Kanban.
              Gli ordini non verranno eliminati: resteranno nello storico clienti e nelle statistiche.
              Questa azione è pensata per fine giornata/fine servizio.
            </p>
            <div className="mt-4 rounded-2xl bg-[#fff7f0] p-4 text-sm text-[#6d4331]">
              <p className="font-semibold text-[#8f3b18]">Riepilogo operativo</p>
              <ul className="mt-2 space-y-2 text-xs sm:text-sm">
                <li className="flex justify-between gap-3 border-b border-[#f0d7c7] pb-2">
                  <span>Ordini operativi da archiviare</span>
                  <span className="font-semibold tabular-nums">{ordiniOperativiOggi.length}</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-[#f0d7c7] pb-2">
                  <span>Comande ancora da stampare</span>
                  <span className="font-semibold tabular-nums">{comandeDaStampare}</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-[#f0d7c7] pb-2">
                  <span>Ordini non completati</span>
                  <span className="font-semibold tabular-nums">{ordiniAttiviCount}</span>
                </li>
                <li className="flex justify-between gap-3 border-b border-[#f0d7c7] pb-2">
                  <span>Fatturato operativo della giornata</span>
                  <span className="font-semibold tabular-nums">{formatEuro(fatturatoDemo)}</span>
                </li>
                <li className="flex justify-between gap-3 pt-1">
                  <span>Pizze (operativo di oggi)</span>
                  <span className="font-semibold tabular-nums">{pizzeVenduteOggi}</span>
                </li>
              </ul>
            </div>
            {ordiniAttiviCount > 0 && (
              <div className="mt-4 rounded-xl border-2 border-amber-500 bg-amber-50 p-3 text-sm font-semibold text-amber-950">
                Attenzione: ci sono ordini non completati. Assicurati che il servizio sia davvero finito.
              </div>
            )}
            <label className="mt-4 block text-sm font-semibold text-[#3a1f12]" htmlFor="archive-reset-confirm">
              Scrivi RESET per confermare
              <input
                id="archive-reset-confirm"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={archiveResetConfirmInput}
                onChange={(e) => setArchiveResetConfirmInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#ecc8b1] bg-white px-3 py-3 text-base font-mono text-[#3a1f12] outline-none ring-[#8f3b18] focus:ring-2"
                placeholder="RESET"
              />
            </label>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-end">
              <button
                type="button"
                disabled={archiveResetConfirmInput !== "RESET"}
                onClick={eseguiArchiviazioneGiornataDopoConferma}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm ring-red-700 transition enabled:hover:bg-red-700 enabled:focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-red-300 disabled:text-red-100 sm:w-auto sm:min-w-[11rem]"
              >
                Conferma reset giornata
              </button>
              <button
                type="button"
                onClick={chiudiModalFineServizio}
                className="w-full rounded-xl border border-[#d59e7d] bg-white px-4 py-3 text-sm font-semibold text-[#8f3b18] sm:w-auto"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintPreview && (
        <div className="fixed inset-0 z-30 bg-black/40 p-3">
          <div className="mx-auto mt-10 max-w-md rounded-3xl bg-white p-4">
            <h3 className="text-lg font-bold">Anteprima comanda</h3>
            <p className="mt-1 text-xs text-[#6d4331]">Comande selezionate: {printPreviewOrders.length}</p>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {printPreviewOrders.map((ordine) => (
                <div key={`preview-${ordine.id}`} className="rounded-xl bg-[#fff7f0] p-3 text-xs text-[#6d4331]">
                  <p className="font-semibold text-[#3a1f12]">{ordine.id}</p>
                  <p>{ordine.clienteNome} - {ordine.tipoOrdine === "ritiro" ? "RITIRO" : "CONSEGNA"}</p>
                  <p>Orario: {ordine.orarioScelto}</p>
                  <p>Prodotti: {ordine.righe.map((r) => `${r.quantita}x ${r.nome}`).join(", ")}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={stampaComandeAnteprima} className="rounded-xl bg-[#8f3b18] py-3 text-sm font-semibold text-white">Stampa</button>
              <button onClick={() => setShowPrintPreview(false)} className="rounded-xl border border-[#d59e7d] py-3 text-sm font-semibold text-[#8f3b18]">Chiudi</button>
            </div>
          </div>
        </div>
      )}

      <section className="print-only" id="print-root">
        {printPreviewOrders.map((ordine) => (
          <ComandaPrintView key={`print-${ordine.id}`} ordine={ordine} />
        ))}
      </section>

      <style jsx global>{`
        @media print {
          .print-only { display: block !important; }
          main, nav, header, section:not(#print-root), button, .fixed { display: none !important; }
          #print-root { display: block !important; padding: 0; margin: 0; }
          .comanda-print { page-break-after: always; color: #000; background: #fff; padding: 16px; font-size: 12px; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>
    </div>
  );
}

function MetricCard({ titolo, valore }: { titolo: string; valore: string }) {
  return (
    <article className="rounded-2xl border border-[#f0d7c7] bg-white p-3">
      <p className="text-xs text-[#9a715c]">{titolo}</p>
      <p className="mt-1 text-lg font-bold leading-none">{valore}</p>
    </article>
  );
}

function ComandaPrintView({ ordine }: { ordine: Ordine }) {
  return (
    <article className="comanda-print">
      <h1 style={{ fontWeight: 700 }}>PIZZAFLOW</h1>
      <h2 style={{ fontWeight: 700 }}>COMANDA CUCINA</h2>
      <p>Codice: {ordine.id}</p>
      <p>Data ordine: {formatItalianDate(ordine.orderDate)}</p>
      <p>Ora inserimento: {formatItalianTime(ordine.createdAt)}</p>
      <p>Orario richiesto: {ordine.orarioScelto}</p>
      <hr />
      <p>Tipo ordine: {ordine.tipoOrdine === "ritiro" ? "RITIRO" : "CONSEGNA"}</p>
      <p>Fonte ordine: {ordine.source.toUpperCase()}</p>
      <p>Stato ordine: {ordine.stato}</p>
      <p>Cliente: {ordine.clienteNome}</p>
      <p>Telefono: {ordine.telefonoCliente || "-"}</p>
      {ordine.tipoOrdine === "consegna" && (
        <>
          <p>Indirizzo: {ordine.indirizzo || "-"}</p>
          <p>Citofono/interno: {ordine.citofonoInterno || "-"}</p>
          <p>Note consegna: {ordine.noteRider || "-"}</p>
          {ordine.needsPos && <p>PORTARE POS</p>}
        </>
      )}
      <hr />
      {ordine.righe.map((riga) => (
        <div key={`print-row-${ordine.id}-${riga.id}`} style={{ marginBottom: 8 }}>
          <p>{riga.quantita}x {riga.nome} ({formatEuro(riga.basePrezzo)})</p>
          {riga.extra.length > 0 && <p>Extra: {riga.extra.join(", ")}</p>}
          {riga.ingredientiRimossi && riga.ingredientiRimossi.length > 0 && <p>Senza: {riga.ingredientiRimossi.join(", ")}</p>}
          {riga.note && <p>Note pizza: {riga.note}</p>}
        </div>
      ))}
      <hr />
      <p>Pagamento: {getPaymentMethodLabel(ordine.paymentMethod)}</p>
      <p>Stato pagamento: {getPaymentStatusLabel(ordine.paymentStatus)}</p>
      <p>{ordine.paymentStatus === "pagato" ? "Pagato" : "Da incassare"}</p>
      {ordine.paymentMethod === "card_at_pickup" && <p>POS in pizzeria</p>}
      {ordine.paymentMethod === "card_on_delivery" && <p>Portare POS</p>}
      {(ordine.paymentMethod === "cash_on_delivery" || ordine.paymentMethod === "cash_at_pickup") && <p>Contanti</p>}
      <hr />
      <p>Stampato il {formatItalianDate((ordine.printedAt || new Date().toISOString()).slice(0, 10))} alle {formatItalianTime(ordine.printedAt || new Date().toISOString())}</p>
      <div style={{ marginTop: 16, height: 50, borderTop: "1px dashed #333" }}>Note manuali:</div>
    </article>
  );
}
