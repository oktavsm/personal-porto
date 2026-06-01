import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function Contact() {
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
            <h3>Email</h3>
            <p>oktaavsm@student.ub.ac.id</p>
            <Button href="mailto:oktaavsm@student.ub.ac.id" variant="primary">
              <Mail size={16} /> Send Email
            </Button>
          </Card>
          <Card>
            <h3>Links</h3>
            <div className="contact-links">
              <Button href="https://github.com/oktavsm">
                <Github size={16} /> GitHub
              </Button>
              <Button href="https://www.linkedin.com/in/oktaavsm/">
                <Linkedin size={16} /> LinkedIn
              </Button>
              <Button href="https://instagram.com/oktaavsm">
                <Instagram size={16} /> Instagram
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
