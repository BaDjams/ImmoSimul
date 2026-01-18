
import { useState, useEffect, useMemo, useRef } from 'react';
import { INITIAL_STATE, calculateResults } from './utils/calculations';
import { SimulationData, Partner, Lot, StatutPro, UsageLot, SimulationResults } from './types';
import { InputGroup, SelectGroup, TextInputGroup, Tooltip } from './components/InputGroup';
import { CostDistributionChart, CashflowChart } from './components/Charts';
import { analyzeInvestment } from './services/geminiService';
import { 
  Calculator, Building2, Landmark, Sparkles, Plus, Trash2, 
  Users, MapPin, History, Lightbulb, TrendingUp, Wallet, 
  ArrowRight, Home, Download, FileText, CheckCircle2, ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const [data, setData] = useState<SimulationData>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'inputs' | 'analysis'>('inputs');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const page1Ref = useRef<HTMLDivElement>(null);
  const auditContainerRef = useRef<HTMLDivElement>(null);
  
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
        setAiAnalysis("Erreur lors de la génération de l'audit financier.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportPDF = async () => {
    if (!page1Ref.current || !auditContainerRef.current) return;
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const footerHeight = 20; // 2cm
      const headerHeight = 25; // 2.5cm pour un header lisible
      const dateStr = new Date().toLocaleDateString('fr-FR');

      const addFooter = (pNum: number) => {
        pdf.setFillColor(248, 250, 252); // slate-50
        pdf.rect(0, pdfHeight - footerHeight, pdfWidth, footerHeight, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139); // slate-500
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Document généré le ${dateStr} - Page ${pNum}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
        pdf.setFontSize(7);
        pdf.text("Note : Simulation à caractère informatif. Le loyer du foyer n'est pas une dette bancaire selon les normes HCSF.", pdfWidth / 2, pdfHeight - 6, { align: 'center' });
      };

      const addHeader = (title: string, sub: string) => {
        pdf.setFillColor(15, 23, 42); // slate-900
        pdf.rect(0, 0, pdfWidth, headerHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(title.toUpperCase(), 12, 12);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(129, 140, 248); // indigo-400
        pdf.text(sub, 12, 18);
      };

      // PAGE 1 : Tableau de bord
      const canvas1 = await html2canvas(page1Ref.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const img1 = canvas1.toDataURL('image/png');
      pdf.addImage(img1, 'PNG', 0, 0, pdfWidth, (canvas1.height * pdfWidth) / canvas1.width);
      addFooter(1);

      // PAGE 2 ET SUIVANTES : Audit IA
      const auditEl = auditContainerRef.current;
      const canvas2 = await html2canvas(auditEl, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: 850 
      });

      const img2 = canvas2.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(img2);
      const fullImgHeightMM = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = fullImgHeightMM;
      let currentPage = 2;
      let sourceYOffset = 0; // Position de découpe sur l'image en mm

      // Page 2 : L'audit commence avec l'en-tête natif du DOM
      pdf.addPage();
      const firstPageContentLimit = pdfHeight - footerHeight;
      pdf.addImage(img2, 'PNG', 0, 0, pdfWidth, fullImgHeightMM);
      addFooter(2);
      
      heightLeft -= firstPageContentLimit;
      sourceYOffset += firstPageContentLimit;

      // Boucle pour les pages suivantes si nécessaire (P3+)
      while (heightLeft > 0) {
        pdf.addPage();
        currentPage++;
        
        // Espace disponible entre header et footer
        const usableHeight = pdfHeight - headerHeight - footerHeight;
        
        // On place l'image décalée vers le haut
        // Le headerHeight permet de ne pas écraser le contenu sous le header de la page
        pdf.addImage(img2, 'PNG', 0, headerHeight - sourceYOffset, pdfWidth, fullImgHeightMM);
        
        // On recouvre le haut et le bas pour "nettoyer" la découpe
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, headerHeight, 'F');
        pdf.rect(0, pdfHeight - footerHeight, pdfWidth, footerHeight, 'F');

        // Ajout des éléments visuels répétés
        addHeader("Note de Synthèse Stratégique", "Audit d'expertise immobilière assisté par IA (Suite)");
        addFooter(currentPage);

        heightLeft -= usableHeight;
        sourceYOffset += usableHeight;
      }
      
      pdf.save(`Dossier_Bancaire_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erreur PDF:', error);
    } finally {
      setIsExporting(false);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
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
              Audit IA
            </button>
            {aiAnalysis && (
              <button 
                onClick={exportPDF}
                disabled={isExporting}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isExporting ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="h-4 w-4" />}
                <span>{isExporting ? 'Export...' : 'PDF Banque'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6 overflow-y-auto lg:max-h-[calc(100vh-10rem)] pr-2 custom-scrollbar">
            
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
                          <SelectGroup label="Statut" value={p.statut} onChange={(v) => updatePartner(p.id, 'statut', v)} options={[{label: 'Privé', value: 'prive'}, {label: 'Public', value: 'fonctionnaire'}, {label: 'Gendarme', value: 'gendarme'}, {label: 'Indépendant', value: 'independant'}, {label: 'Retraité', value: 'retraite'}]} />
                          <InputGroup label="Net / mois" value={p.revenusNet} onChange={(v) => updatePartner(p.id, 'revenusNet', v)} />
                      </div>
                  </div>
              ))}
              
              <div className="pt-2 border-t border-slate-100 mt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label="Loyer" value={data.chargesFoyer} onChange={(v) => updateField('chargesFoyer', v)} tooltip="Votre loyer actuel. C'est une charge de vie, pas une dette bancaire." />
                    <InputGroup label="Crédits" value={data.creditsExistants} onChange={(v) => updateField('creditsExistants', v)} tooltip="Somme des mensualités de crédits en cours (conso, immo, auto, etc)." />
                  </div>
                  <InputGroup label="Apport Disponible" value={data.apportDisponible} onChange={(v) => updateField('apportDisponible', v)} />
              </div>
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4 text-emerald-700">
                    <Building2 className="h-5 w-5" />
                    <h2 className="font-semibold text-lg">Le Projet Immobilier</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InputGroup label="Prix d'achat" value={data.prixBien} onChange={(v) => updateField('prixBien', v)} />
                <InputGroup label="Frais Agence" value={data.fraisAgence} onChange={(v) => updateField('fraisAgence', v)} />
                <InputGroup label="Notaire (%)" value={data.fraisNotairePercent} onChange={(v) => updateField('fraisNotairePercent', v)} unit="%" />
                <InputGroup label="Taxe Foncière" value={data.taxeFonciere} onChange={(v) => updateField('taxeFonciere', v)} />
              </div>
              
              {data.lots.map((lot) => (
                <div key={lot.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <TextInputGroup label="Nom du lot" value={lot.nom} onChange={(v) => updateLot(lot.id, 'nom', v)} />
                    <InputGroup label="Loyer Mensuel" value={lot.loyerMensuel || 0} onChange={(v) => updateLot(lot.id, 'loyerMensuel', v)} />
                  </div>
                </div>
              ))}
            </section>

            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
               <div className="flex items-center space-x-2 text-amber-700 mb-4">
                  <Landmark className="h-5 w-5" />
                  <h2 className="font-semibold text-lg">Financement</h2>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Durée (ans)" value={data.dureeEmpruntAnnee} onChange={(v) => updateField('dureeEmpruntAnnee', v)} unit="ans" />
                  <InputGroup label="Taux Crédit" value={data.tauxInteret} onChange={(v) => updateField('tauxInteret', v)} unit="%" />
               </div>
               <button 
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
                >
                  {isAnalyzing ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <span>Calculer l'Audit Expert</span>}
                </button>
            </section>
          </div>

          <div className="lg:col-span-7">
            {activeTab === 'inputs' ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard label="Rentabilité Nette" value={`${results.rentabiliteNette.toFixed(2)} %`} color="text-emerald-600" />
                        <StatCard label="Endettement Bancaire" value={`${results.tauxEndettementApres.toFixed(1)} %`} subtext="Sur les crédits uniquement" color={results.tauxEndettementApres > 35 ? 'text-rose-600' : 'text-slate-900'} />
                        <StatCard label="Reste à Vivre" value={`${results.resteAVivreMensuel.toFixed(0)} €`} color="text-emerald-700" />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-lg font-bold mb-6 flex items-center text-indigo-600">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Projection Financière
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <CostDistributionChart prix={data.prixBien} fraisAgence={data.fraisAgence} fraisNotaire={results.fraisNotaire} />
                        <CashflowChart revenus={results.revenusLocatifsPonderes / 0.7} credit={results.mensualiteTotale} charges={data.chargesLocatives + (data.taxeFonciere / 12)} />
                      </div>
                    </div>
                </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-indigo-900 uppercase tracking-tight">Note de Synthèse Stratégique</h2>
                </div>
                <div className="p-8 prose prose-slate max-w-none prose-p:my-4 prose-headings:text-indigo-900">
                  {aiAnalysis ? <ReactMarkdown>{aiAnalysis}</ReactMarkdown> : <p className="text-slate-400">Analyse en cours de traitement par Gemini...</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- TEMPLATE PDF PROFESSIONNEL (CONTENU CACHÉ) --- */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {/* PAGE 1 : DASHBOARD BANCAIRE */}
        <div ref={page1Ref} className="w-[850px] min-h-[1100px] bg-white text-slate-900 relative">
          <div className="bg-slate-900 text-white p-12 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Dossier d'Investissement</h1>
              <p className="text-indigo-400 font-bold text-lg">Synthèse des indicateurs de solvabilité</p>
            </div>
            <div className="text-right">
                <p className="text-sm opacity-60">Généré le</p>
                <p className="font-bold text-lg">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </div>

          <div className="p-12 space-y-12">
            <section>
                <h2 className="text-xl font-bold uppercase border-l-4 border-indigo-600 pl-4 mb-6">1. Profil de Solvabilité des Emprunteurs</h2>
                <div className="grid grid-cols-2 gap-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-4">Revenus Mensuels Consolidés</p>
                        {data.partenaires.map(p => (
                            <div key={p.id} className="flex justify-between mb-2">
                                <span className="font-medium text-slate-700">{p.nom}</span>
                                <span className="font-bold">{p.revenusNet.toLocaleString()} €</span>
                            </div>
                        ))}
                        <div className="mt-4 pt-4 border-t border-slate-300 flex justify-between items-center font-black text-indigo-700">
                          <span>Revenu Foyer Total</span>
                          <span>{results.revenusFoyerTotal.toLocaleString()} €</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-4 font-mono">Engagements en Cours</p>
                        <div className="flex justify-between mb-2">
                            <span>Loyer (Charge RP)</span>
                            <span className="font-bold">{data.chargesFoyer.toLocaleString()} €</span>
                        </div>
                        <div className="flex justify-between text-rose-600 mb-2 font-medium">
                            <span>Crédits (Endettement)</span>
                            <span className="font-bold">{data.creditsExistants.toLocaleString()} €</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-300 flex justify-between items-center font-bold text-slate-900">
                          <span className="text-sm">Endettement Pré-Projet</span>
                          <span>{results.tauxEndettementAvant.toFixed(1)} %</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-10">
                <h3 className="text-center text-indigo-900 font-black uppercase mb-10 tracking-widest">Analyse Prudentielle Post-Opération</h3>
                <div className="grid grid-cols-2 gap-12">
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Taux d'Endettement Final</p>
                        <p className={`text-6xl font-black ${results.tauxEndettementApres > 35 ? 'text-rose-600' : 'text-indigo-900'}`}>{results.tauxEndettementApres.toFixed(1)}%</p>
                        <p className="text-[10px] text-slate-500 mt-2 italic font-medium">Limite HCSF : 35%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">Reste à Vivre Net</p>
                        <p className="text-6xl font-black text-emerald-600">{results.resteAVivreMensuel.toFixed(0)}€</p>
                        <p className="text-[10px] text-slate-500 mt-2 italic font-medium">Toutes charges déduites</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold uppercase border-l-4 border-indigo-600 pl-4 mb-6">2. Synthèse du Financement</h2>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-slate-900 text-white rounded-2xl p-8 text-center shadow-md">
                        <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Mensualité Globale</p>
                        <p className="text-3xl font-black">{results.mensualiteTotale.toLocaleString()} €</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Apport Injecté</p>
                        <p className="text-3xl font-black text-emerald-600">{data.apportDisponible.toLocaleString()} €</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Montant Prêt</p>
                        <p className="text-3xl font-black text-slate-900">{data.montantEmprunte.toLocaleString()} €</p>
                    </div>
                </div>
            </section>
          </div>
        </div>

        {/* PAGE 2+ : AUDIT IA (CONTENU DYNAMIQUE) */}
        <div ref={auditContainerRef} className="w-[850px] bg-white text-slate-900 relative">
            <div className="bg-slate-900 text-white p-12">
                <h2 className="text-3xl font-black uppercase tracking-tight">Note de Synthèse Stratégique</h2>
                <p className="text-indigo-400 font-bold text-lg">Analyse approfondie assistée par intelligence artificielle</p>
            </div>
            {/* Contenu principal de l'audit avec aération renforcée */}
            <div className="p-16 prose prose-slate max-w-none text-justify leading-relaxed prose-p:mb-10 prose-headings:mb-6 min-h-[1000px]">
                <ReactMarkdown>{aiAnalysis || "Note de synthèse en cours de génération..."}</ReactMarkdown>
            </div>
        </div>
      </div>
    </div>
  );
}
