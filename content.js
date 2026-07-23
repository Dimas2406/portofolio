/* ================================================================
   EDIT YOUR PORTFOLIO HERE
   Change text between quotes, add/remove items, then save the file.
   ================================================================ */
window.portfolio = {
  availability: "Available for internships & junior roles",
  heroTitle: "Hi, I’m Dimas.<br><em>I build websites.</em>",
  heroIntro: "I’m an Information Systems student at Telkom University who enjoys frontend development. I turn designs into responsive, practical websites and keep learning through real projects.",
  about: "I like working where design meets code: translating a layout into reusable components, making it work well on different screens, and connecting it to the backend when needed. Right now, I’m strengthening my React and full-stack skills while looking for a team where I can contribute and learn from experienced developers.",
  facts: [
    { number: "02+", label: "Projects shipped" },
    { number: "03", label: "Languages spoken" },
    { number: "2027", label: "Expected graduation" }
  ],
  projects: [
    {
      number: "01", title: "Company Portfolio", company: "PT. Niuva Inovasi Utama", year: "2026", category: "Frontend",
      description: "I helped rebuild the company portfolio frontend, including responsive layouts, scroll interactions, and project filtering, then connected it to the existing FastAPI application.",
      tech: ["React 19", "Tailwind CSS", "Framer Motion", "FastAPI"],
      color: "blue", link: ""
    },
    {
      number: "02", title: "Library Management", company: "Independent project", year: "2025", category: "Full-Stack",
      description: "A web application for librarians and members to manage books, borrowing records, inventory, and role-based access in one place.",
      tech: ["Laravel", "PHP", "MySQL", "JavaScript"],
      color: "orange", link: ""
    }
  ],
  timeline: [
    { period: "2026", role: "Frontend Developer", place: "PT. Niuva Inovasi Utama", type: "Project experience" },
    { period: "2026", role: "Head of Division", place: "Telkom University National Futsal Championship", type: "Organization" },
    { period: "2023 — 2027", role: "B.S. Information Systems", place: "Telkom University, Bandung", type: "Education" },
    { period: "2020 — 2023", role: "Natural Sciences", place: "Islamic Boarding School Al-Barokah", type: "Education" }
  ],
  skills: {
    "Frontend": ["React.js", "Tailwind CSS", "HTML5 / CSS3", "Framer Motion"],
    "Backend": ["Node.js", "Laravel", "FastAPI", "PHP"],
    "Data & tools": ["MySQL", "SQL", "Git / GitHub", "Figma", "Python", "Java"]
  },
  email: "alghazalidimas011@gmail.com",
  socials: [
    { label: "Email", url: "mailto:alghazalidimas011@gmail.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/dimasalgazali-profile240605" },
    { label: "GitHub", url: "https://github.com/Dimas2406" },
    { label: "Instagram", url: "", pending: true }
  ]
};
