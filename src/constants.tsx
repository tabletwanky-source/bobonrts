
import React from 'react';
import { Program, NewsItem } from './types';

export const COLORS = {
  navy: '#0f172a',
  blue: '#1e3a8a',
  orange: '#f97316',
  accent: '#fb923c',
};

export const STREAM_URL = 'https://stream.zeno.fm/jsonvre6zvxtv';

export const PROGRAMS: Program[] = [
  {
    id: '1',
    title: 'Sports Sismique',
    category: 'Sport',
    description: 'Débat Show - Actualités sportives, analyses, débats et opinions d’experts.',
    image: 'https://i.postimg.cc/Y4PjsYZ7/3.png',
    time: 'Lun-Ven 18:00'
  },
  {
    id: '2',
    title: 'Culture Sismique',
    category: 'Cultures',
    description: 'Traditions, musique, arts, et valeurs culturelles haïtiennes & internationales.',
    image: 'https://i.postimg.cc/hJvfspCw/5.png'
  },
  {
    id: '3',
    title: 'Prière Sismique',
    category: 'Évangéliques',
    description: 'Temps de prière, méditation, enseignements bibliques et édification spirituelle.',
    image: 'https://i.postimg.cc/2121nPxJ/4.png'
  },
  {
    id: '4',
    title: 'Sismique Infos',
    category: 'Actualités',
    description: 'Infos locales, nationales & internationales – Radio & Télévision.',
    image: 'https://i.postimg.cc/9DW4RWZK/1.png'
  },
  {
    id: '5',
    title: 'Espace des Jeunes',
    category: 'Éducation',
    description: 'Formation, orientation, motivation et technologie pour l’avenir des jeunes.',
    image: 'https://i.postimg.cc/yDVJgV0Y/6.png'
  },
  {
    id: '6',
    title: 'Ti Koze Lakay',
    category: 'Analyses',
    description: 'Discussions sociales, analyses profondes et sujets de la vie quotidienne.',
    image: 'https://i.postimg.cc/Ty1p0Ckk/7.png'
  },
  {
    id: '7',
    title: 'Market Sismique',
    category: 'Marketing Digital',
    description: 'Publicité, entrepreneuriat, promotion d’entreprises et opportunités business.',
    image: 'https://i.postimg.cc/kVGBsf1J/8.png'
  },
  {
    id: '8',
    title: 'Show Time',
    category: 'Studio',
    description: 'Musique, vibes, animations DJ, détente et ambiance festive.',
    image: 'https://i.postimg.cc/cKz6bw2r/11.png'
  }
];

export const MOCK_NEWS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Haïti aux Portes de l\'Histoire : Qualification Mondiale',
    excerpt: 'Après 52 ans d’attente, les Grenadiers se qualifient pour le Mondial 2026. Un moment de fierté nationale sans précédent.',
    content: `C’est un séisme de joie qui a secoué Port-au-Prince et toutes les capitales de la diaspora ce lundi. Après cinquante-deux ans d’une attente qui semblait éternelle, la sélection nationale de football d’Haïti, les Grenadiers, a officiellement validé son ticket pour la phase finale de la Coupe du Monde 2026. Cette qualification historique, obtenue au terme d’un parcours qualificatif héroïque, marque le retour triomphal du bicolore sur la plus grande scène du sport mondial, un exploit qui n'avait plus été réalisé depuis l’épopée légendaire de 1974 en Allemagne.\n\nLe match décisif, disputé dans une atmosphère électrique, restera gravé dans les annales du sport caribéen. Face à une opposition physique et tactique, les Grenadiers ont su puiser dans leurs racines pour offrir une prestation alliant discipline défensive et audace offensive. Sous la houlette d'un staff technique qui a su insuffler une rigueur professionnelle inédite, les joueurs ont démontré que le talent haïtien, lorsqu'il est soutenu par une vision claire, n'a aucune limite. Les larmes des vétérans et les cris de la jeunesse dans les rues de Delmas et de Pétion-Ville témoignent de l'ampleur symbolique de cette victoire : c'est l'espoir d'une nation entière qui reprend vie à travers le ballon rond.\n\nCette réussite ne tombe pas du ciel. Elle est le fruit d'une restructuration profonde du football national et d'un engagement sans faille des joueurs évoluant tant localement qu'à l'étranger. Radio Sismique FM a suivi chaque étape de cette montée en puissance, observant comment le sport est redevenu ce ciment social capable d’unir les Haïtiens au-delà des défis quotidiens. Pour les observateurs internationaux, Haïti n'est plus seulement une équipe "surprise", mais une formation compétitive dotée d'un mental d'acier, prête à bousculer la hiérarchie mondiale lors de l'été 2026.\n\nEn conclusion, cette qualification est bien plus qu'un simple résultat sportif ; c'est une renaissance. Elle prouve au monde que la "vibration du cœur" haïtien est plus forte que jamais. Alors que les préparatifs pour le mondial commencent, Radio Sismique FM se prépare à vivre cet événement aux côtés de ses auditeurs. Le rendez-vous est pris : Haïti sera là, prête à faire vibrer les stades du monde entier et à porter haut les couleurs d'un peuple fier et résilient. Le rêve de 1974 trouve enfin son héritier légitime en 2026.`,
    date: '06 Jan 2026',
    category: 'Sport',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'n2',
    title: 'Politique : Delcy Rodríguez prête serment à Caracas',
    excerpt: 'Transition politique majeure au Venezuela. Delcy Rodríguez assure l’intérim après l’arrestation de Nicolás Maduro.',
    content: `L’actualité internationale est dominée par une onde de choc sans précédent suite à la comparution de Nicolás Maduro devant un tribunal fédéral de New York. Ce lundi, l’ancien dirigeant vénézuélien, accompagné de son épouse Cilia Flores, a plaidé non coupable face aux accusations portées par la justice américaine. Cette scène judiciaire, filmée sous haute sécurité, marque la fin d’une ére et le début d’une transition complexe pour le Venezuela et ses partenaires régionaux.\n\nPendant que la procédure suivait son cours sur le sol américain, Caracas vivait un moment charnière. Delcy Rodríguez a officiellement prêté serment en tant que présidente par intérim, cherchant à stabiliser un appareil d’État profondément ébranlé. L’installation de cette nouvelle présidence s’inscrit dans une volonté de continuité idéologique, bien que la pression internationale et les sanctions économiques pèsent lourdement sur les épaules du nouveau gouvernement de transition. Les rues de la capitale, entre silence pesant et manifestations sporadiques, témoignent de l’incertitude qui règne au sein de la population.\n\nLa communauté internationale observe ces événements with une attention redoublée. Si certains pays voient dans cette arrestation une opportunité de restaurer l’ordre démocratique, d’autres dénoncent une ingérence flagrante dans la souveraineté nationale. Les analystes politiques s’accordent à dire que le dénouement de ce procès influencera durablement les relations diplomatiques entre Washington et les capitales d’Amérique latine. La stabilité énergétique de la région est également au cœur des préoccupations, le Venezuela possédant les plus grandes réserves de pétrole au monde.\n\nEn conclusion, la crise vénézuélienne entre dans une phase de haute intensité. Entre le marteau de la justice internationale et l'enclume de la gestion interne du pouvoir par Delcy Rodríguez, le pays doit naviguer dans des eaux troubles. Radio Sismique FM continuera de suivre de près chaque rebondissement de ce dossier brûlant, car l’avenir de millions de Vénézuéliens, en exil ou sur place, se joue désormais dans l’enceinte de ce tribunal new-yorkais et dans les couloirs du palais de Miraflores.`,
    date: '06 Jan 2026',
    category: 'International',
    image: 'https://i.postimg.cc/KR7k8K3x/2.png'
  },
  {
    id: 'n3',
    title: 'Portrait : John Mike René, une Voix pour la Diaspora',
    excerpt: 'Découvrez le parcours inspirant du fondateur de RTS, de Port-au-Prince à Jacksonville.',
    content: `Radio Télévision Sismique est née d’une vision claire : créer un média capable de transformer l’information en impact et la parole en action. Fondée le 16 octobre 2024 à Jacksonville, Floride (USA) par le journaliste haïtien John Mike René, la station est le fruit d’une passion profonde pour le journalisme, la communication et le service communautaire.\n\nNé à Port-au-Prince, Haïti, la vision de son fondateur s’est étendue bien au-delà des frontières. Aujourd’hui, Radio Télévision Sismique rassemble la diaspora haïtienne à travers le monde, tout en s’ouvrant à d’autres cultures et nations. De la radio à la télévision numérique, la station est devenue une voix pour ceux qui n’en ont pas, un pont entre les peuples, et une vibration qui touche les cœurs.\n\nJohn Mike René est plus qu'un simple fondateur ; il incarne la résilience d'un journaliste passionné qui a su allier sa vocation à son engagement pour sa communauté. RTS n'est pas seulement un projet média, c'est l'expression d'une soul dévouée à l'information juste et à la formation continue. Sous son leadership, la station est devenue une référence incontournable pour la communauté haïtienne globale, offrant un espace de dialogue, d'éducation et de divertissement sain.`,
    date: '18 Oct 2024',
    category: 'Leadership',
    image: 'https://i.postimg.cc/WFJtLtcF/9.png'
  },
  {
    id: 'n4',
    title: 'Culture : Le Rara, l\'Âme Vibrante des Rues d\'Haïti',
    excerpt: 'Exploration de la richesse rythmique et sociale du Rara, un patrimoine qui transcende les générations.',
    content: `Le Rara n'est pas qu'une simple procession musicale ; c'est le battement de cœur d'Haïti. Chaque année, alors que le pays entre dans la période sainte, les rues se remplissent des sons graves des vaksens et des mélodies entêtantes des colonels. Radio Sismique FM a plongé au cœur de cette tradition ancestrale pour comprendre comment ce genre musical continue de mobiliser les foules et de porter les revendications sociales du peuple.\n\nOriginaire de la période coloniale, le Rara est devenu un outil de résistance et de cohésion. À travers ses chansons souvent improvisées, il commente l'actualité, critique les puissants et célèbre la vie malgré les épreuves. Notre équipe a rencontré des artisans de vaksen à Léogâne, capitale mondiale du Rara, qui nous ont expliqué la complexité de la fabrication de ces instruments en bambou, où chaque note doit être en parfaite harmonie avec le reste de la bande.\n\nPour la diaspora, le Rara reste un lien indéfectible with la terre natale. À Jacksonville ou à Miami, les "Rara de rue" adaptent leurs rythmes pour faire vibrer le bitume américain, prouvant que la culture haïtienne est capable de s'exporter sans perdre son essence. En conclusion, le Rara demeure le symbole d'une identité résiliente, une explosion de couleurs et de sons qui rappelle au monde que la joie haïtienne est une force révolutionnaire.`,
    date: '05 Jan 2026',
    category: 'Culture',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=2000&auto=format&fit=crop'
  },
  {
    id: 'n5',
    title: 'Éducation : La Technologie au Service de la Jeunesse Haïtienne',
    excerpt: 'Comment le numérique transforme l’accès à la formation pour les jeunes de Jacksonville à Port-au-Prince.',
    content: `L'ère numérique offre des opportunités sans précédent pour la jeunesse haïtienne. Radio Télévision Sismique s'est penchée sur les nouvelles initiatives d'apprentissage en ligne qui permettent aux jeunes de se former aux métiers de demain, du codage au marketing digital, malgré les barrières géographiques. Dans un monde de plus en plus connecté, l'éducation n'a plus de frontières.\n\nÀ Jacksonville, des programmes d'accompagnement pour les jeunes de la diaspora voient le jour, utilisant les studios de RTS comme laboratoires de création. "Il ne s'agit pas seulement de consommer de l'information, mais d'apprendre à la produire", explique un intervenant régulier de l'émission Espace des Jeunes. Cette transition vers le "créateur-citoyen" est essentielle pour l'avenir économique de la communauté.\n\nEn Haïti, malgré les défis d'infrastructure, des pôles d'innovation technologique commencent à émerger. La formation continue est le levier qui permettra à la prochaine génération de relever les défis du pays. RTS s'engage à être le vecteur de cette connaissance, en diffusant des contenus éducatifs accessibles à tous. Le savoir est le moteur de la vibration qui changera le monde.`,
    date: '04 Jan 2026',
    category: 'Éducation',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop'
  }
];
