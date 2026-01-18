
import { useState, useEffect, useMemo } from 'react';
import { INITIAL_STATE, calculateResults } from './utils/calculations';
import { SimulationData, Partner, Lot, StatutPro, UsageLot } from './types';
import { InputGroup, SelectGroup, TextInputGroup, Tooltip } from './components/InputGroup';
import { CostDistributionChart, CashflowChart } from './components/Charts';
import { analyzeInvestment } from './services/geminiService';
import { Calculator, Building2, Landmark, Sparkles, Plus, Trash2, Users, MapPin, History, Lightbulb, TrendingUp, Wallet, ArrowRight, Home } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [data, setData] = useState<SimulationData>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'inputs' | 'analysis'>('inputs');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const results = useMemo(() => calculateResults(data), [data]);
  const isStrategyMode = data.prixBien === 0;

  useEffect(() => {
    const fraisNotaire = data.prixBien * (data.fraisNotairePercent / 100);
    const total = data.prixBien + data.fraisAgence + fraisNotaire;
    const computedLoan = Math.max(0, total - data.apportDisponible);
    
    setData(prev => {
        if (prev.montantEmprunte === computedLoan) return prev;
        return { ...prev, montantEmprunte: computedLoan };
    });
  }, [data.prixBien, data.fraisAgence, data.fraisNotairePercent, data.apportDisponible]);

  const updateField = (key: keyof SimulationData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const addPartner = () => {
    const newPartner: Partner = {
        id: Math.random().toString(36).substr(2, 9),
        nom: `Partenaire ${data.partenaires.length + 1}`,
        statut: 'prive',
        revenusNet: 2000
    };
    setData(prev => ({ ...prev, partenaires: [...prev.partenaires, newPartner] }));
  };

  const removePartner = (id: string) => {
    if (data.partenaires.length <= 1) return;
    setData(prev => ({ ...prev, partenaires: prev.partenaires.filter(p => p.id !== id) }));
  };

  const updatePartner = (id: string, field: keyof Partner, value: any) => {
    setData(prev => ({
        ...prev,
        partenaires: prev.partenaires.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addLot = () => {
    const newLot: Lot = {
        id: Math.random().toString(36).substr(2, 9),
        nom: `Lot ${data.lots.length + 1}`,
        surface: 20,
        usage: 'locatif_nu',
        loyerMensuel: 500
    };
    setData(prev => ({ ...prev, lots: [...prev.lots, newLot] }));
  };

  const removeLot = (id: string) => {
    if (data.lots.length <= 1) return;
    setData(prev => ({ ...prev, lots: prev.lots.filter(l => l.id !== id) }));
  };

  const updateLot = (id: string, field: keyof Lot, value: any) => {
    setData(prev => ({
        ...prev,
        lots: prev.lots.map(l => l.id === id ? { ...l, [field]: value } : l)
    }));
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeInvestment(data, results);
      setAiAnalysis(result);
      setActiveTab('analysis');
    } catch (e) {
        setAiAnalysis("Erreur lors de l'analyse. Vérifiez votre clé API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const StatCard = ({ label, value, subtext, color = "text-slate-900" }: { label: string, value: string, subtext?: string, color?: string }) => (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <Calculator className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">ImmoSimul Pro</h1>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('inputs')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'inputs' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Paramètres
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              disabled={!aiAnalysis}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'analysis' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 disabled:opacity-30'}`}
            >
              {isStrategyMode ? 'Stratégie IA' : 'Audit IA'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6 overflow-y-auto lg:max-h-[calc(100vh-10rem)] pr-2 custom-scrollbar">
            
            {/* --- SECTION INVESTISSEURS --- */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2 text-indigo-700">
                    <Users className="h-5 w-5" />
                    <h2 className="font-semibold text-lg">Situation Actuelle</h2>
                </div>
                <button onClick={addPartner} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100 flex items-center transition-colors">
                    <Plus className="h-3 w-3 mr-1" /> Partenaire
                </button>
              </div>
              
              {data.partenaires.map((p) => (
                  <div key={p.id} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-slate-800">{p.nom}</h3>
                          {data.partenaires.length > 1 && (
                              <button onClick={() => removePartner(p.id)} className="text-slate-400 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                              </button>
                          )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <SelectGroup label="Statut" value={p.statut} onChange={(v) => updatePartner(p.id, 'statut', v)} options={[{label: 'Privé', value: 'prive'}, {label: 'Public', value: 'fonctionnaire'}, {label: 'Indépendant', value: 'independant'}, {label: 'Retraité', value: 'retraite'}, {label: 'Sans emploi', value: 'sans_emploi'}]} />
                          <InputGroup label="Net / mois" value={p.revenusNet} onChange={(v) => updatePartner(p.id, 'revenusNet', v)} />
                      </div>
                  </div>
              ))}
              
              <div className="pt-2 border-t border-slate-100 mt-2">
                  <InputGroup 
                    label="Revenus Fonciers (actuels)" 
                    value={data.revenusFonciersExistants} 
                    onChange={(v) => updateField('revenusFonciersExistants', v)} 
                    tooltip="Loyers déjà perçus hors de ce projet."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup 
                        label="Charges RP (Loyer/Crédit)" 
                        value={data.chargesFoyer} 
                        onChange={(v) => updateField('chargesFoyer', v)}
                        tooltip="Mettez 0 si vous êtes logé à titre gratuit ou propriétaire sans crédit."
                    />
                    <InputGroup label="Autres Crédits" value={data.creditsExistants} onChange={(v) => updateField('creditsExistants', v)} />
                  </div>
                  <InputGroup label="Apport Disponible" value={data.apportDisponible} onChange={(v) => updateField('apportDisponible', v)} />
              </div>
            </section>

            {/* --- SECTION PROJET --- */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-2 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                    <h2 className="font-semibold text-lg">Le Projet</h2>
                 </div>
                 {!isStrategyMode && (
                   <button onClick={addLot} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 flex items-center transition-colors">
                      <Plus className="h-3 w-3 mr-1" /> Ajouter Lot
                   </button>
                 )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputGroup 
                    label="Prix d'achat" 
                    value={data.prixBien} 
                    onChange={(v) => updateField('prixBien', v)} 
                    tooltip="Laissez à 0 pour le Mode Stratégie."
                />
                <InputGroup label="Frais Agence" value={data.fraisAgence} onChange={(v) => updateField('fraisAgence', v)} />
                <InputGroup label="Notaire (%)" value={data.fraisNotairePercent} onChange={(v) => updateField('fraisNotairePercent', v)} unit="%" />
                <InputGroup label="Taxe Foncière/an" value={data.taxeFonciere} onChange={(v) => updateField('taxeFonciere', v)} />
              </div>
              
              {!isStrategyMode && (
                  <div className="mb-4 grid grid-cols-2 gap-4">
                     <InputGroup label="Charges Loc. /mois" value={data.chargesLocatives} onChange={(v) => updateField('chargesLocatives', v)} tooltip="Charges de copropriété non récupérables" />
                     <InputGroup label="Vacance Loc. (%)" value={data.vacanceLocative} onChange={(v) => updateField('vacanceLocative', v)} unit="%" tooltip="Mois sans locataire (ex: 8% = 1 mois/an)" />
                  </div>
              )}

              {!isStrategyMode ? (
                  data.lots.map((lot) => (
                    <div key={lot.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 relative group">
                      <button 
                        onClick={() => removeLot(lot.id)} 
                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer ce lot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <TextInputGroup 
                            label="Nom" 
                            value={lot.nom} 
                            onChange={(v) => updateLot(lot.id, 'nom', v)} 
                        />
                        <InputGroup 
                            label="Surface" 
                            value={lot.surface} 
                            onChange={(v) => updateLot(lot.id, 'surface', v)} 
                            unit="m²"
                        />
                      </div>
                      
                      <SelectGroup
                        label="Type d'usage"
                        value={lot.usage}
                        onChange={(v) => updateLot(lot.id, 'usage', v)}
                        options={[
                            { label: 'Location Nue', value: 'locatif_nu' },
                            { label: 'Location Meublée', value: 'locatif_meuble' },
                            { label: 'Saisonnier', value: 'saisonnier' },
                            { label: 'Local Commercial', value: 'commercial' },
                            { label: 'Résidence Principale', value: 'residence_principale' },
                            { label: 'Résidence Secondaire', value: 'residence_secondaire' },
                        ]}
                      />
                      
                      {lot.usage !== 'residence_principale' && (
                        <InputGroup 
                            label={lot.usage === 'saisonnier' ? "Revenus Annuels Est." : "Loyer Mensuel CC"} 
                            value={lot.usage === 'saisonnier' ? (lot.revenuSaisonnierAnnuel || 0) : (lot.loyerMensuel || 0)} 
                            onChange={(v) => updateLot(lot.id, lot.usage === 'saisonnier' ? 'revenuSaisonnierAnnuel' : 'loyerMensuel', v)} 
                        />
                      )}
                    </div>
                  ))
              ) : (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-4 text-xs text-emerald-800 flex items-start">
                    <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                    Définissez les loyers potentiels dans le champ "Contexte" ou laissez l'IA vous suggérer des valeurs cibles.
                  </div>
              )}

              <div className="mt-4">
                <label className="flex items-center text-sm font-bold text-slate-800 mb-2">
                  <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                  Contexte & Stratégie
                </label>
                <textarea
                  value={data.contexteProjet}
                  onChange={(e) => updateField('contexteProjet', e.target.value)}
                  placeholder={isStrategyMode ? "Ex: Je cherche dans une ville moyenne, j'aimerais faire de la colocation..." : "Ex: Revenus garantis sur facture, zone à forte tension locative, travaux prévus..."}
                  className="w-full h-24 p-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </section>

            {/* --- SECTION FINANCEMENT --- */}
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center space-x-2 text-amber-700 mb-4">
                  <Landmark className="h-5 w-5" />
                  <h2 className="font-semibold text-lg">Financement</h2>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Durée" value={data.dureeEmpruntAnnee} onChange={(v) => updateField('dureeEmpruntAnnee', v)} unit="ans" />
                  <InputGroup label="Taux Crédit" value={data.tauxInteret} onChange={(v) => updateField('tauxInteret', v)} unit="%" />
                  <InputGroup label="Taux Assurance" value={data.tauxAssurance} onChange={(v) => updateField('tauxAssurance', v)} unit="%" />
               </div>
               <button 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                >
                  {isAnalyzing ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                        <Sparkles className="h-5 w-5" />
                        <span>{isStrategyMode ? "Définir ma Stratégie" : "Lancer l'Audit Projet"}</span>
                    </>
                  )}
                </button>
            </section>
          </div>

          <div className="lg:col-span-7">
            {activeTab === 'inputs' ? (
                isStrategyMode ? (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center h-full flex flex-col items-center justify-center min-h-[400px]">
                       <div className="bg-indigo-100 p-6 rounded-full mb-6">
                          <Sparkles className="h-10 w-10 text-indigo-600" />
                       </div>
                       <h3 className="text-2xl font-bold text-slate-900 mb-3">Mode Stratégie Activé</h3>
                       <p className="text-slate-500 max-w-lg mx-auto mb-8 text-lg">
                         Le prix d'achat est à zéro. L'assistant IA va analyser vos revenus et votre apport pour définir votre profil d'investisseur.
                       </p>
                       <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left w-full max-w-md">
                           <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 border-b border-slate-200 pb-2">Ce que l'IA va calculer :</h4>
                           <ul className="space-y-3">
                              <li className="flex items-center text-slate-700">
                                  <ArrowRight className="h-5 w-5 mr-3 text-indigo-500" />
                                  <span>Votre capacité d'emprunt maximale</span>
                              </li>
                              <li className="flex items-center text-slate-700">
                                  <ArrowRight className="h-5 w-5 mr-3 text-indigo-500" />
                                  <span>Le budget cible cohérent (Prix + Travaux)</span>
                              </li>
                              <li className="flex items-center text-slate-700">
                                  <ArrowRight className="h-5 w-5 mr-3 text-indigo-500" />
                                  <span>Les valeurs locatives attendues par la banque</span>
                              </li>
                           </ul>
                       </div>
                       <p className="text-indigo-600 font-medium mt-8 animate-pulse">Cliquez sur "Définir ma Stratégie" pour commencer.</p>
                    </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <StatCard label="Rentabilité Nette" value={`${results.rentabiliteNette.toFixed(2)} %`} color="text-emerald-600" />
                      <StatCard label="Cashflow Mensuel" value={`${results.cashflowMensuel.toFixed(0)} €`} color={results.cashflowMensuel >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                      <StatCard label="Endettement" value={`${results.tauxEndettementApres.toFixed(1)} %`} color={results.tauxEndettementApres > 35 ? 'text-rose-600' : 'text-slate-900'} />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                        Visualisation Financière
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CostDistributionChart 
                          prix={data.prixBien} 
                          fraisAgence={data.fraisAgence} 
                          fraisNotaire={results.fraisNotaire} 
                        />
                        <CashflowChart 
                          revenus={results.revenusLocatifsPonderes / 0.7} 
                          credit={results.mensualiteTotale} 
                          charges={data.chargesLocatives + (data.taxeFonciere / 12)} 
                        />
                      </div>
                    </div>

                    <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <h4 className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Capacité de Financement</h4>
                          <p className="text-3xl font-bold mt-2">{data.montantEmprunte.toLocaleString()} €</p>
                          <p className="text-indigo-300 text-sm mt-1">Mensualité totale : {results.mensualiteTotale.toFixed(2)} €</p>
                        </div>
                        <Wallet className="h-12 w-12 text-indigo-400 opacity-50" />
                      </div>
                      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-indigo-500 rounded-full blur-3xl opacity-20" />
                    </div>
                  </div>
                )
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-indigo-600">
                      <Sparkles className="h-6 w-6" />
                      <h2 className="text-xl font-bold">{isStrategyMode ? "Votre Stratégie Personnalisée" : "Audit Expert Gemini"}</h2>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">Analyse temps réel</span>
                  </div>
                </div>
                <div className="p-8 prose prose-slate max-w-none prose-headings:text-slate-900 prose-strong:text-indigo-700 overflow-y-auto">
                  {aiAnalysis ? (
                    <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <div className="animate-pulse bg-slate-200 h-4 w-48 mb-4 rounded" />
                      <div className="animate-pulse bg-slate-200 h-4 w-64 mb-4 rounded" />
                      <p>Génération de l'analyse en cours...</p>
                    </div>
                  )}
                </div>
                {aiAnalysis && (
                  <div className="p-4 bg-amber-50 border-t border-amber-100 rounded-b-xl flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Note :</strong> Cette analyse est fournie par une IA à titre indicatif. Consultez toujours un conseiller financier ou un courtier avant de vous engager.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
