
export type StatutPro = 'prive' | 'fonctionnaire' | 'gendarme' | 'independant' | 'retraite' | 'sans_emploi';
export type UsageLot = 'residence_principale' | 'locatif_nu' | 'locatif_meuble' | 'saisonnier' | 'residence_secondaire' | 'commercial';

export interface Partner {
  id: string;
  nom: string;
  statut: StatutPro;
  revenusNet: number; // Mensuel
}

export interface Lot {
  id: string;
  nom: string;
  surface: number;
  usage: UsageLot;
  loyerMensuel?: number;
  revenuSaisonnierAnnuel?: number; // Utilisable aussi pour résidence secondaire louée
}

export interface SimulationData {
  partenaires: Partner[];
  revenusFonciersExistants: number; 
  chargesFoyer: number; 
  creditsExistants: number;
  apportDisponible: number;

  lots: Lot[];
  contexteProjet: string; // NOUVEAU: Informations complémentaires
  
  prixBien: number;
  fraisAgence: number;
  fraisNotairePercent: number;
  taxeFonciere: number; 
  taxeHabitation: number;
  
  chargesLocatives: number;
  vacanceLocative: number;

  dureeEmpruntAnnee: number;
  tauxInteret: number;
  tauxAssurance: number;
  montantEmprunte: number;
}

export interface SimulationResults {
  revenusFoyerTotal: number;
  revenusLocatifsPonderes: number;
  fraisNotaire: number;
  coutTotalProjet: number;
  mensualiteCredit: number;
  mensualiteAssurance: number;
  mensualiteTotale: number;
  cashflowMensuel: number;
  tauxEndettementAvant: number;
  tauxEndettementApres: number;
  rentabiliteBrute: number;
  rentabiliteNette: number;
}
