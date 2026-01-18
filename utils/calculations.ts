
import { SimulationData, SimulationResults, Partner, Lot } from '../types';

export const INITIAL_STATE: SimulationData = {
  partenaires: [
    { id: '1', nom: 'Emprunteur 1', statut: 'prive', revenusNet: 2500 }
  ],
  revenusFonciersExistants: 0,
  chargesFoyer: 800,
  creditsExistants: 0,
  apportDisponible: 20000,
  
  lots: [
    { id: '1', nom: 'Lot estimé', surface: 40, usage: 'locatif_nu', loyerMensuel: 0 }
  ],
  contexteProjet: '',

  prixBien: 0,
  fraisAgence: 0,
  fraisNotairePercent: 7.5,
  taxeFonciere: 1000,
  taxeHabitation: 0,
  
  chargesLocatives: 50,
  vacanceLocative: 1, 
  
  dureeEmpruntAnnee: 20,
  tauxInteret: 3.8,
  tauxAssurance: 0.35,
  montantEmprunte: 0
};

export const calculateResults = (data: SimulationData): SimulationResults => {
  const revenusTravailTotal = data.partenaires.reduce((acc, p) => acc + p.revenusNet, 0);
  const revenusPatrimoineExistantPondere = data.revenusFonciersExistants * 0.7;
  const revenusFoyerTotal = revenusTravailTotal + revenusPatrimoineExistantPondere;

  const fraisNotaire = data.prixBien * (data.fraisNotairePercent / 100);
  const coutTotalProjet = data.prixBien + data.fraisAgence + fraisNotaire;
  const capitalEmprunte = data.montantEmprunte;

  const tauxMensuel = (data.tauxInteret / 100) / 12;
  const nombreMensualites = data.dureeEmpruntAnnee * 12;
  
  let mensualiteCredit = 0;
  if (tauxMensuel > 0 && capitalEmprunte > 0) {
    mensualiteCredit = capitalEmprunte * (tauxMensuel * Math.pow(1 + tauxMensuel, nombreMensualites)) / (Math.pow(1 + tauxMensuel, nombreMensualites) - 1);
  } else if (capitalEmprunte > 0) {
    mensualiteCredit = capitalEmprunte / nombreMensualites;
  }

  const mensualiteAssurance = (capitalEmprunte * (data.tauxAssurance / 100)) / 12;
  const mensualiteTotale = mensualiteCredit + mensualiteAssurance;

  let totalLoyerMensuelBrut = 0;
  let totalRevenuLocatifAnnuelReel = 0; 

  data.lots.forEach(lot => {
    if (lot.usage === 'locatif_nu' || lot.usage === 'locatif_meuble') {
        const loyer = lot.loyerMensuel || 0;
        totalLoyerMensuelBrut += loyer;
        totalRevenuLocatifAnnuelReel += (loyer * (12 - data.vacanceLocative / 100 * 12));
    } else if (lot.usage === 'saisonnier' || lot.usage === 'residence_secondaire') {
        const annuel = lot.revenuSaisonnierAnnuel || 0;
        totalLoyerMensuelBrut += (annuel / 12);
        totalRevenuLocatifAnnuelReel += annuel;
    } else if (lot.usage === 'commercial') {
        const loyer = lot.loyerMensuel || 0;
        totalLoyerMensuelBrut += loyer;
        totalRevenuLocatifAnnuelReel += (loyer * 12);
    }
  });

  const revenusLocatifsPonderes = (totalRevenuLocatifAnnuelReel / 12) * 0.7;
  const totalRevenusBancaires = revenusFoyerTotal + revenusLocatifsPonderes;
  
  // LOGIQUE BANCAIRE STRICTE : L'endettement ne concerne QUE les CRÉDITS (existants + nouveau)
  // On ignore data.chargesFoyer (Loyer) car ce n'est pas une dette bancaire.
  const dettesMensuellesActuelles = data.creditsExistants;
  const dettesMensuellesFutures = dettesMensuellesActuelles + mensualiteTotale;

  const tauxEndettementAvant = revenusFoyerTotal > 0 
    ? (dettesMensuellesActuelles / revenusFoyerTotal) * 100 
    : 0;

  const tauxEndettementApres = totalRevenusBancaires > 0 
    ? (dettesMensuellesFutures / totalRevenusBancaires) * 100 
    : 0;

  // RESTE À VIVRE : Ici on soustrait TOUT (Crédits + Loyer actuel)
  const resteAVivreMensuel = totalRevenusBancaires - (dettesMensuellesFutures + data.chargesFoyer);

  let cashflowMensuel = 0;
  let rentabiliteBrute = 0;
  let rentabiliteNette = 0;

  const isProjetLocatif = data.lots.some(l => ['locatif_nu', 'locatif_meuble', 'saisonnier', 'residence_secondaire', 'commercial'].includes(l.usage));

  if (isProjetLocatif && coutTotalProjet > 0) {
    const chargesAnnuelles = (data.chargesLocatives * 12) + data.taxeFonciere + data.taxeHabitation;
    const creditAnnuel = mensualiteTotale * 12;
    const cashflowAnnuel = totalRevenuLocatifAnnuelReel - chargesAnnuelles - creditAnnuel;
    cashflowMensuel = cashflowAnnuel / 12;
    rentabiliteBrute = ((totalLoyerMensuelBrut * 12) / coutTotalProjet) * 100;
    rentabiliteNette = ((totalRevenuLocatifAnnuelReel - chargesAnnuelles) / coutTotalProjet) * 100;
  }

  return {
    revenusFoyerTotal,
    revenusLocatifsPonderes,
    fraisNotaire,
    coutTotalProjet,
    mensualiteCredit,
    mensualiteAssurance,
    mensualiteTotale,
    cashflowMensuel,
    tauxEndettementAvant,
    tauxEndettementApres,
    rentabiliteBrute,
    rentabiliteNette,
    resteAVivreMensuel
  };
};
