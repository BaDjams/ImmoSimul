
import { GoogleGenAI } from "@google/genai";
import { SimulationData, SimulationResults } from "../types";

export const analyzeInvestment = async (data: SimulationData, results: SimulationResults): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Clé API manquante");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const partnersDesc = data.partenaires.map(p => 
    `- ${p.nom} (Statut: ${p.statut.toUpperCase()}): ${p.revenusNet} € net mensuel`
  ).join('\n');

  const commonInstructions = `
    TON ET STYLE :
    - Utilisez exclusivement le vouvoiement.
    - Adoptez un ton formel, institutionnel, analytique et neutre.
    - Bannissez tout langage sensationnaliste, commercial ou informel ("ultra rentable", "pépite", "super affaire", "tu", "ton").
    - Employez un lexique financier et immobilier précis : ratio de couverture de dette, LTV, vacance locative, pression fiscale, solvabilité, capacité d'autofinancement.
    - Structurez votre réponse avec des titres clairs.
  `;

  let prompt = '';

  if (data.prixBien === 0) {
    prompt = `
      ${commonInstructions}
      CONTEXTE : Cabinet de conseil en stratégie patrimoniale. Étude de faisabilité pour un investisseur sans bien cible défini.

      DONNÉES FINANCIÈRES :
      ${partnersDesc}
      - Revenus fonciers existants: ${data.revenusFonciersExistants} €/mois
      - Loyer actuel (charge de vie): ${data.chargesFoyer} €/mois
      - Crédits en cours (engagements bancaires): ${data.creditsExistants} €/mois
      - Apport disponible: ${data.apportDisponible} €
      - Paramètres de financement envisagés: ${data.dureeEmpruntAnnee} ans à ${data.tauxInteret} %

      VOTRE MISSION :
      1. Déterminer l'enveloppe d'investissement maximale théorique en respectant le critère prudentiel de 35% d'endettement (basé sur les crédits).
      2. Établir une stratégie d'acquisition cohérente avec le profil de l'investisseur.
      3. Préciser les exigences bancaires prévisibles au regard de la situation financière décrite.
    `;
  } else {
    const lotsDesc = data.lots.map(l => {
        let rev = '';
        if (l.usage === 'locatif_nu' || l.usage === 'locatif_meuble' || l.usage === 'commercial') rev = `Loyer: ${l.loyerMensuel} €/mois`;
        if (l.usage === 'saisonnier' || l.usage === 'residence_secondaire') rev = `Revenu Est.: ${l.revenuSaisonnierAnnuel} €/an`;
        return `- ${l.nom} (${l.surface} m², usage: ${l.usage}): ${rev}`;
      }).join('\n');
    
    prompt = `
        ${commonInstructions}
        CONTEXTE : Note de synthèse d'analyse de risque destinée à un comité d'engagement bancaire.

        PROFIL DES EMPRUNTEURS :
        ${partnersDesc}
        - Solvabilité actuelle : Engagements de crédits de ${data.creditsExistants} € pour un revenu foyer de ${results.revenusFoyerTotal} €.
        - Reste à vivre actuel : ${results.resteAVivreMensuel + results.mensualiteTotale} € (avant nouvelle opération).

        DÉTAILS DE L'OPÉRATION IMMOBILIÈRE :
        - Coût d'acquisition consolidé : ${results.coutTotalProjet.toFixed(0)} €
        - Montant du financement sollicité : ${data.montantEmprunte} € sur ${data.dureeEmpruntAnnee} ans.
        ${lotsDesc}
        
        INDICATEURS DE SYNTHÈSE :
        - Taux d'endettement projeté : ${results.tauxEndettementApres.toFixed(2)} % (Référentiel HCSF : 35%).
        - Reste à vivre projeté : ${results.resteAVivreMensuel.toFixed(0)} €.
        - Rendement net estimé : ${results.rentabiliteNette.toFixed(2)} %.

        VOTRE ANALYSE :
        1. Évaluation de la viabilité du montage financier et conformité aux ratios bancaires usuels.
        2. Analyse de la pérennité du modèle locatif présenté.
        3. Recommandations stratégiques sur l'optimisation fiscale ou structurelle de l'opération.
        4. Conclusion synthétique sur la faisabilité de l'engagement bancaire.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analyse indisponible.";
  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Erreur lors de la génération de la note de synthèse.";
  }
};
