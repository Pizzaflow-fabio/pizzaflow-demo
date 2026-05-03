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
type SlotFiltro = "tutti" | "disponibili" | "quasi-pieni" | "pieni";
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
};

type Cliente = {
  id: string;
  nome: string;
  telefono: string;
  ordiniTotali: number;
  ultimoOrdineGiorniFa: number;
  preferenzaWeekend: boolean;
};

const EXTRA_PREZZO = 1.5;
const ORARI_PIZZERIA = {
  openingTime: "18:30",
  closingTime: "22:30",
  slotIntervalMinutes: 15,
  maxOrdiniPerSlot: 8,
  maxPizzePerSlot: 25,
} as const;

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
  { id: "c1", nome: "Giulia B.", telefono: "333 1002001", ordiniTotali: 18, ultimoOrdineGiorniFa: 2, preferenzaWeekend: true },
  { id: "c2", nome: "Luca P.", telefono: "333 1002002", ordiniTotali: 4, ultimoOrdineGiorniFa: 26, preferenzaWeekend: false },
  { id: "c3", nome: "Marta R.", telefono: "333 1002003", ordiniTotali: 12, ultimoOrdineGiorniFa: 8, preferenzaWeekend: true },
  { id: "c4", nome: "Davide F.", telefono: "333 1002004", ordiniTotali: 1, ultimoOrdineGiorniFa: 3, preferenzaWeekend: false },
];

const ORDINI_INIZIALI: Ordine[] = [
  {
    id: "PF-2041",
    clienteId: "c1",
    clienteNome: "Giulia B.",
    orderDate: "2026-05-03",
    createdAt: "2026-05-03T18:12:00",
    dataISO: new Date().toISOString(),
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
  },
  {
    id: "PF-2042",
    clienteId: "c3",
    clienteNome: "Marta R.",
    orderDate: "2026-05-03",
    createdAt: "2026-05-03T18:26:00",
    dataISO: new Date().toISOString(),
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
  },
  {
    id: "PF-2043",
    clienteId: "c2",
    clienteNome: "Luca P.",
    orderDate: "2026-05-03",
    createdAt: "2026-05-03T18:35:00",
    dataISO: new Date().toISOString(),
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
  },
  {
    id: "PF-2044",
    clienteId: "c4",
    clienteNome: "Davide F.",
    orderDate: "2026-05-03",
    createdAt: "2026-05-03T18:40:00",
    dataISO: new Date().toISOString(),
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
  },
  {
    id: "PF-2045",
    clienteId: "c1",
    clienteNome: "Giulia B.",
    orderDate: "2026-05-03",
    createdAt: "2026-05-03T18:50:00",
    dataISO: new Date().toISOString(),
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
  },
  {
    id: "PF-2046",
    clienteId: "c3",
    clienteNome: "Marta R.",
    orderDate: "2026-05-03",
    createdAt: "2026-05-03T18:55:00",
    dataISO: new Date().toISOString(),
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
  },
];

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
  pizzePrenotate: number
): SlotStato {
  const residualOrders = ORARI_PIZZERIA.maxOrdiniPerSlot - ordiniPrenotati;
  const residualPizzas = ORARI_PIZZERIA.maxPizzePerSlot - pizzePrenotate;
  if (residualOrders <= 0 || residualPizzas <= 0) return "pieno";
  if (
    residualOrders / ORARI_PIZZERIA.maxOrdiniPerSlot < 0.3 ||
    residualPizzas / ORARI_PIZZERIA.maxPizzePerSlot < 0.3
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
  const [ordini, setOrdini] = useState<Ordine[]>(ORDINI_INIZIALI);
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

  const totaleCarrello = useMemo(
    () =>
      carrello.reduce(
        (acc, item) => acc + (item.basePrezzo + item.extra.length * EXTRA_PREZZO) * item.quantita,
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

  const ordiniOggi = useMemo(() => ordini.filter((o) => new Date(o.dataISO).toDateString() === new Date().toDateString()), [ordini]);
  const fatturatoDemo = useMemo(() => ordiniOggi.reduce((acc, o) => acc + o.totaleFinale, 0), [ordiniOggi]);
  const incassoOnlineSimulato = useMemo(
    () =>
      ordiniOggi
        .filter((o) => o.paymentStatus === "pagato" && isOnlinePaymentMethod(o.paymentMethod))
        .reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOggi]
  );
  const incassoContantiDaRiscuotere = useMemo(
    () =>
      ordiniOggi
        .filter(
          (o) =>
            o.paymentStatus === "da pagare" &&
            (o.paymentMethod === "cash_on_delivery" || o.paymentMethod === "cash_at_pickup")
        )
        .reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOggi]
  );
  const incassoPosDaRiscuotere = useMemo(
    () =>
      ordiniOggi
        .filter(
          (o) =>
            o.paymentStatus === "da pagare" &&
            (o.paymentMethod === "card_on_delivery" || o.paymentMethod === "card_at_pickup")
        )
        .reduce((acc, o) => acc + o.totaleFinale, 0),
    [ordiniOggi]
  );
  const ordiniCheRichiedonoPos = useMemo(
    () => ordiniOggi.filter((o) => o.needsPos && o.paymentStatus === "da pagare").length,
    [ordiniOggi]
  );
  const scontrinoMedio = ordiniOggi.length ? fatturatoDemo / ordiniOggi.length : 0;
  const clientiAttivi = CLIENTI_DEMO.filter((c) => c.ultimoOrdineGiorniFa <= 30).length;
  const ordiniAttiviCount = ordiniOggi.filter((o) => {
    const finalState = o.tipoOrdine === "ritiro" ? "ritirato" : "consegnato";
    return o.stato !== finalState;
  }).length;
  const ordiniFiltratiAdmin = useMemo(() => {
    if (adminFiltro === "tutti") return ordiniOggi;
    return ordiniOggi.filter((o) => o.tipoOrdine === adminFiltro);
  }, [adminFiltro, ordiniOggi]);
  const ordiniAttiviPerSlot = useMemo(
    () =>
      ordiniOggi.filter(
        (o) =>
          !["ritirato", "consegnato", "completato", "annullato"].includes(o.stato)
      ),
    [ordiniOggi]
  );
  const slotCapacity = useMemo(() => {
    return generaSlotOrari().map((slot) => {
      const ordiniSlot = ordiniAttiviPerSlot.filter((o) => o.orarioScelto === slot);
      const ordiniPrenotati = ordiniSlot.length;
      const pizzePrenotate = ordiniSlot.reduce(
        (acc, ordine) =>
          acc +
          ordine.righe.reduce((sum, riga) => sum + riga.quantita, 0),
        0
      );
      const residualOrders = ORARI_PIZZERIA.maxOrdiniPerSlot - ordiniPrenotati;
      const residualPizzas = ORARI_PIZZERIA.maxPizzePerSlot - pizzePrenotate;
      const stato = getSlotStatus(ordiniPrenotati, pizzePrenotate);
      const full = stato === "pieno";
      const nonDisponibilePerOrdine =
        !full && (residualOrders < 1 || residualPizzas < Math.max(pizzeNelCarrello, 1));
      const selezionabile = !full && !nonDisponibilePerOrdine;
      return {
        slot,
        ordiniPrenotati,
        pizzePrenotate,
        residualOrders,
        residualPizzas,
        stato,
        full,
        nonDisponibilePerOrdine,
        selezionabile,
      };
    });
  }, [ordiniAttiviPerSlot, pizzeNelCarrello]);
  const slotSummary = useMemo(
    () => ({
      disponibili: slotCapacity.filter((s) => s.stato === "disponibile").length,
      quasiPieni: slotCapacity.filter((s) => s.stato === "quasi pieno").length,
      pieni: slotCapacity.filter((s) => s.stato === "pieno").length,
    }),
    [slotCapacity]
  );
  const slotCapacityFiltered = useMemo(() => {
    if (slotFiltro === "tutti") return slotCapacity;
    if (slotFiltro === "disponibili") return slotCapacity.filter((s) => s.stato === "disponibile");
    if (slotFiltro === "quasi-pieni") return slotCapacity.filter((s) => s.stato === "quasi pieno");
    return slotCapacity.filter((s) => s.stato === "pieno");
  }, [slotCapacity, slotFiltro]);
  const selectedSlotInfo = useMemo(
    () => slotCapacity.find((s) => s.slot === orarioScelto),
    [orarioScelto, slotCapacity]
  );
  const canShowPaymentSection =
    tipoOrdine === "ritiro"
      ? Boolean(orarioScelto && selectedSlotInfo?.selezionabile)
      : Boolean(indirizzoConsegnaSelezionato && orarioScelto && selectedSlotInfo?.selezionabile);

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
    };
    setOrdini((prev) => [nuovoOrdine, ...prev]);
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
    setOrdini((prev) =>
      prev.map((ordine) => {
        if (ordine.id !== ordineId) return ordine;
        const pipeline = getPipelineByTipo(ordine.tipoOrdine);
        const currentIndex = pipeline.indexOf(ordine.stato);
        if (currentIndex === -1 || currentIndex >= pipeline.length - 1) return ordine;
        return { ...ordine, stato: pipeline[currentIndex + 1] };
      })
    );
  }

  function avanzaTuttiOrdiniAttivi() {
    setOrdini((prev) =>
      prev.map((ordine) => {
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

  useEffect(() => {
    if (!menuAddToast) return;
    const timeout = window.setTimeout(() => setMenuAddToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [menuAddToast]);

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
          "Lo slot scelto non è più disponibile per il numero di pizze nel carrello."
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
                          {formatEuro((item.basePrezzo + item.extra.length * EXTRA_PREZZO) * item.quantita)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-[#82513a]">
                        Prezzo unitario: {formatEuro(item.basePrezzo + item.extra.length * EXTRA_PREZZO)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#6d4331]">
                        Totale: {formatEuro((item.basePrezzo + item.extra.length * EXTRA_PREZZO) * item.quantita)}
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
                                ? "Pieno"
                                : slot.nonDisponibilePerOrdine
                                  ? "Non disponibile per questo ordine"
                                  : slot.stato === "quasi pieno"
                                    ? "Quasi pieno"
                                    : "Disponibile"}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-[#6d4331]">
                            Posti residui: {Math.max(slot.residualPizzas, 0)} pizze
                          </p>
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
                  {ordini.map((ordine) => (
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
                            const prezzoUnitario = riga.basePrezzo + riga.extra.length * EXTRA_PREZZO;
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
              <div className="grid grid-cols-2 gap-3">
                <MetricCard titolo="Ordini oggi" valore={String(ordiniOggi.length)} />
                <MetricCard titolo="Fatturato demo" valore={formatEuro(fatturatoDemo)} />
                <MetricCard titolo="Clienti attivi" valore={String(clientiAttivi)} />
                <MetricCard titolo="Scontrino medio" valore={formatEuro(scontrinoMedio)} />
                <MetricCard titolo="Incasso online simulato" valore={formatEuro(incassoOnlineSimulato)} />
                <MetricCard titolo="Da riscuotere (contanti)" valore={formatEuro(incassoContantiDaRiscuotere)} />
                <MetricCard titolo="Da riscuotere (POS)" valore={formatEuro(incassoPosDaRiscuotere)} />
                <MetricCard titolo="Ordini con POS" valore={String(ordiniCheRichiedonoPos)} />
              </div>

              <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                <h2 className="font-semibold">Impostazioni orari</h2>
                <div className="mt-2 space-y-1 text-sm text-[#6d4331]">
                  <p>Apertura: {ORARI_PIZZERIA.openingTime}</p>
                  <p>Chiusura: {ORARI_PIZZERIA.closingTime}</p>
                  <p>Intervallo slot: {ORARI_PIZZERIA.slotIntervalMinutes} minuti</p>
                  <p>Massimo ordini per slot demo: {ORARI_PIZZERIA.maxOrdiniPerSlot}</p>
                  <p>Massimo pizze per slot demo: {ORARI_PIZZERIA.maxPizzePerSlot}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                <h2 className="font-semibold">Capacità slot di oggi</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-[#fff7f0] p-2 text-xs">
                  <p className="rounded-lg bg-white p-2 text-center">
                    Disponibili: <span className="font-semibold">{slotSummary.disponibili}</span>
                  </p>
                  <p className="rounded-lg bg-white p-2 text-center">
                    Quasi pieni: <span className="font-semibold">{slotSummary.quasiPieni}</span>
                  </p>
                  <p className="rounded-lg bg-white p-2 text-center">
                    Pieni: <span className="font-semibold">{slotSummary.pieni}</span>
                  </p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#f0d7c7] bg-[#fffaf6] p-1">
                  <button
                    onClick={() => setSlotFiltro("tutti")}
                    className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => setSlotFiltro("disponibili")}
                    className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "disponibili" ? "bg-emerald-100 text-emerald-800" : "text-[#82513a]"}`}
                  >
                    Solo disponibili
                  </button>
                  <button
                    onClick={() => setSlotFiltro("quasi-pieni")}
                    className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "quasi-pieni" ? "bg-amber-100 text-amber-800" : "text-[#82513a]"}`}
                  >
                    Solo quasi pieni
                  </button>
                  <button
                    onClick={() => setSlotFiltro("pieni")}
                    className={`rounded-lg py-2 text-xs font-semibold ${slotFiltro === "pieni" ? "bg-red-100 text-red-800" : "text-[#82513a]"}`}
                  >
                    Solo pieni
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {slotCapacityFiltered.map((slot) => (
                    <div
                      key={`cap-${slot.slot}`}
                      className={`rounded-xl border p-3 text-xs ${
                        slot.stato === "pieno"
                          ? "border-red-300 bg-red-50"
                          : slot.stato === "quasi pieno"
                            ? "border-amber-300 bg-amber-50"
                            : "border-[#ecd7c8] bg-[#fffaf6]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{slot.slot}</p>
                        <p className="font-semibold">
                          {slot.stato === "pieno"
                            ? "Pieno"
                            : slot.stato === "quasi pieno"
                              ? "Quasi pieno"
                              : "Disponibile"}
                        </p>
                      </div>
                      <p>Ordini: {slot.ordiniPrenotati}/{ORARI_PIZZERIA.maxOrdiniPerSlot}</p>
                      <p>Pizze: {slot.pizzePrenotate}/{ORARI_PIZZERIA.maxPizzePerSlot}</p>
                    </div>
                  ))}
                  {slotCapacityFiltered.length === 0 && (
                    <p className="rounded-xl bg-[#fff7f0] p-3 text-xs text-[#82513a]">
                      Nessuno slot per il filtro selezionato.
                    </p>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#9a715c]">Ordini di oggi - Kanban operativo</h2>
                <button onClick={avanzaTuttiOrdiniAttivi} className="w-full rounded-xl border border-[#d59e7d] bg-white px-4 py-3 text-sm font-semibold text-[#8f3b18]">
                  Avanza tutti gli ordini attivi ({ordiniAttiviCount})
                </button>
                <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#f0d7c7] bg-white p-1">
                  <button
                    onClick={() => setAdminFiltro("tutti")}
                    className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "tutti" ? "bg-[#f4dfd0] text-[#8f3b18]" : "text-[#82513a]"}`}
                  >
                    Tutti
                  </button>
                  <button
                    onClick={() => setAdminFiltro("ritiro")}
                    className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "ritiro" ? "bg-amber-100 text-amber-800" : "text-[#82513a]"}`}
                  >
                    Solo ritiro
                  </button>
                  <button
                    onClick={() => setAdminFiltro("consegna")}
                    className={`rounded-xl py-2 text-xs font-semibold ${adminFiltro === "consegna" ? "bg-sky-100 text-sky-800" : "text-[#82513a]"}`}
                  >
                    Solo consegna
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1">
                  {KANBAN_COLUMNS.map((column) => {
                    const ordiniColonna = ordiniFiltratiAdmin.filter(
                      (ordine) => getKanbanColumn(ordine.stato) === column.key
                    );
                    return (
                      <div key={column.key} className="w-[16.5rem] shrink-0 rounded-2xl border border-[#f0d7c7] bg-[#fff7f0] p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-[#8f3b18]">{column.titolo}</h3>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#82513a]">
                            {ordiniColonna.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {ordiniColonna.length === 0 && (
                            <p className="rounded-xl bg-white p-3 text-xs text-[#9a715c]">
                              Nessun ordine
                            </p>
                          )}
                          {ordiniColonna.map((ordine) => {
                            const highlightPos =
                              ordine.tipoOrdine === "consegna" &&
                              ordine.paymentMethod === "card_on_delivery" &&
                              ordine.paymentStatus === "da pagare";
                            return (
                            <article
                              key={ordine.id}
                              className={`rounded-xl border bg-white p-3 ${
                                highlightPos
                                  ? "border-amber-500 ring-2 ring-amber-400"
                                  : "border-[#ecd7c8]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">{ordine.id}</p>
                                <p className="text-xs font-semibold">{formatEuro(ordine.totaleFinale)}</p>
                              </div>
                              <p className="mt-1 text-[10px] text-[#6d4331]">
                                Data ordine: {formatItalianDate(ordine.orderDate)}
                              </p>
                              <p className="text-[10px] text-[#6d4331]">
                                Ora inserimento: {formatItalianTime(ordine.createdAt)}
                              </p>
                              <p className="mt-1 text-xs text-[#82513a]">Cliente: {ordine.clienteNome}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${ordine.tipoOrdine === "ritiro" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}`}>
                                  {ordine.tipoOrdine === "ritiro" ? "RITIRO" : "CONSEGNA"}
                                </span>
                                <span className="text-[10px] text-[#82513a]">Orario richiesto: {ordine.orarioScelto}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {ordine.paymentStatus === "pagato" && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    PAGATO
                                  </span>
                                )}
                                {ordine.paymentStatus === "da pagare" && (
                                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                                    DA INCASSARE
                                  </span>
                                )}
                                {ordine.needsPos && ordine.paymentStatus === "da pagare" && (
                                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                                    PORTARE POS
                                  </span>
                                )}
                                {ordine.paymentMethod === "cash_on_delivery" && ordine.paymentStatus === "da pagare" && (
                                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-stone-800">
                                    CONTANTI
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-[10px] text-[#6d4331]">
                                Pagamento: {getPaymentMethodLabel(ordine.paymentMethod)} - {getPaymentStatusLabel(ordine.paymentStatus)}
                              </p>
                              <p className="mt-1 text-[10px] text-[#6d4331]">Ricevuto alle {formatItalianTime(ordine.createdAt)}</p>
                              {ordine.tipoOrdine === "consegna" && ordine.indirizzo && (
                                <>
                                  <p className="mt-1 text-[10px] text-[#6d4331]">
                                    Indirizzo: {ordine.indirizzo}
                                    {ordine.origineIndirizzo === "nuovo" ? " (nuovo indirizzo)" : ""}
                                  </p>
                                  <p className="mt-1 text-[10px] text-[#6d4331]">Telefono: {ordine.telefonoCliente}</p>
                                  <p className="mt-1 text-[10px] text-[#6d4331]">Note consegna: {ordine.noteRider || "-"}</p>
                                </>
                              )}
                              <p className="mt-1 text-[10px] text-[#6d4331]">
                                Stato attuale: <span className="font-semibold">{ordine.stato}</span>
                              </p>
                              <button
                                onClick={() => avanzaStatoOrdine(ordine.id)}
                                disabled={ordine.stato === (ordine.tipoOrdine === "ritiro" ? "ritirato" : "consegnato")}
                                className="mt-2 w-full rounded-lg bg-[#8f3b18] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Avanza stato
                              </button>
                            </article>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                <h2 className="font-semibold">Clienti demo</h2>
                <div className="mt-2 space-y-2 text-sm">
                  {CLIENTI_DEMO.map((cliente) => (
                    <p key={cliente.id}>{cliente.nome} - {cliente.telefono}</p>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-[#f0d7c7] bg-white p-4">
                <h2 className="font-semibold">Marketing intelligente</h2>
                <div className="mt-3 space-y-2 text-sm text-[#6d4331]">
                  <p>Migliori clienti: {CLIENTI_DEMO.filter((c) => c.ordiniTotali >= 10).map((c) => c.nome).join(", ")}</p>
                  <p>Clienti dormienti: {CLIENTI_DEMO.filter((c) => c.ultimoOrdineGiorniFa > 20).map((c) => c.nome).join(", ")}</p>
                  <p>Clienti del weekend: {CLIENTI_DEMO.filter((c) => c.preferenzaWeekend).map((c) => c.nome).join(", ")}</p>
                  <p>Clienti da secondo ordine: {CLIENTI_DEMO.filter((c) => c.ordiniTotali === 1).map((c) => c.nome).join(", ")}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-[#e9d7c9] bg-[#fff7f0] p-4 text-sm text-[#6d4331]">
                <h2 className="font-semibold">Demo automazione</h2>
                <p className="mt-2">
                  Nella versione reale gli stati possono avanzare manualmente, oppure in automatico in base all&apos;orario di
                  ritiro/consegna e ai tempi medi di preparazione.
                </p>
              </section>
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
                    {extra}
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
