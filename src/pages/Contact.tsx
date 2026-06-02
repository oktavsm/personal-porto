import { ExternalLink, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../components/SectionHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { publicApi, type PublicContactLink } from "../lib/publicApi";

const fallbackContacts: PublicContactLink[] = [
  {
    id: "email",
    type: "email",
    label: "Email",
    value: "oktaavsm@student.ub.ac.id",
    url: "mailto:oktaavsm@student.ub.ac.id",
    isPrimary: true,
    sortOrder: 0,
  },
  { id: "github", type: "github", label: "GitHub", url: "https://github.com/oktavsm", isPrimary: false, sortOrder: 1 },
  { id: "linkedin", type: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/oktaavsm/", isPrimary: false, sortOrder: 2 },
  { id: "instagram", type: "instagram", label: "Instagram", url: "https://instagram.com/oktaavsm", isPrimary: false, sortOrder: 3 },
];

function ContactIcon({ type }: { type: string }) {
  const normalized = type.toLowerCase();
  if (normalized.includes("github")) return <Github size={16} />;
  if (normalized.includes("linkedin")) return <Linkedin size={16} />;
  if (normalized.includes("instagram")) return <Instagram size={16} />;
  if (normalized.includes("email") || normalized.includes("mail")) return <Mail size={16} />;
  return <ExternalLink size={16} />;
}

export function Contact() {
  const [apiContacts, setApiContacts] = useState<PublicContactLink[] | null>(null);
  const contacts = apiContacts && apiContacts.length > 0 ? apiContacts : fallbackContacts;

  useEffect(() => {
    let active = true;

    publicApi.contact().then((response) => {
      if (active && response.data.length > 0) {
        setApiContacts(response.data);
      }
    }).catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const primaryContact = useMemo(() => contacts.find((contact) => contact.isPrimary) ?? contacts[0], [contacts]);
  const secondaryContacts = contacts.filter((contact) => contact.id !== primaryContact.id);

  return (
    <section className="page-section">
      <div className="container contact-layout">
        <SectionHeader
          kicker="Contact"
          title="Let's connect around useful systems"
          description="Reach out for internship opportunities, collaborations, mentoring, project discussions, or anything related to software, Android, AI, automation, and networks."
        />
        <div className="grid grid-2">
          <Card>
            <h3>{primaryContact.label}</h3>
            <p>{primaryContact.value ?? primaryContact.url}</p>
            <Button href={primaryContact.url} variant="primary">
              <ContactIcon type={primaryContact.type} /> Open Contact
            </Button>
          </Card>
          <Card>
            <h3>Links</h3>
            <div className="contact-links">
              {secondaryContacts.map((contact) => (
                <Button href={contact.url} key={contact.id}>
                  <ContactIcon type={contact.type} /> {contact.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
