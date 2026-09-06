// Placeholder data until the real API is ready. Field names here match docs/api-contract.md.

export type Availability = {
  mentor: boolean;
  networking: boolean;
  referrals: boolean;
};

export type Member = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  headline: string;
  university: string;
  major?: string;
  company?: string;
  role?: string;
  industry?: string;
  location?: string;
  bio: string;
  skills: string[];
  availability: Availability;
  isProfessional: boolean;
  visible: boolean;
};

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export type RequestType = 'networking' | 'mentorship' | 'referral';

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  networking: 'Professional networking',
  mentorship: 'Mentorship / career guidance',
  referral: 'Referral request',
};

export type ConnectionRequest = {
  id: string;
  fromId: string;
  toId: string;
  requestType: RequestType;
  message: string;
  status: RequestStatus;
  createdAt: string;
};

export type ConnectionStatus = 'active' | 'completed' | 'cancelled';

export type Connection = {
  id: string;
  requestId: string;
  memberIds: [string, string];
  status: ConnectionStatus;
  since: string;
};

export type ChatMessage = {
  id: string;
  connectionId: string;
  senderId: string;
  text: string;
  time: string;
};

export const CURRENT_USER_ID = 'aisha';

export const AVATAR_COLORS = ['moss', 'gold', 'teal', 'plum', 'clay', 'slate'] as const;

export const SEED_MEMBERS: Record<string, Member> = {
  aisha: {
    id: 'aisha',
    name: 'Aisha Raza',
    initials: 'AR',
    avatarColor: 'moss',
    headline: 'CS Junior @ UCF',
    university: 'University of Central Florida',
    major: 'Computer Science',
    bio: 'Junior studying Computer Science, interested in backend engineering and distributed systems. Looking for a mentor to help navigate internship recruiting.',
    skills: ['Java', 'Python', 'SQL', 'Data Structures'],
    availability: { mentor: false, networking: true, referrals: false },
    isProfessional: false,
    visible: true,
  },
  nida: {
    id: 'nida',
    name: 'Nida Farooq',
    initials: 'NF',
    avatarColor: 'gold',
    headline: 'Finance Sophomore @ Penn State',
    university: 'Penn State University',
    major: 'Finance',
    bio: 'Sophomore exploring corporate finance and investment banking. Active in the Penn State PSA chapter.',
    skills: ['Excel', 'Financial Modeling'],
    availability: { mentor: false, networking: true, referrals: false },
    isProfessional: false,
    visible: true,
  },
  bilal: {
    id: 'bilal',
    name: 'Bilal Ahmed',
    initials: 'BA',
    avatarColor: 'teal',
    headline: 'Software Engineer II @ Microsoft',
    university: 'Penn State University',
    company: 'Microsoft',
    role: 'Software Engineer II',
    industry: 'Technology',
    location: 'Redmond, WA',
    bio: 'Backend engineer on the Azure Storage team. Penn State PSA alum. Happy to talk about distributed systems, interview prep, or breaking into big tech.',
    skills: ['Distributed Systems', 'Go', 'System Design', 'Interview Prep'],
    availability: { mentor: true, networking: true, referrals: true },
    isProfessional: true,
    visible: true,
  },
  sana: {
    id: 'sana',
    name: 'Sana Malik',
    initials: 'SM',
    avatarColor: 'clay',
    headline: 'Investment Banking Associate @ Goldman Sachs',
    university: 'Cornell University',
    company: 'Goldman Sachs',
    role: 'Investment Banking Associate',
    industry: 'Finance',
    location: 'New York, NY',
    bio: 'Cornell alum working in TMT investment banking. Open to mentoring students interested in finance recruiting, but keep referral asks to a minimum for now.',
    skills: ['Financial Modeling', 'Valuation', 'Recruiting'],
    availability: { mentor: true, networking: true, referrals: false },
    isProfessional: true,
    visible: true,
  },
  omar: {
    id: 'omar',
    name: 'Omar Farooq',
    initials: 'OF',
    avatarColor: 'slate',
    headline: 'Product Manager @ Amazon',
    university: 'University of Illinois',
    company: 'Amazon',
    role: 'Product Manager',
    industry: 'Technology',
    location: 'Seattle, WA',
    bio: 'PM on the Alexa devices team. Not currently taking on new mentees, but always glad to expand the network and talk shop.',
    skills: ['Product Strategy', 'Roadmapping'],
    availability: { mentor: false, networking: true, referrals: true },
    isProfessional: true,
    visible: true,
  },
  ayesha: {
    id: 'ayesha',
    name: 'Ayesha Siddiqui',
    initials: 'AS',
    avatarColor: 'moss',
    headline: 'Resident Physician @ Cleveland Clinic',
    university: 'Cleveland State University',
    company: 'Cleveland Clinic',
    role: 'Resident Physician',
    industry: 'Healthcare',
    location: 'Cleveland, OH',
    bio: 'Second-year resident in internal medicine. Glad to mentor pre-med students on the application process and med school life.',
    skills: ['Pre-Med Advising', 'Clinical Research'],
    availability: { mentor: true, networking: false, referrals: false },
    isProfessional: true,
    visible: true,
  },
  hamza: {
    id: 'hamza',
    name: 'Hamza Riaz',
    initials: 'HR',
    avatarColor: 'gold',
    headline: 'Management Consultant @ Deloitte',
    university: 'Illinois Institute of Technology',
    company: 'Deloitte',
    role: 'Management Consultant',
    industry: 'Consulting',
    location: 'Chicago, IL',
    bio: 'Two years into consulting after starting out in a very different major. Happy to talk about case interviews, the switch into consulting, or just Chicago meetups.',
    skills: ['Case Interviews', 'Strategy', 'Client Management'],
    availability: { mentor: true, networking: true, referrals: true },
    isProfessional: true,
    visible: true,
  },
  zara: {
    id: 'zara',
    name: 'Zara Khan',
    initials: 'ZK',
    avatarColor: 'teal',
    headline: 'Corporate Attorney @ Kirkland & Ellis',
    university: 'University of Florida',
    company: 'Kirkland & Ellis',
    role: 'Corporate Attorney',
    industry: 'Law',
    location: 'Washington, DC',
    bio: 'Mergers & acquisitions associate. Open to networking conversations about law school and legal careers.',
    skills: ['M&A', 'Contract Law'],
    availability: { mentor: true, networking: true, referrals: false },
    isProfessional: true,
    visible: true,
  },
};

export const SEED_REQUESTS: ConnectionRequest[] = [
  {
    id: 'r1',
    fromId: 'aisha',
    toId: 'bilal',
    requestType: 'mentorship',
    message: "Hi Bilal! I'm a CS junior at UCF interested in backend engineering and distributed systems. Would love 20 minutes to hear about your path to Microsoft and any internship advice.",
    status: 'pending',
    createdAt: '2 days ago',
  },
  {
    id: 'r2',
    fromId: 'aisha',
    toId: 'zara',
    requestType: 'referral',
    message: "Hi Zara, I'm exploring career paths outside tech and would love to learn more about corporate law. Would you be open to a quick chat?",
    status: 'declined',
    createdAt: '6 days ago',
  },
  {
    id: 'r3',
    fromId: 'aisha',
    toId: 'omar',
    requestType: 'networking',
    message: "Hi Omar, I'd love to learn more about product management at Amazon and how you made the switch from engineering.",
    status: 'expired',
    createdAt: '3 weeks ago',
  },
  {
    id: 'r4',
    fromId: 'aisha',
    toId: 'hamza',
    requestType: 'mentorship',
    message: "Hi Hamza! I'm curious about consulting as a CS major. Would love to hear how you navigated the switch and prepped for case interviews.",
    status: 'accepted',
    createdAt: '3 weeks ago',
  },
  {
    id: 'r5',
    fromId: 'aisha',
    toId: 'sana',
    requestType: 'mentorship',
    message: 'Hi Sana, I have a friend interested in IB recruiting and I wanted to learn more myself too. Would you be open to a short call?',
    status: 'accepted',
    createdAt: '2 months ago',
  },
  {
    id: 'r6',
    fromId: 'nida',
    toId: 'aisha',
    requestType: 'networking',
    message: "Hey Aisha! Fellow PSA member here. I'm exploring what's next after finance internships and saw you're active in the network. Would love to connect.",
    status: 'pending',
    createdAt: '1 day ago',
  },
];

export const SEED_CONNECTIONS: Connection[] = [
  { id: 'c1', requestId: 'r4', memberIds: ['aisha', 'hamza'], status: 'active', since: '3 weeks ago' },
  { id: 'c2', requestId: 'r5', memberIds: ['aisha', 'sana'], status: 'completed', since: '2 months ago' },
];

export const SEED_MESSAGES: ChatMessage[] = [
  { id: 'm1', connectionId: 'c1', senderId: 'hamza', text: "Hey Aisha! Great to connect, happy to share how I moved from CS into consulting.", time: '3 weeks ago' },
  { id: 'm2', connectionId: 'c1', senderId: 'aisha', text: "Thank you so much! Would sometime next week work for a quick call?", time: '3 weeks ago' },
  { id: 'm3', connectionId: 'c1', senderId: 'hamza', text: "Works for me, I'll send a couple of times over email. Also happy to look at your resume beforehand if you'd like.", time: '2 weeks ago' },
  { id: 'm4', connectionId: 'c1', senderId: 'aisha', text: "That would be amazing, thank you!", time: '2 weeks ago' },
  { id: 'm5', connectionId: 'c2', senderId: 'sana', text: "Thanks for reaching out, happy to talk through recruiting timelines whenever works.", time: '2 months ago' },
  { id: 'm6', connectionId: 'c2', senderId: 'aisha', text: "Thank you so much for the call earlier, this was incredibly helpful!", time: '5 weeks ago' },
  { id: 'm7', connectionId: 'c2', senderId: 'sana', text: "Glad it helped! Best of luck with recruiting this cycle.", time: '5 weeks ago' },
];

export const UNIVERSITIES = Array.from(new Set(Object.values(SEED_MEMBERS).map(m => m.university))).sort();
export const INDUSTRIES = Array.from(new Set(Object.values(SEED_MEMBERS).map(m => m.industry).filter(Boolean))) as string[];
export const COMPANIES = Array.from(new Set(Object.values(SEED_MEMBERS).map(m => m.company).filter(Boolean))) as string[];
