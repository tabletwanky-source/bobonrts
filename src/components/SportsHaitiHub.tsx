import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Trophy, Shield, Clock, Award, Users, 
  RefreshCw, Plus, Edit, Trash2, Image, Video, MapPin, 
  ExternalLink, Lock, Check, PlusCircle, Sparkles, ChevronRight, Play
} from 'lucide-react';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, 
  addDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { sportsService } from '../services/sportsService';

interface SportsHaitiHubProps {
  onBack: () => void;
  onSelectMatch: (id: number) => void;
}

// Default Legends Data
const DEFAULT_LEGENDS = [
  {
    id: "manno_sanon",
    name: "Emmanuel \"Manno\" Sanon",
    photoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400",
    biography: "Le plus grand buteur de l'histoire du football haïtien.",
    statistics: "Matches: 100+ | Buts: 47 (Séléction nationale)",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    story: "Il a marqué les deux buts d'Haïti à la Coupe du Monde de la FIFA (Allemagne 1974), dont celui, mythique, qui a mis fin à l'invincibilité de 1143 minutes du gardien italien Dino Zoff. Une légende immortelle.",
    displayOrder: 1
  },
  {
    id: "joe_gaetjens",
    name: "Joe Gaetjens",
    photoUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=400",
    biography: "L'auteur du but légendaire qui terrassa l'Angleterre en 1950.",
    statistics: "Buts Coupe du Monde: 1",
    videoUrl: "",
    story: "Le héros haïtien du Mondial 1950 sous les couleurs des États-Unis. Il a marqué le but d'une victoire historique de 1-0 contre l'Angleterre à Belo Horizonte. Il est retourné en Haïti où il a joué avec le Racing Club Haïtien et pour la sélection avant de disparaître tragiquement.",
    displayOrder: 2
  },
  {
    id: "constantin_henriquez",
    name: "Constantin Henriquez",
    photoUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400",
    biography: "Le pionnier visionnaire du sport haïtien.",
    statistics: "Premier médaillé d'or olympique noir reconnus - Paris 1900",
    videoUrl: "",
    story: "Médecin, olympien, pionnier qui a introduit le football en Haïti. Après avoir remporté l'or olympique avec la France en rugby aux Jeux de Paris en 1900, Henriquez rentre en Haïti et introduit le football d'association en 1904. Il cofonde l'Union Sportive Haïtienne avec son frère Alphonse. La FHF émerge de cet écosystème la même année. Il devient ensuite sénateur.",
    displayOrder: 3
  },
  {
    id: "pierre_richard_bruny",
    name: "Pierre Richard Bruny",
    photoUrl: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=400",
    biography: "Le Général de la défense haïtienne.",
    statistics: "Matches Séléction: 95+ | Titre: Coupe des Caraïbes 2007",
    videoUrl: "",
    story: "Défenseur central légendaire et capitaine emblématique de la sélection nationale, surnommé \"le Général\". Champion de la Coupe des Caraïbes en 2007 dont il a été élu meilleur joueur. Il a incarné la rigueur et l'amour du maillot.",
    displayOrder: 4
  },
  {
    id: "wilde_donald_guerrier",
    name: "Wilde-Donald Guerrier",
    photoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400",
    biography: "L'infatigable guerrier des couloirs gauches.",
    statistics: "Gold Cups disputées: 4 | Buts emblématiques vs Espagne",
    videoUrl: "",
    story: "Latéral/ailier gauche légendaire par son engagement, sa vitesse et sa force athlétique, ayant marqué des buts capitaux en sélection à la Gold Cup et en compétitions européennes, notamment contre l'Espagne.",
    displayOrder: 5
  },
  {
    id: "duckens_nazon",
    name: "Duckens Nazon",
    photoUrl: "https://images.unsplash.com/photo-1552667466-07770ae110d6?auto=format&fit=crop&q=80&w=400",
    biography: "Le Duc du football moderne haïtien.",
    statistics: "Buteur prolifique - Plus de 30 buts en sélection",
    videoUrl: "",
    story: "Surnommé \"Le Duc\", l'un des meilleurs attaquants modernes de l'histoire d'Haïti, qui par sa puissance physique et son instinct de tueur a terrorisé les défenses de la CONCACAF.",
    displayOrder: 6
  }
];

// Default Milestones Data
const DEFAULT_MILESTONES = [
  { id: "m1", year: "1904", title: "Fondation", type: "Institution", description: "Fondation de la fédération sous le nom de Commission de Football de l'Union des Sociétés Sportives Haïtiennes", displayOrder: 1 },
  { id: "m2", year: "1934", title: "Membre FIFA", type: "Institution", description: "Affiliation officielle d'Haïti à la FIFA", displayOrder: 2 },
  { id: "m3", year: "1952", title: "Utilité Publique", type: "Institution", description: "La fédération est reconnue d'utilité publique par décret présidentiel le 4 avril 1952", displayOrder: 3 },
  { id: "m4", year: "1961", title: "CONCACAF", type: "Institution", description: "Haïti devient membre fondateur de la CONCACAF", displayOrder: 4 },
  { id: "m5", year: "1973", title: "Champion CONCACAF", type: "Hommes A", description: "Champion CONCACAF à Port-au-Prince — premier titre continental masculin, qualification pour la Coupe du Monde", displayOrder: 5 },
  { id: "m6", year: "1974", title: "Coupe du Monde", type: "Hommes A", description: "Première participation à la Coupe du Monde de la FIFA en Allemagne de l'Ouest — but de Manno Sanon face à l'Italie", displayOrder: 6 },
  { id: "m7", year: "1991", title: "Débuts Féminins", type: "Femmes A", description: "Premier match international des Grenadières : Haïti–Jamaïque (1-0) à Port-au-Prince", displayOrder: 7 },
  { id: "m8", year: "2007", title: "Mondial U17", type: "Jeunes", description: "Première participation à la Coupe du Monde U-17 de la FIFA, en Corée du Sud", displayOrder: 8 },
  { id: "m9", year: "2007", title: "Coupe Caraïbes", type: "Hommes A", description: "Sacré Champion de la Coupe des Caraïbes", displayOrder: 9 },
  { id: "m10", year: "2014", title: "CFU U17 Champion", type: "Jeunes", description: "Champion du Tournoi CFU U-17 à Port-au-Prince", displayOrder: 10 },
  { id: "m11", year: "2016", title: "CFU U20 Champion", type: "Jeunes", description: "Champion du Tournoi CFU U-20, face à Antigua-et-Barbuda en finale", displayOrder: 11 },
  { id: "m12", year: "2018", title: "Mondial Féminin U20", type: "Femmes U20", description: "Première participation à la Coupe du Monde U-20 féminine de la FIFA, en France. Troisième place au CONCACAF U-20 féminin", displayOrder: 12 },
  { id: "m13", year: "2019", title: "Mondial U17 Qualif", type: "Jeunes", description: "Troisième place au CONCACAF U-17, qualification pour la Coupe du Monde U-17 de la FIFA au Brésil", displayOrder: 13 },
  { id: "m14", year: "2020", title: "Comité Normalisation", type: "Institution", description: "Mise en place du Comité de Normalisation de la FHF par la FIFA", displayOrder: 14 },
  { id: "m15", year: "2020", title: "CONCACAF U-20", type: "Femmes U20", description: "Troisième place au CONCACAF U-20 féminin", displayOrder: 15 },
  { id: "m16", year: "2023", title: "Coupe du Monde Féminine", type: "Femmes A", description: "Première participation historique à la Coupe du Monde féminine de la FIFA en Australie et en Nouvelle-Zélande", displayOrder: 16 },
  { id: "m17", year: "2024", title: "Monique André", type: "Institution", description: "Nomination de Monique André à la présidence du Comité de Normalisation par la FIFA", displayOrder: 17 },
  { id: "m18", year: "2024", title: "Demi-finales U17", type: "Femmes", description: "Demi-finales du Championnat CONCACAF U-17 féminin — meilleur parcours à ce jour", displayOrder: 18 },
  { id: "m19", year: "2025", title: "Qualification CDM 2026", type: "Hommes A", description: "Qualification historique des Grenadiers d'Haïti pour la Coupe du Monde de la FIFA 2026 — premier retour masculin en 52 ans", displayOrder: 19 },
  { id: "m20", year: "2025", title: "Mondial Qatar U17", type: "Jeunes", description: "Qualification pour la Coupe du Monde U-17 de la FIFA au Qatar (Série de victoires et Groupe E remporté)", displayOrder: 20 },
  { id: "m21", year: "2026", title: "Nomination Pia Sundhage", type: "Femmes A", description: "Pia Sundhage — Sélectionneuse de l'Année FIFA 2012 — nommée à la tête des Grenadières", displayOrder: 21 },
  { id: "m22", year: "2026", title: "Confiance U17", type: "Jeunes", description: "Deuxième qualification consécutive pour la Coupe du Monde U-17 de la FIFA — une première dans l'histoire haïtienne", displayOrder: 22 },
  { id: "m23", year: "2026", title: "CONCACAF U-20", type: "Jeunes", description: "Qualification officielle pour le Championnat de la CONCACAF U-20", displayOrder: 23 },
  { id: "m24", year: "2026", title: "Nouveaux Statuts", type: "Institution", description: "Adoption à l'unanimité des nouveaux statuts légaux de la FHF par vingt délégués sous la supervision du Comité de Normalisation et de la FIFA", displayOrder: 24 },
  { id: "m25", year: "2026", title: "World Cup Participation", type: "Hommes A", description: "Deuxième participation haïtienne à la Coupe du Monde de la FIFA — Groupe C face à l'Écosse, au Brésil et au Maroc", displayOrder: 25 }
];

// Default Leadership Data
const DEFAULT_LEADERSHIP = [
  { id: "l1", name: "Monique André", role: "Présidente du Comité de Normalisation", biography: "Nommée par la FIFA à la tête du Comité de Normalisation de la FHF le 30 novembre 2024, en remplacement de l'administrateur cubain Luis Hernández. Son mandat a depuis été reconduit by la FIFA. Sous sa direction, la fédération a mené à bien la qualification d'Haïti pour la Coupe du Monde 2026, la campagne éliminatoire de la sélection masculine senior disputée sans stade à domicile, la qualification du programme de jeunes pour la Coupe du Monde FIFA U-17 au Qatar, ainsi que la nomination historique de Pia Sundhage à la tête de la sélection féminine en février 2026.", photoUrl: "https://i.postimg.cc/Ghnx6rGq/monii.png", momentsKeys: [
    "30 novembre 2024 — Nomination à la présidence du Comité de Normalisation",
    "14 janvier 2025 — Rencontre à haut niveau avec la FIFA à Zurich",
    "Février 2025 — Entretien au Le Nouvelliste sur les perspectives du programme",
    "18 novembre 2025 — À la tête de la FHF lors de la qualification masculine pour le Mondial à Curaçao",
    "26 novembre 2025 — Don de 13 millions de gourdes reçu de Natcom S.A. pour le programme masculin",
    "13 février 2026 — Annonce de la nomination de Pia Sundhage comme sélectionneure des Grenadières",
    "Précédemment membre du Comité de Normalisation aux côtés d'Yvon Sévère. A représenté Haïti au 2e Symposium FIFA sur le football féminin à Sydney, dans le sillage de la Coupe du Monde féminine 2023."
  ], displayOrder: 1 },
  { id: "l2", name: "Patrick Massenat", role: "Secrétaire général", biography: "Assure l'administration quotidienne et le secrétariat général de l'institution.", photoUrl: "", displayOrder: 2 },
  { id: "l3", name: "Pierre Chéry", role: "Directeur technique national", biography: "Supervise la stratégie de développement technique et la formation académique nationale.", photoUrl: "", displayOrder: 3 },
  { id: "l4", name: "Sébastien Migné", role: "Sélectionneur des Grenadiers", biography: "Mène la séléction masculine senior pour la phase de groupe de la Coupe du Monde 2026.", photoUrl: "", displayOrder: 4 },
  { id: "l5", name: "Pia Sundhage", role: "Sélectionneure des Grenadières", biography: "Sélectionneuse légendaire de l'Année FIFA 2012, nommée à la tête des féminines en fév. 2026.", photoUrl: "", displayOrder: 5 },
  { id: "l6", name: "Louis Charles", role: "Responsable communication", biography: "Gère les relations presse, réseaux sociaux et les communications officielles de la FHF.", photoUrl: "", displayOrder: 6 },
  { id: "l7", name: "Frédéric Aupont", role: "Coordonnateur futsal", biography: "Dirige le développement et les chantiers de la discipline Futsal et Beach Soccer.", photoUrl: "", displayOrder: 7 },
  { id: "l8", name: "Wilson Tilus", role: "Président de la Commission des arbitres", biography: "Préside les instances de réglementation, d'éthique et de promotion de l'arbitrage.", photoUrl: "", displayOrder: 8 },
  { id: "l9", name: "Joseph Marckingson Natoux", role: "Directeur du Département des arbitres", biography: "En charge de la préparation athlétique et technique du corps arbitral.", photoUrl: "", displayOrder: 9 },
  { id: "l10", name: "Jean-Lesly Jean-Laurent", role: "Coordonnateur des arbitres", biography: "Coordonne l'affectation sur le terrain des arbitres nationaux.", photoUrl: "", displayOrder: 10 }
];

// Default News Data
const DEFAULT_NEWS = [
  {
    id: "news1",
    title: "Adoption à l'unanimité des nouveaux statuts de la FHF",
    category: "FHF News",
    excerpt: "Vingt délégués représentant les clubs masculins, féminins et les ligues ont adopté à l'unanimité les nouveaux statuts de la Fédération Haïtienne de Football.",
    content: "Réunis en congrès extraordinaire, vingt délégués représentant les clubs masculins, féminins et les ligues ont adopté à l'unanimité les nouveaux statuts de la Fédération Haïtienne de Football. Ces statuts, fruit de plusieurs années de travail entre la FHF et les acteurs du mouvement footballistique haïtien, dotent l'institution d'une nouvelle fondation légale.\n\nLa session s'est tenue sous la supervision du Comité de Normalisation — Yvon Sévère et Gally Amazan — et des représentants de la FIFA : Mme Salomé Tally, en ligne, et M. Belval Juventino, présent à Port-au-Prince. L'adoption de ces statuts figurait parmi les principaux objectifs confiés au Comité de Normalisation par la FIFA.",
    featuredImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
    publishedAt: "31 mai 2026",
    createdAt: new Date().toISOString()
  },
  {
    id: "news2",
    title: "Nomination historique de Pia Sundhage aux Grenadières",
    category: "National Team",
    excerpt: "La Fédération officialise l'arrivée de la double championne olympique et entraîneur de l'année FIFA à la tête du programme féminin.",
    content: "Dans un effort sans précédent pour positionner le football féminin haïtien au sommet, la présidente Monique André a officialisé la signature de Pia Sundhage. Le contrat vise à professionnaliser les filières d'élite de la FHF et à mener la campagne d'accès aux grands tournois mondiaux à venir.",
    featuredImage: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800",
    publishedAt: "13 février 2026",
    createdAt: new Date().toISOString()
  }
];

// Default Media Data
const DEFAULT_MEDIA = [
  { id: "med1", title: "Qualification Historique à Curaçao 2025", type: "photo", url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800" },
  { id: "med2", title: "Entraînement de Pia Sundhage au Centre FHF", type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnailUrl: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=800" },
  { id: "med3", title: "Victoire 4-0 face à la Nouvelle-Zélande", type: "highlight", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnailUrl: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800" }
];

const StadeSylvioCatorSection: React.FC = () => {
  return (
    <div id="stade-sylvio-cator" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden relative">
      <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl md:text-3xl">🏟️</span>
          <div>
            <h3 className="font-extrabold text-lg md:text-xl text-white uppercase tracking-tight">Stade Sylvio Cator</h3>
            <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest font-mono">
              Le Chaudron National d'Haïti
            </span>
          </div>
        </div>
        <span className="bg-blue-600/10 text-blue-400 border border-blue-600/20 text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full">
          Infrastructures
        </span>
      </div>

      {/* Large Banner Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-850 aspect-[21/9]">
        <img 
          src="https://i.postimg.cc/WzkSg1r4/stade-sylvio-cartor.png" 
          alt="Stade Sylvio Cator, Port-au-Prince, Haïti" 
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]" 
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <span className="text-white text-[11px] md:text-xs font-semibold tracking-wide flex items-center gap-1">
            <span className="text-orange-500">•</span> Port-au-Prince, Haïti
          </span>
          <span className="text-orange-500 font-bold text-[10px] md:text-xs uppercase tracking-wider font-mono">
            Capacité: 15,000 places
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
        {/* Historical Description */}
        <div className="md:col-span-8 space-y-3">
          <span className="text-slate-450 text-[10px] font-black uppercase tracking-widest block font-mono">
            Récit Historique & Importance
          </span>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
            Inauguré en 1953, le Stade Sylvio Cator est le temple sacré et le chaudron historique du football haïtien. Baptisé en hommage à Sylvio Cator, l'immortel athlète olympique haïtien qui remporta la médaille d'argent au saut en longueur lors des Jeux Olympiques d'Amsterdam en 1928, le stade a abrité les plus prestigieuses campagnes de qualifications d'Haïti. C'est ici, sur ce terrain légendaire, que la génération mythique de 1974 a décroché son glorieux billet pour la Coupe du Monde en Allemagne, scellant l'âge d'or des Grenadiers.
          </p>
        </div>

        {/* Stadium Information Box */}
        <div className="md:col-span-4 bg-slate-950/50 p-4 border border-slate-850 rounded-2xl space-y-3.5">
          <span className="text-slate-200 text-xs font-black uppercase tracking-wider block border-b border-slate-850 pb-2">
            Fiche Technique
          </span>
          <div className="space-y-2.5 text-[11px] font-semibold text-slate-400">
            <div className="flex justify-between">
              <span>Pelouse :</span>
              <span className="text-white">Artificielle (FIFA Quality)</span>
            </div>
            <div className="flex justify-between">
              <span>Club hôte :</span>
              <span className="text-white">Sélection d'Haïti</span>
            </div>
            <div className="flex justify-between">
              <span>Inauguration :</span>
              <span className="text-white">1953</span>
            </div>
            <div className="flex justify-between">
              <span>Renforcement :</span>
              <span className="text-white">2010 (Post-séisme)</span>
            </div>
            <div className="flex justify-between">
              <span>Adresse :</span>
              <span className="text-white truncate max-w-[120px]" title="Rue Oswald Durand">Rue Oswald Durand</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SportsHaitiHub: React.FC<SportsHaitiHubProps> = ({ onBack, onSelectMatch }) => {
  const { userProfile, user } = useAuth();
  const isAdmin = userProfile?.role === 'admin' || 
                  user?.email?.toLowerCase() === 'wanky7713@gmail.com' ||
                  user?.email?.toLowerCase() === 'renejohnmike33@gmail.com';

  const [activeTab, setActiveTab] = useState<'federation' | 'news' | 'history' | 'grenadiers' | 'gallery'>('federation');
  
  // Real-time states
  const [newsList, setNewsList] = useState<any[]>(DEFAULT_NEWS);
  const [timelineList, setTimelineList] = useState<any[]>(DEFAULT_MILESTONES);
  const [legendsList, setLegendsList] = useState<any[]>(DEFAULT_LEGENDS);
  const [leadershipList, setLeadershipList] = useState<any[]>(DEFAULT_LEADERSHIP);
  const [mediaList, setMediaList] = useState<any[]>(DEFAULT_MEDIA);
  const [haitiMatches, setHaitiMatches] = useState<any[]>([]);
  const [customFixtures, setCustomFixtures] = useState<any[]>([]);
  
  // Loading & State Refreshes
  const [loading, setLoading] = useState(true);
  
  // Carousel indices & interactive timeline state
  const [selectedTimelineMilestone, setSelectedTimelineMilestone] = useState<string | null>("m25");
  const [selectedLegend, setSelectedLegend] = useState<any>(DEFAULT_LEGENDS[0]);

  // Modals management
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showAddLegendModal, setShowAddLegendModal] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);

  // Form states
  const [newsForm, setNewsForm] = useState({ title: '', category: 'FHF News', excerpt: '', content: '', image: '' });
  const [milestoneForm, setMilestoneForm] = useState({ year: '2026', title: '', type: 'Institution', description: '' });
  const [legendForm, setLegendForm] = useState({ name: '', biography: '', statistics: '', story: '', photoUrl: '', videoUrl: '' });
  const [mediaForm, setMediaForm] = useState({ title: '', type: 'photo', url: '', thumbnailUrl: '' });

  // 1. Fetch real matches from sports proxy
  useEffect(() => {
    const fetchHaitiMatches = async () => {
      try {
        const data = await sportsService.getTeamMatches();
        setHaitiMatches(data.matches || []);
        
        const config = await sportsService.getCompetitions();
        if (config && config.customHaitiFixtures) {
          setCustomFixtures(config.customHaitiFixtures);
        }
      } catch (err) {
        console.error("Failed to load sports matches:", err);
      }
    };
    fetchHaitiMatches();
  }, []);

  // 2. Real-time Listeners for Firestore Collections with fallback
  useEffect(() => {
    setLoading(true);
    
    // News observer
    const unsubNews = onSnapshot(collection(db, "fhf_news"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNewsList(data);
      } else {
        setNewsList(DEFAULT_NEWS);
      }
    }, () => {
      setNewsList(DEFAULT_NEWS);
    });

    // Timeline observer
    const unsubTimeline = onSnapshot(collection(db, "fhf_timeline"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // sort by displayOrder or year
        const sorted = data.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setTimelineList(sorted);
      } else {
        setTimelineList(DEFAULT_MILESTONES);
      }
    }, () => {
      setTimelineList(DEFAULT_MILESTONES);
    });

    // Legends observer
    const unsubLegends = onSnapshot(collection(db, "fhf_legends"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sorted = data.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setLegendsList(sorted);
        // Default select first legend if available
        if (sorted.length > 0) setSelectedLegend(sorted[0]);
      } else {
        setLegendsList(DEFAULT_LEGENDS);
        setSelectedLegend(DEFAULT_LEGENDS[0]);
      }
    }, () => {
      setLegendsList(DEFAULT_LEGENDS);
      setSelectedLegend(DEFAULT_LEGENDS[0]);
    });

    // Leadership observer
    const unsubLeadership = onSnapshot(collection(db, "fhf_leadership"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const sorted = data.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
        setLeadershipList(sorted);
      } else {
        setLeadershipList(DEFAULT_LEADERSHIP);
      }
    }, () => {
      setLeadershipList(DEFAULT_LEADERSHIP);
    });

    // Media observer
    const unsubMedia = onSnapshot(collection(db, "fhf_media"), (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMediaList(data);
      } else {
        setMediaList(DEFAULT_MEDIA);
      }
    }, () => {
      setMediaList(DEFAULT_MEDIA);
    });

    setLoading(false);

    return () => {
      unsubNews();
      unsubTimeline();
      unsubLegends();
      unsubLeadership();
      unsubMedia();
    };
  }, []);

  // 3. Match calculation logic & Countdown widget
  const combinedFixtures = [...haitiMatches];
  customFixtures.forEach((cf) => {
    if (!combinedFixtures.some((f) => String(f.id) === String(cf.id))) {
      combinedFixtures.push({
        id: cf.id || Math.floor(Math.random() * 90000000),
        competition: { name: cf.competition || "Rencontre Internationale" },
        homeTeam: { name: cf.isHome ? "Haïti" : cf.opponent, crest: cf.isHome ? "https://i.postimg.cc/151rbPwM/fll.png" : "" },
        awayTeam: { name: !cf.isHome ? "Haïti" : cf.opponent, crest: !cf.isHome ? "https://i.postimg.cc/151rbPwM/fll.png" : "" },
        utcDate: cf.utcDate || cf.date,
        status: cf.status || "FINISHED",
        score: {
          fullTime: {
            home: cf.isHome ? cf.teamScore : cf.opponentScore,
            away: !cf.isHome ? cf.teamScore : cf.opponentScore
          }
        },
        custom: true
      });
    }
  });

  const rawPast = combinedFixtures
    .filter((f) => f.status === "FINISHED" || f.status === "AWARDED" || new Date(f.utcDate) < new Date());
    
  // If API has nothing, let's inject our real historical matches explicitly requested!
  const manualMatches = [
    { id: 991, competition: { name: "Coupe du Monde de la FIFA" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Écosse" }, score: { fullTime: { home: 0, away: 1 } }, status: "FINISHED", utcDate: "2026-06-13T18:00:00Z" },
    { id: 992, competition: { name: "Match Amical" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Pérou" }, score: { fullTime: { home: 1, away: 2 } }, status: "FINISHED", utcDate: "2026-06-05T19:00:00Z" },
    { id: 993, competition: { name: "Match Amical" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Nouvelle-Zélande" }, score: { fullTime: { home: 4, away: 0 } }, status: "FINISHED", utcDate: "2026-06-02T20:00:00Z" },
    { id: 994, competition: { name: "Match Amical" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Islande" }, score: { fullTime: { home: 1, away: 1 } }, status: "FINISHED", utcDate: "2026-03-31T17:30:00Z" },
    { id: 995, competition: { name: "Match Amical" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Tunisie" }, score: { fullTime: { home: 0, away: 1 } }, status: "FINISHED", utcDate: "2026-03-28T16:00:00Z" },
    { id: 996, competition: { name: "Éliminatoires CDM" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Nicaragua" }, score: { fullTime: { home: 2, away: 0 } }, status: "FINISHED", utcDate: "2025-11-18T19:00:00Z" },
    { id: 997, competition: { name: "Éliminatoires CDM" }, homeTeam: { name: "Haïti" }, awayTeam: { name: "Costa Rica" }, score: { fullTime: { home: 1, away: 0 } }, status: "FINISHED", utcDate: "2025-11-13T20:00:00Z" },
    { id: 998, competition: { name: "Éliminatoires CDM" }, homeTeam: { name: "Honduras" }, awayTeam: { name: "Haïti" }, score: { fullTime: { home: 3, away: 0 } }, status: "FINISHED", utcDate: "2025-10-13T21:00:00Z" }
  ];

  const pastMatches = rawPast.length > 0 
    ? [...rawPast].sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    : manualMatches;

  const upcomingMatches = combinedFixtures
    .filter((f) => f.status !== "FINISHED" && f.status !== "AWARDED" && new Date(f.utcDate) >= new Date())
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  // Countdown calculations
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const nextGameDate = new Date("2026-06-25T19:00:00Z"); // Symbolic Next Haiti World Cup Group match (e.g. vs Brésil)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = nextGameDate.getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
      } else {
        setCountdown({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // CRUD Operations
  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = `news_${Date.now()}`;
      await setDoc(doc(db, "fhf_news", docId), {
        title: newsForm.title,
        category: newsForm.category,
        excerpt: newsForm.excerpt,
        content: newsForm.content,
        featuredImage: newsForm.image || "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600",
        publishedAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        createdAt: serverTimestamp()
      });
      setNewsForm({ title: '', category: 'FHF News', excerpt: '', content: '', image: '' });
      setShowAddNewsModal(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "fhf_news");
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cet article ?")) {
      try {
        await deleteDoc(doc(db, "fhf_news", id));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `fhf_news/${id}`);
      }
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = `milestone_${Date.now()}`;
      await setDoc(doc(db, "fhf_timeline", docId), {
        year: milestoneForm.year,
        title: milestoneForm.title,
        type: milestoneForm.type,
        description: milestoneForm.description,
        displayOrder: timelineList.length + 1,
        createdAt: serverTimestamp()
      });
      setMilestoneForm({ year: '2026', title: '', type: 'Institution', description: '' });
      setShowAddMilestoneModal(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "fhf_timeline");
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (confirm("Supprimer ce jalon de l'histoire ?")) {
      try {
        await deleteDoc(doc(db, "fhf_timeline", id));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `fhf_timeline/${id}`);
      }
    }
  };

  const handleAddLegend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = `legend_${Date.now()}`;
      await setDoc(doc(db, "fhf_legends", docId), {
        name: legendForm.name,
        biography: legendForm.biography,
        statistics: legendForm.statistics,
        story: legendForm.story,
        photoUrl: legendForm.photoUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=400",
        videoUrl: legendForm.videoUrl || "",
        displayOrder: legendsList.length + 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setLegendForm({ name: '', biography: '', statistics: '', story: '', photoUrl: '', videoUrl: '' });
      setShowAddLegendModal(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "fhf_legends");
    }
  };

  const handleDeleteLegend = async (id: string) => {
    if (confirm("Supprimer cette légende ?")) {
      try {
        await deleteDoc(doc(db, "fhf_legends", id));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `fhf_legends/${id}`);
      }
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = `media_${Date.now()}`;
      await setDoc(doc(db, "fhf_media", docId), {
        title: mediaForm.title,
        type: mediaForm.type,
        url: mediaForm.url,
        thumbnailUrl: mediaForm.thumbnailUrl || (mediaForm.type === 'photo' ? mediaForm.url : "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=800"),
        createdAt: serverTimestamp()
      });
      setMediaForm({ title: '', type: 'photo', url: '', thumbnailUrl: '' });
      setShowAddMediaModal(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "fhf_media");
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm("Supprimer ce média de la galerie ?")) {
      try {
        await deleteDoc(doc(db, "fhf_media", id));
      } catch (err: any) {
        handleFirestoreError(err, OperationType.DELETE, `fhf_media/${id}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 🇨🇭 FHF HEADER HERO CONTAINER */}
      <div 
        className="relative rounded-3xl overflow-hidden p-8 md:p-12 border border-slate-800 bg-cover bg-center min-h-[350px] flex flex-col justify-end"
        style={{
          backgroundImage: 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.95) 100%), url("https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200")'
        }}
      >
        <button 
          onClick={onBack}
          id="fhf_back_btn"
          className="absolute top-6 left-6 text-slate-300 hover:text-white p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 transition-colors flex items-center space-x-2 text-xs font-bold shadow-2xl backdrop-blur-md cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fermer le Hub FHF</span>
        </button>

        {isAdmin && (
          <div className="absolute top-6 right-6 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 backdrop-blur-sm">
            <Lock className="w-3 h-3" />
            Mode Administrateur FHF Actif
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pt-16">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full text-orange-400 text-xs font-extrabold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span>Hub Officiel d'Information</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <img 
                  src="https://i.postimg.cc/151rbPwM/fll.png" 
                  alt="Drapeau officiel de la République d'Haïti" 
                  className="w-12 md:w-16 h-8 md:h-11 object-cover rounded-md shadow-lg border border-slate-700 shrink-0"
                  loading="lazy"
                />
                <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
                  Fédération <span className="text-orange-500">Haïtienne</span> de Football
                </h2>
              </div>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl font-semibold leading-relaxed">
                L'institution qui porte l'identité du football haïtien. Fondée en 1904, membre de la FIFA (1934), et membre fondateur de la CONCACAF (1961).
              </p>
            </div>
          </div>

          <div className="flex bg-slate-950/90 backdrop-blur-xl border border-slate-850 p-5 rounded-2xl gap-6 shadow-2xl">
            <div className="text-center">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-wider">Siège social</span>
              <span className="text-white font-extrabold text-sm flex items-center gap-1.5 mt-1 justify-center">
                <MapPin className="w-3.5 h-3.5 text-orange-500" /> Port-au-Prince
              </span>
            </div>
            <div className="w-px bg-slate-800"></div>
            <div className="text-center">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-wider">Couleurs</span>
              <span className="text-orange-500 font-extrabold text-sm uppercase mt-1 block">Bleu et Rouge</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 FHF STATS GRID HERO CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { metric: "1904", label: "Fondation", sub: "Union Sociétés Sportives" },
          { metric: "122+", label: "Années d'existence", sub: "Génération de Talents" },
          { metric: "1934", label: "Membre FIFA", sub: "Reconnaissance Mondiale" },
          { metric: "1961", label: "Membre Fondateur", sub: "Confédération CONCACAF" }
        ].map((c, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800/80 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group">
            <span className="text-3xl md:text-4xl font-black text-orange-500 font-mono tracking-tight group-hover:scale-105 transition-transform origin-left block">
              {c.metric}
            </span>
            <div className="mt-3">
              <span className="block text-slate-200 font-extrabold text-sm uppercase">{c.label}</span>
              <span className="text-[11px] text-slate-500 font-bold block mt-0.5">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 🧭 NAVIGATION SUB-TABS */}
      <div className="border-b border-slate-850/70 flex overflow-x-auto whitespace-nowrap gap-2 pb-px select-none scrollbar-none">
        {[
          { id: 'federation', label: 'La Fédération', icon: Shield },
          { id: 'news', label: "À la Une", icon: Award },
          { id: 'history', label: 'Histoire & Légendes', icon: Trophy },
          { id: 'grenadiers', label: 'Les Grenadiers & Matchs', icon: Calendar },
          { id: 'gallery', label: 'Photos / Vidéos', icon: Image }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center space-x-2.5 px-6 py-4 border-b-2 font-black uppercase text-xs tracking-wider transition-all cursor-pointer ${
                isActive 
                  ? 'border-orange-500 text-orange-500 bg-orange-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 📁 TAB CONTENTS */}
      <div className="min-h-[400px]">
        {activeTab === 'federation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
            {/* Monique André Card & Direct Board */}
            <div className="lg:col-span-8 space-y-8">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <h3 className="font-extrabold text-lg md:text-xl text-white mb-6 flex items-center gap-2 border-b border-slate-850 pb-4">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                  Direction Actuelle / Comité de Normalisation FHF
                </h3>

                {/* Monique profile hero */}
                {leadershipList.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    <div className="md:col-span-4 space-y-4 flex flex-col items-center md:items-start text-center md:text-left select-none">
                      <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-orange-500 shadow-2xl mx-auto md:mx-0 group hover:border-orange-400 transition-all duration-300">
                        <img 
                          src={leadershipList[0].photoUrl || "https://i.postimg.cc/Ghnx6rGq/monii.png"} 
                          alt="Monique André, Présidente du Comité de Normalisation"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                      </div>
                      <div className="space-y-1.5 flex flex-col items-center md:items-start">
                        <div className="bg-orange-500 text-slate-950 text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider">
                          Présidente de la FHF
                        </div>
                        <h4 className="text-white font-black text-lg md:text-xl">{leadershipList[0].name}</h4>
                        <span className="text-[11px] text-orange-500 font-extrabold uppercase tracking-wide block">
                          {leadershipList[0].role}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-8 space-y-4">
                      <div className="space-y-2">
                        <span className="text-slate-450 text-xs font-black uppercase tracking-wider block">Biographie & Mandat</span>
                        <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-semibold">
                          {leadershipList[0].biography}
                        </p>
                      </div>

                      <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-slate-850">
                        <span className="text-slate-200 text-xs font-black uppercase tracking-wider block mb-2 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" /> Moments Clés & Jalons
                        </span>
                        <ul className="space-y-1.5 text-[11px] md:text-xs text-slate-400 font-semibold">
                          {leadershipList[0].momentsKeys?.map((m: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-orange-500 shrink-0 mt-1">•</span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* The rest of the Committee list */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
                <h3 className="font-extrabold text-base text-white mb-6 flex items-center gap-2 border-b border-slate-850 pb-4">
                  <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                  Gouvernance & Membres du Comité
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leadershipList.slice(1).map((m) => (
                    <div key={m.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-855/80 text-center flex flex-col justify-between group hover:border-slate-700 transition-colors">
                      <div className="space-y-1">
                        <h4 className="text-white font-extrabold text-sm group-hover:text-orange-500 transition-colors">{m.name}</h4>
                        <span className="inline-block bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider mt-1">
                          {m.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 font-semibold line-clamp-2">
                        {m.biography}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stade Sylvio Cator Section */}
              <StadeSylvioCatorSection />
            </div>

            {/* Sidebar with FHF Competitions */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-850 pb-4">
                  <Trophy className="w-4 h-4 text-orange-500" />
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-tight">Compétitions Officielles FHF</h3>
                </div>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                  Compétitions organisées et réglementées directement sous l'égide de la Fédération Haïtienne de Football :
                </p>

                <div className="space-y-2 pt-2">
                  {[
                    "🏆 Ligue Haïtienne (Division 1)",
                    "🏆 Coupe d'Haïti",
                    "🏆 Championnat Féminin de Ligue Haïtienne",
                    "🏆 Jeunes U15",
                    "🏆 Jeunes U17",
                    "🏆 Jeunes U20",
                    "🏆 Jeunes U23",
                    "🏆 Championnat National de Futsal"
                  ].map((comp, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center space-x-3 hover:border-slate-800 transition-colors">
                      <span className="text-slate-200 font-bold text-xs">{comp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Utility / Admin Settings summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-3">
                <span className="text-sm">🏟️</span>
                <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Centre Technique de la Croix-des-Bouquets</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Le quartier général emblématique destiné à la formation des jeunes Grenadiers, centre d'excellence de la fédération haïtienne.
                </p>
              </div>
            </div>

            {/* Majestic 🏟️ Stade Sylvio Cator Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative col-span-12 select-none">
              <div className="relative aspect-[21/9] w-full min-h-[220px] overflow-hidden border-b border-slate-850">
                <img 
                  src="https://i.postimg.cc/WzkSg1r4/stade-sylvio-cartor.png" 
                  alt="Stade Sylvio Cator, Port-au-Prince, Haïti" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"></div>
                <div className="absolute bottom-6 left-6 md:left-8">
                  <div className="inline-flex items-center space-x-2 bg-orange-500/90 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                    <span>Temple du Football Haïtien</span>
                  </div>
                  <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tight">Stade Sylvio Cator</h3>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-orange-500" /> Rue Romain, Port-au-Prince, Haïti
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-4">
                  <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    Description Historique
                  </h4>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
                    Inauguré sous le nom de Parc Leconte en 1953, puis rebaptisé en l'honneur du légendaire athlète olympique haïtien Sylvio Cator (médaillé d'argent au saut en longueur aux Jeux olympiques de 1928), le Stade Sylvio Cator est l'arène de prédilection où s'écrivent les plus belles pages de l'histoire du football et de l'identité sportive en Haïti.
                  </p>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    L'enceinte a résonné au son du triomphe légendaire d'Haïti lors du championnat de la CONCACAF en 1973, qualifiant l'équipe nationale masculine pour le Mondial de 1974 sous l'influence du légendaire Manno Sanon. Le stade demeure le phare et le centre de la ferveur populaire pour le ballon rond en accueillant les affrontements de la sélection nationale (les Grenadiers) et les événements phares de la FHF.
                  </p>
                </div>

                <div className="md:col-span-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider pb-2 border-b border-slate-850">
                    Informations Clés
                  </h4>
                  <ul className="space-y-3 text-xs font-bold text-slate-305">
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Capacité :</span>
                      <span className="font-mono text-orange-500">15 000 places</span>
                    </li>
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Pelouse :</span>
                      <span>Synthétique (Certifiée FIFA)</span>
                    </li>
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Inauguration :</span>
                      <span className="font-mono">1953</span>
                    </li>
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-505">Propriétaire :</span>
                      <span>Mairie de Port-au-Prince</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-8 animate-fade-in">
            {/* Headline and publishing access for admins */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-black text-2xl uppercase tracking-tight">À la une • Actualités FHF</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Communiqués de presse officiels, déclarations et vie des équipes nationales.</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setShowAddNewsModal(true)}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  Publier un Communiqué
                </button>
              )}
            </div>

            {/* News Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {newsList.map((post) => (
                <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between group">
                  <div>
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-orange-400 border border-slate-800">
                        {post.category}
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteNews(post.id)}
                          className="absolute top-4 right-4 p-2 bg-rose-600/90 hover:bg-rose-750 text-white rounded-lg border border-rose-500 transition-colors cursor-pointer"
                          title="Supprimer l'article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="p-6 space-y-3">
                      <span className="text-[10px] text-slate-500 font-semibold font-mono flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-500" /> {post.publishedAt}
                      </span>
                      <h4 className="text-white font-black text-lg md:text-xl group-hover:text-orange-500 transition-colors leading-tight">
                        {post.title}
                      </h4>
                      <p className="text-slate-400 text-xs md:text-sm font-semibold leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-850/50 mt-4 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Par: FHF Direction de Presse</span>
                    <button 
                      onClick={() => alert(`Contenu complet de l'article:\n\n${post.content}`)}
                      className="text-orange-500 hover:text-white flex items-center gap-1 group-hover:underline cursor-pointer"
                    >
                      <span>Lire l'intégralité</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-12 animate-fade-in">
            {/* Pioneer Section: Constantin Henriquez */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-4 max-w-sm mx-auto lg:max-w-none w-full">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-850 aspect-3/4 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=400" 
                      alt="Constantin Henriquez"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-orange-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-widest block w-max">
                        Pionnier national
                      </span>
                      <h4 className="text-white font-extrabold text-base mt-1">Constantin Henriquez</h4>
                      <span className="text-[11px] text-slate-350 block font-semibold leading-none mt-0.5">Introduit le Football en 1904</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-400 text-xs font-black uppercase tracking-wider">
                    <span>Le pionnier du football haïtien</span>
                  </div>
                  <h3 className="text-white font-black text-2xl md:text-4xl uppercase tracking-tight">Constantin Henriquez</h3>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
                    Médecin, olympien, pionnier qui a introduit le football en Haïti. Après avoir remporté l'or olympique avec la France en rugby aux Jeux de Paris en 1900 — devenant le premier médaillé d'or olympique noir officiellement reconnu —, Henriquez rentre en Haïti et introduit le football d'association en 1904. 
                  </p>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    Il inscrit ce qui est considéré comme le premier but officiellement répertorié en Haïti dans un match organisé, et cofonde l'Union Sportive Haïtienne avec son frère Alphonse. La Fédération Haïtienne de Football émerge de cet écosystème la même année. Il devient par la suite sénateur de la République, inscrivant son action dans la postérité civile et sportive d'Haïti.
                  </p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE TIMELINE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    Chronologie des Moments Clés (FHF)
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Sélection masculine, féminine et jalons historiques.</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddMilestoneModal(true)}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Jalon Historique
                  </button>
                )}
              </div>

              {/* Horizontal Scroll Timeline container */}
              <div className="relative mb-6 select-none">
                <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800">
                  {timelineList.map((m) => {
                    const isSelected = selectedTimelineMilestone === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedTimelineMilestone(m.id)}
                        className={`flex-shrink-0 px-4 py-2 bg-slate-950/70 border rounded-xl text-left transition-all min-w-[130px] flex flex-col justify-between cursor-pointer ${
                          isSelected 
                            ? 'border-orange-500 text-orange-500 bg-orange-500/10 scale-102 font-mono ring-2 ring-orange-500/10' 
                            : 'border-slate-850 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xs font-semibold uppercase block text-slate-505">{m.type}</span>
                        <div className="mt-2 flex items-baseline justify-between w-full">
                          <span className="text-base font-black font-mono tracking-tight text-white">{m.year}</span>
                          <span className="text-[10px] shrink-0 font-extrabold text-orange-500">{m.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Displayed Selected Milestone Panel */}
              <AnimatePresence mode="wait">
                {selectedTimelineMilestone && (
                  (() => {
                    const activeMilestone = timelineList.find(m => m.id === selectedTimelineMilestone);
                    if (!activeMilestone) return null;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        key={activeMilestone.id}
                        className="bg-slate-950 border border-slate-850 p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-start justify-between gap-6"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <span className="bg-orange-500 text-slate-950 font-black px-4 py-1.5 rounded-xl font-mono text-lg">
                              {activeMilestone.year}
                            </span>
                            <div>
                              <h4 className="text-white font-extrabold text-base leading-tight">
                                {activeMilestone.title}
                              </h4>
                              <span className="text-[10px] text-orange-500 uppercase tracking-widest font-black block mt-0.5">
                                Catégorie: {activeMilestone.type || "Institution"}
                              </span>
                            </div>
                          </div>

                          <p className="text-slate-300 text-xs md:text-sm font-semibold max-w-3xl leading-relaxed">
                            {activeMilestone.description}
                          </p>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteMilestone(activeMilestone.id)}
                            className="bg-rose-600/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                          >
                            Supprimer
                          </button>
                        )}
                      </motion.div>
                    );
                  })()
                )}
              </AnimatePresence>
            </div>

            {/* LEGENDS SECTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-850 pb-4">
                <div>
                  <h3 className="text-white font-extrabold text-lg flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    <img 
                      src="https://i.postimg.cc/151rbPwM/fll.png" 
                      alt="Drapeau officiel de la République d'Haïti" 
                      className="w-4.5 h-3 object-cover rounded-sm border border-slate-750 shrink-0" 
                      loading="lazy"
                    />
                    Légendes du Football Haïtien
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">Les profils de ceux qui ont écrit l'histoire glorieuse de notre sport.</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAddLegendModal(true)}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ajouter une Légende
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left side list */}
                <div className="lg:col-span-5 space-y-3">
                  {legendsList.map((legend) => {
                    const isSelected = selectedLegend?.id === legend.id;
                    return (
                      <button
                        key={legend.id}
                        onClick={() => setSelectedLegend(legend)}
                        className={`w-full p-4 bg-slate-950/70 border rounded-2xl text-left transition-all flex items-center space-x-4 cursor-pointer group ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20' 
                            : 'border-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-850 shadow-inner flex-shrink-0">
                          <img 
                            src={legend.photoUrl} 
                            alt={legend.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-white font-extrabold text-sm group-hover:text-orange-500 transition-colors leading-none">{legend.name}</h4>
                          <span className="text-[10px] text-slate-500 font-bold block mt-1 line-clamp-1">{legend.biography}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Right side Detail Panel */}
                <div className="lg:col-span-7">
                  <AnimatePresence mode="wait">
                    {selectedLegend && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        key={selectedLegend.id}
                        className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between"
                      >
                        <div className="relative aspect-video max-h-[250px] overflow-hidden">
                          <img 
                            src={selectedLegend.photoUrl} 
                            alt={selectedLegend.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                          
                          <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 z-10 select-none">
                            <img 
                              src="https://i.postimg.cc/151rbPwM/fll.png" 
                              alt="Drapeau officiel de la République d'Haïti" 
                              className="w-4 h-2.5 object-cover rounded-sm border border-slate-700" 
                              loading="lazy"
                            />
                            <span className="text-[9px] text-white font-black uppercase tracking-widest font-sans">Haïti</span>
                          </div>
                          
                          <div className="absolute bottom-4 left-4 pt-4">
                            <h4 className="text-white font-black text-2xl tracking-tight uppercase leading-tight">
                              {selectedLegend.name}
                            </h4>
                            <span className="text-orange-500 font-extrabold text-[11px] uppercase tracking-widest block font-mono mt-0.5">
                              {selectedLegend.biography}
                            </span>
                          </div>
                        </div>

                        <div className="p-6 space-y-4">
                          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 font-black text-[10px] uppercase tracking-wider block mb-1">
                              Estatistik / Palmarès
                            </span>
                            <span className="text-white font-mono font-bold text-xs">
                              {selectedLegend.statistics || "N/A"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-slate-450 font-black text-[10px] uppercase tracking-wider block">Istwa / Contribution Historique</span>
                            <p className="text-slate-350 text-xs md:text-sm font-semibold leading-relaxed">
                              {selectedLegend.story}
                            </p>
                          </div>
                        </div>

                        <div className="p-6 pt-0 border-t border-slate-850/50 mt-4 flex items-center justify-between text-xs font-bold">
                          {selectedLegend.videoUrl && (
                            <a 
                              href={selectedLegend.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-500 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>Regarder les Highlights</span>
                            </a>
                          )}
                          {!selectedLegend.videoUrl && <span className="text-slate-500">Média Historique</span>}

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteLegend(selectedLegend.id)}
                              className="text-rose-500 hover:text-rose-400 font-extrabold border border-rose-500/20 px-3 py-1.5 rounded-lg cursor-pointer"
                            >
                              Retirer de la liste
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grenadiers' && (
          <div className="space-y-8 animate-fade-in">
            {/* World Cup 2026 Standing and Form Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Form & Recent Results */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* ⏰ NEXT MATCH COUNTDOWN WIDGET */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-850">
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left select-none">
                      <img 
                        src="https://i.postimg.cc/151rbPwM/fll.png" 
                        alt="Drapeau officiel d'Haïti" 
                        className="w-16 h-11 object-cover rounded shadow border border-slate-800" 
                        loading="lazy"
                      />
                      <div className="space-y-1">
                        <span className="bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase text-orange-400 tracking-wider inline-block">
                          Prochain Match des Grenadiers
                        </span>
                        <h4 className="text-white font-black text-xl md:text-2xl uppercase tracking-tight flex items-center gap-2 justify-center sm:justify-start">
                          Haïti <span className="text-slate-500">vs</span> Brésil 🇧🇷
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold font-mono">
                          Coupe du Monde de la FIFA 2026 • Groupe C • Stade Rose Bowl, USA
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-850 px-4 py-2 rounded-xl text-center">
                      <span className="block text-slate-500 text-[9px] font-black uppercase tracking-wider leading-none">Coup d'envoi</span>
                      <span className="text-white font-black text-xs font-mono block mt-1">25 JUIN 2026</span>
                      <span className="text-[10px] text-orange-500 font-bold block">19:00 (UTC)</span>
                    </div>
                  </div>

                  {/* CountDown clocks */}
                  <div className="grid grid-cols-4 gap-4 text-center pt-6 max-w-lg mx-auto">
                    {[
                      { val: countdown.days, label: "Jours" },
                      { val: countdown.hours, label: "Heures" },
                      { val: countdown.minutes, label: "Min." },
                      { val: countdown.seconds, label: "Sec." }
                    ].map((clock, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl shadow-inner relative group hover:border-slate-700 transition-colors">
                        <span className="block text-xl md:text-3xl font-black text-orange-500 font-mono tracking-tight">
                          {String(clock.val).padStart(2, '0')}
                        </span>
                        <span className="block text-[8px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1.5">
                          {clock.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PAST MATCHES RESULTS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-850 pb-4 justify-between">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-orange-500" />
                      <h3 className="font-extrabold text-base text-white uppercase tracking-tight">Forme Récente & Derniers Résultats</h3>
                    </div>

                    <div className="flex gap-1.5 items-center">
                      {pastMatches.slice(0, 5).map((m, idx) => {
                        const isHomeHaiti = m.homeTeam?.name?.toLowerCase().includes("hait") || false;
                        const homeScore = m.score?.fullTime?.home ?? 0;
                        const awayScore = m.score?.fullTime?.away ?? 0;
                        const haitiScore = isHomeHaiti ? homeScore : awayScore;
                        const opponentScore = isHomeHaiti ? awayScore : homeScore;
                        const won = haitiScore > opponentScore;
                        const draw = haitiScore === opponentScore;

                        return (
                          <span 
                            key={idx}
                            title={`${m.homeTeam.name} ${homeScore}-${awayScore} ${m.awayTeam.name}`}
                            className={`w-5.5 h-5.5 rounded-full font-mono text-[9px] font-black text-slate-950 flex items-center justify-center cursor-default ${
                              won ? 'bg-emerald-500' : draw ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                          >
                            {won ? 'V' : draw ? 'N' : 'D'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {pastMatches.map((m) => {
                      const isHomeHaiti = m.homeTeam?.name?.toLowerCase().includes("hait") || false;
                      const homeScore = m.score?.fullTime?.home ?? 0;
                      const awayScore = m.score?.fullTime?.away ?? 0;
                      const haitiScore = isHomeHaiti ? homeScore : awayScore;
                      const opponentScore = isHomeHaiti ? awayScore : homeScore;
                      
                      const won = haitiScore > opponentScore;
                      const draw = haitiScore === opponentScore;

                      return (
                        <div 
                          key={m.id}
                          className="p-4 rounded-xl bg-slate-950/50 border border-slate-855/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-900 border border-slate-805 text-slate-500 font-mono font-black text-[9px] px-2 py-0.5 rounded uppercase">
                                {m.competition?.name}
                              </span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                won ? 'bg-emerald-600/10 text-emerald-400' : draw ? 'bg-amber-600/10 text-amber-500' : 'bg-red-650/10 text-red-500'
                              }`}>
                                {won ? '🟢 Victoire' : draw ? '🟡 Nul' : '🔴 Défaite'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-6 pt-1">
                              <span className="text-xs font-black text-slate-200">{m.homeTeam?.name}</span>
                              <span className="text-slate-600 font-extrabold text-xs">vs</span>
                              <span className="text-xs font-black text-slate-200">{m.awayTeam?.name}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="bg-slate-900 border border-slate-800 py-1.5 px-3 rounded-lg text-sm font-mono font-black text-orange-500">
                              {homeScore} - {awayScore}
                            </div>
                            <span className="text-[10px] text-slate-505 font-mono">
                              {new Date(m.utcDate).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* World Cup 2026 Standings */}
              <div className="lg:col-span-4 space-y-8">
                
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-white uppercase tracking-tight">Coupe du Monde FIFA 2026</h4>
                      <span className="text-[9px] text-slate-505 block tracking-wide mt-0.5 uppercase">Classement Groupe C</span>
                    </div>
                    <span className="text-sm">🏆</span>
                  </div>

                  <div className="space-y-1.5 font-mono text-[11px] font-bold">
                    {/* Table headers */}
                    <div className="grid grid-cols-12 text-slate-500 text-[9px] font-black uppercase text-center pb-1 border-b border-slate-850">
                      <span className="col-span-6 text-left">Équipe</span>
                      <span className="col-span-2">MJ</span>
                      <span className="col-span-2">Diff</span>
                      <span className="col-span-2">Pts</span>
                    </div>

                    {[
                      { team: "Brésil", flag: "🇧🇷", mj: 1, diff: "+3", pts: 3, pos: 1 },
                      { team: "Maroc", flag: "🇲🇦", mj: 1, diff: "+1", pts: 3, pos: 2 },
                      { team: "Haïti", flag: "https://i.postimg.cc/151rbPwM/fll.png", isOfficialHaiti: true, mj: 1, diff: "-1", pts: 0, pos: 3, highlights: true },
                      { team: "Écosse", flag: "🏴 ", mj: 1, diff: "-3", pts: 0, pos: 4 }
                    ].map((entry) => (
                      <div 
                        key={entry.team} 
                        className={`grid grid-cols-12 py-2 px-1 text-center rounded-lg border items-center ${
                          entry.highlights 
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                            : 'bg-slate-950/40 border-transparent text-slate-300'
                        }`}
                      >
                        <span className="col-span-6 text-left font-sans font-extrabold truncate flex items-center space-x-1.5">
                          <span className="text-[9px] text-slate-500">{entry.pos}.</span>
                          {entry.isOfficialHaiti ? (
                            <img 
                              src={entry.flag} 
                              alt="Drapeau officiel de la République d'Haïti" 
                              className="w-4.5 h-3 object-cover rounded-sm border border-slate-705 shrink-0" 
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-sm border-transparent shrink-0">{entry.flag}</span>
                          )}
                          <span>{entry.team}</span>
                        </span>
                        <span className="col-span-2">{entry.mj}</span>
                        <span className="col-span-2">{entry.diff}</span>
                        <span className="col-span-2 font-black font-sans text-xs text-white">{entry.pts}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold italic border-t border-slate-850/50 pt-3">
                    Les deux premières équipes du groupe accèdent directement aux 16es de finale. Les huit meilleures troisièmes des douze groupes complètent le tableau des 32.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-2">
                  <span className="text-xl">🏆</span>
                  <h4 className="text-white font-black text-xs uppercase tracking-wide">Éliminatoires Coupe du Monde 2026</h4>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Les Grenadiers ont conquis la qualification lors de la mémorable campagne de novembre 2025 s'achevant par brio à Curaçao, validant un billet d'or attendu depuis 1974.
                  </p>
                </div>

              </div>
            </div>

            {/* Majestic 🏟️ Stade Sylvio Cator Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative select-none mt-8">
              <div className="relative aspect-[21/9] w-full min-h-[220px] overflow-hidden border-b border-slate-850">
                <img 
                  src="https://i.postimg.cc/WzkSg1r4/stade-sylvio-cartor.png" 
                  alt="Stade Sylvio Cator, Port-au-Prince, Haïti" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent"></div>
                <div className="absolute bottom-6 left-6 md:left-8">
                  <div className="inline-flex items-center space-x-2 bg-orange-500/90 text-slate-950 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                    <span>Temple du Football Haïtien</span>
                  </div>
                  <h3 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tight">Stade Sylvio Cator</h3>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-orange-500" /> Rue Romain, Port-au-Prince, Haïti
                  </p>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-8 space-y-4">
                  <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                    Description Historique
                  </h4>
                  <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed">
                    Inauguré sous le nom de Parc Leconte en 1953, puis rebaptisé en l'honneur du légendaire athlète olympique haïtien Sylvio Cator (médaillé d'argent au saut en longueur aux Jeux olympiques de 1928), le Stade Sylvio Cator est l'arène de prédilection où s'écrivent les plus belles pages de l'histoire du football et de l'identité sportive en Haïti.
                  </p>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    L'enceinte a résonné au son du triomphe légendaire d'Haïti lors du championnat de la CONCACAF en 1973, qualifiant l'équipe nationale masculine pour le Mondial de 1974 sous l'influence du légendaire Manno Sanon. Le stade demeure le phare et le centre de la ferveur populaire pour le ballon rond en accueillant les affrontements de la sélection nationale (les Grenadiers) et les événements phares de la FHF.
                  </p>
                </div>

                <div className="md:col-span-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-850 flex flex-col justify-between space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider pb-2 border-b border-slate-850">
                    Informations Clés
                  </h4>
                  <ul className="space-y-3 text-xs font-bold text-slate-305">
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Capacité :</span>
                      <span className="font-mono text-orange-500">15 000 places</span>
                    </li>
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Pelouse :</span>
                      <span>Synthétique (Certifiée FIFA)</span>
                    </li>
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-500">Inauguration :</span>
                      <span className="font-mono">1953</span>
                    </li>
                    <li className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-505">Propriétaire :</span>
                      <span>Mairie de Port-au-Prince</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8 animate-fade-in">
            {/* Gallery headline options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-5">
              <div>
                <h3 className="text-white font-black text-2xl uppercase tracking-tight">Galerie Média FHF</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Photos exclusives, vidéos d'entraînement, déclarations et highlights.</p>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setShowAddMediaModal(true)}
                  className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xl"
                >
                  <Plus className="w-4 h-4 shrink-0" /> Ajouter un Média
                </button>
              )}
            </div>

            {/* Gallery display grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaList.map((med) => (
                <div key={med.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-colors group relative flex flex-col justify-between">
                  <div className="relative aspect-video overflow-hidden bg-black/40 flex items-center justify-center">
                    <img 
                      src={med.thumbnailUrl || med.url} 
                      alt={med.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

                    {med.type === 'video' || med.type === 'highlight' ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <span className="p-3.5 bg-orange-500 rounded-full text-slate-950 shadow-2xl animate-pulse cursor-pointer">
                          <Play className="w-5 h-5 fill-current shrink-0" />
                        </span>
                      </div>
                    ) : null}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 rounded border border-slate-800 text-[9px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
                      {med.type === 'photo' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      <span>{med.type}</span>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteMedia(med.id)}
                        className="absolute top-3 right-3 p-1.5 bg-rose-600/95 hover:bg-rose-700 text-white rounded border border-rose-500 transition-colors cursor-pointer"
                        title="Supprimer ce média"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 bg-slate-900 flex justify-between items-center">
                    <span className="text-white font-extrabold text-xs tracking-tight line-clamp-1">{med.title}</span>
                    <a 
                      href={med.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-orange-500 hover:text-white cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🚀 ADMIN ADD NEWS MODAL */}
      {showAddNewsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
            <h4 className="text-lg md:text-xl font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
              Publier un Communiqué FHF
            </h4>

            <form onSubmit={handleAddNews} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Titre de l'Actualité</label>
                <input 
                  type="text" 
                  value={newsForm.title} 
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  placeholder="ex: Nouvelle session d'entraînement sous la supervision de l'équipe technique"
                  required
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">Catégorie</label>
                  <select 
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="FHF News">FHF News</option>
                    <option value="National Team">Sélection Nationale</option>
                    <option value="FIFA Updates">FIFA Updates</option>
                    <option value="CONCACAF Updates">CONCACAF Updates</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">URL de l'image (Optionnel)</label>
                  <input 
                    type="url" 
                    value={newsForm.image} 
                    onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                    placeholder="ex: https://images.unsplash..." 
                    className="w-full p-3.5 bg-slate-950 border border-slate-855 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Accroche / Extrait</label>
                <input 
                  type="text" 
                  value={newsForm.excerpt} 
                  onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                  placeholder="ex: Une annonce majeure concernant l'équipe féminine..."
                  required
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Contenu complet de l'article</label>
                <textarea 
                  value={newsForm.content} 
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  placeholder="Rédigez l'intégralité du communiqué officiel ici..."
                  required
                  rows={4}
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 resize-none" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowAddNewsModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  Publier l'Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 ADMIN ADD HISTORIC MILESTONE MODAL */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <h4 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
              Ajouter un Jalon Historique (Timeline)
            </h4>

            <form onSubmit={handleAddMilestone} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">Année</label>
                  <input 
                    type="text" 
                    value={milestoneForm.year} 
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, year: e.target.value })}
                    placeholder="ex: 1904"
                    required
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">Titre/Label court</label>
                  <input 
                    type="text" 
                    value={milestoneForm.title} 
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                    placeholder="ex: Fondation FHF"
                    required
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Catégorie d'Équipe / Type</label>
                <select 
                  value={milestoneForm.type}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, type: e.target.value })}
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="Institution">Institution (FHF)</option>
                  <option value="Hommes A">Hommes A</option>
                  <option value="Femmes A">Femmes A</option>
                  <option value="Jeunes">Catégories Jeunes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Description Historique Complète</label>
                <textarea 
                  value={milestoneForm.description} 
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  placeholder="Rédigez le texte descriptif du jalon historique..."
                  required
                  rows={3}
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none resize-none" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 ADMIN ADD LEGEND PLAYERS MODAL */}
      {showAddLegendModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <h4 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
              Ajouter un Profil Légende FHF
            </h4>

            <form onSubmit={handleAddLegend} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Nom de la légende</label>
                <input 
                  type="text" 
                  value={legendForm.name} 
                  onChange={(e) => setLegendForm({ ...legendForm, name: e.target.value })}
                  placeholder="ex: Wilde-Donald Guerrier"
                  required
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">Surnom / Statut Court</label>
                  <input 
                    type="text" 
                    value={legendForm.biography} 
                    onChange={(e) => setLegendForm({ ...legendForm, biography: e.target.value })}
                    placeholder="ex: Le buteur héroïque de 1974"
                    required
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">Stats Clés</label>
                  <input 
                    type="text" 
                    value={legendForm.statistics} 
                    onChange={(e) => setLegendForm({ ...legendForm, statistics: e.target.value })}
                    placeholder="ex: 15 buts en séléction"
                    required
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">URL Photo du Joueur</label>
                <input 
                  type="url" 
                  value={legendForm.photoUrl} 
                  onChange={(e) => setLegendForm({ ...legendForm, photoUrl: e.target.value })}
                  placeholder="ex: https://images.unsplash..." 
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">L'Histoire & Contributions de la Légende</label>
                <textarea 
                  value={legendForm.story} 
                  onChange={(e) => setLegendForm({ ...legendForm, story: e.target.value })}
                  placeholder="Racontez le parcours, les exploits emblématiques, l'impact de ce joueur d'exception..."
                  required
                  rows={4}
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none resize-none" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowAddLegendModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 ADMIN ADD GALLERY MEDIA MODAL */}
      {showAddMediaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <h4 className="text-lg font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
              Ajouter un Média de la Galerie FHF
            </h4>

            <form onSubmit={handleAddMedia} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Titre/Légende du Média</label>
                <input 
                  type="text" 
                  value={mediaForm.title} 
                  onChange={(e) => setMediaForm({ ...mediaForm, title: e.target.value })}
                  placeholder="ex: Entraînement au Centre technique"
                  required
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">Type de Média</label>
                  <select 
                    value={mediaForm.type}
                    onChange={(e) => setMediaForm({ ...mediaForm, type: e.target.value })}
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="photo">Photo / Image</option>
                    <option value="video">Vidéo / Clip YouTube</option>
                    <option value="highlight">Highlights du Match</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase">URL Source du Média</label>
                  <input 
                    type="url" 
                    value={mediaForm.url} 
                    onChange={(e) => setMediaForm({ ...mediaForm, url: e.target.value })}
                    placeholder="ex: https://images.unsplash.com..." 
                    required
                    className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase">Miniature / Thumbnail (Pour Vidéos)</label>
                <input 
                  type="url" 
                  value={mediaForm.thumbnailUrl} 
                  onChange={(e) => setMediaForm({ ...mediaForm, thumbnailUrl: e.target.value })}
                  placeholder="ex: https://images.unsplash.com/photo..." 
                  className="w-full p-3.5 bg-slate-950 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowAddMediaModal(false)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Ajouter à la Galerie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsHaitiHub;
