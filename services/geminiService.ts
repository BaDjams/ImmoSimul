
import { GoogleGenAI } from "@google/genai";
import { SimulationData, SimulationResults } from "../types";

export const analyzeInvestment = async (data: SimulationData, results: SimulationResults): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Clé API manquante");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const partnersDesc = data.partenaires.map(p => 
    `- ${p.nom} (${p.statut.toUpperCase()}): ${p.revenusNet}€ net/mois`
  ).join('\n');

  let prompt = '';

  if (data.prixBien === 0) {
    // MODE STRATÉGIE / RECHERCHE
    prompt = `
      Agis en tant qu'expert en stratégie patrimoniale et courtier immobilier.
      L'utilisateur souhaite investir mais n'a pas encore défini de bien (Prix d'achat = 0). Il cherche à connaître sa capacité d'action.

      PROFIL FINANCIER :
      ${partnersDesc}
      - Revenus fonciers actuels: ${data.revenusFonciersExistants}€/mois
      - Charges/Crédits actuels: ${data.chargesFoyer}€/mois
      - Apport disponible: ${data.apportDisponible}€
      
      PARAMÈTRES DE MARCHÉ :
      - Durée emprunt envisagée: ${data.dureeEmpruntAnnee} ans
      - Taux estimé: ${data.tauxInteret}%
      
      CONTEXTE & OBJECTIFS :
      "${data.contexteProjet || 'Non spécifié'}"

      TA MISSION :
      1. **Capacité d'Emprunt Maximale** : Calcule l'enveloppe brute en respectant les 35% d'endettement.
      2. **Budget Cible (Projet)** : Déduis un budget d'achat cohérent (Capacité + Apport - Frais notaire/agence estimés).
      3. **Scénarios de Rentabilité** : Pour que ce projet soit financé, quel niveau de loyer la banque attendra-t-elle ? Donne un ratio Loyer/Mensualité crédible (ex: couverture de 70% ou cashflow positif requis ?).
      4. **Recommandation Stratégique** : Quel type de bien viser avec ce budget (T2 ville moyenne, immeuble de rapport, garage, etc.) ?

      Format Markdown, sois précis, chiffré et direct.
    `;
  } else {
    // MODE ANALYSE DE PROJET EXISTANT
    const lotsDesc = data.lots.map(l => {
        let rev = '';
        if (l.usage === 'locatif_nu' || l.usage === 'locatif_meuble' || l.usage === 'commercial') rev = `Loyer: ${l.loyerMensuel}€/mois`;
        if (l.usage === 'saisonnier' || l.usage === 'residence_secondaire') rev = `Revenu Est.: ${l.revenuSaisonnierAnnuel}€/an`;
        return `- ${l.nom} (${l.surface}m², ${l.usage}): ${rev}`;
      }).join('\n');
    
    prompt = `
        Agis en tant qu'expert en investissement immobilier senior. Analyse ce projet en France.

        PROFIL INVESTISSEUR(S) :
        ${partnersDesc}
        - Revenus fonciers existants (bruts): ${data.revenusFonciersExistants}€/mois
        - Apport: ${data.apportDisponible}€
        - Charges/Crédits actuels: ${data.chargesFoyer}€

        LE PROJET IMMOBILIER :
        - Prix achat: ${data.prixBien}€
        ${lotsDesc}
        - Emprunt: ${data.montantEmprunte}€ sur ${data.dureeEmpruntAnnee} ans
        
        INFORMATIONS COMPLÉMENTAIRES (CONTEXTE) :
        "${data.contexteProjet || 'Aucun contexte spécifié'}"

        RÉSULTATS FINANCIERS CALCULÉS :
        - Coût total projet: ${results.coutTotalProjet.toFixed(0)}€
        - Cashflow Mensuel Net: ${results.cashflowMensuel.toFixed(0)}€
        - Rentabilité Nette: ${results.rentabiliteNette.toFixed(2)}%
        - Taux d'endettement final: ${results.tauxEndettementApres.toFixed(2)}%

        MISSION :
        1. **Solidité du Dossier**: Analyse l'impact des statuts et du taux d'endettement.
        2. **Analyse du Contexte**: Commente les infos complémentaires (emplacement, garanties historiques sur factures, vision long terme). Est-ce réaliste ?
        3. **Stratégie & Risque**: Le cashflow est-il sain ?
        4. **Conseil Fiscal**: Suggère un régime (LMNP, SCI, etc.) selon le profil.

        Format Markdown, ton professionnel mais direct.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Impossible de générer l'analyse.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Une erreur est survenue lors de l'analyse IA.";
  }
};
