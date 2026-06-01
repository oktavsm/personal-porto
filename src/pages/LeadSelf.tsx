import { SectionHeader } from "../components/SectionHeader";
import { Card } from "../components/ui/Card";
import { media } from "../data/media";

const evidenceCards = [
  {
    title: "Volunteer Typist — PLD UB",
    text: "Social Intelligence and empathy appeared when I helped make lecture information accessible for students with disabilities.",
  },
  {
    title: "Camp Daniel",
    text: "Structure and perseverance appeared when I led a committee by managing timelines, communication, and coordination across divisions.",
  },
  {
    title: "Titipin",
    text: "Usefulness and system thinking appeared when I tried to centralize scattered jastip and preloved activities into a clearer platform.",
  },
  {
    title: "n8n Automation",
    text: "Automation and problem-solving appeared when I built workflows to reduce repetitive checking of academic and personal information.",
  },
];

export function LeadSelf() {
  return (
    <section className="page-section">
      <div className="container">
        <SectionHeader
          kicker="Lead Self Journey"
          title="Understanding the system within myself"
          description="This page summarizes the reflections behind my identity, values, mission, and self-symbol during the Lead Self journey. It is not a collection of labels. It is a map of how I understand the way I think, respond, build, and grow."
        />

        <div className="leadself-grid">
          <Card className="identity-card">
            <div className="section-kicker">Who am I?</div>
            <h2>A steady mind who turns scattered problems into systems that help.</h2>
            <p>
              After going through The Weapon and The Self, I learned to see myself beyond labels such as scholar,
              student, leader, speaker, or organization member. Those roles are part of my journey, but they are not the
              deepest definition of who I am.
            </p>
            <p>
              I understand myself more through the way I think, respond, and build. I tend to observe before reacting,
              organize before executing, and look for ways to make things work better.
            </p>
          </Card>
          <Card className="image-card">
            <img src={media.profile} alt="Oktavianus Samuel Minarto" />
          </Card>
        </div>

        <div className="grid grid-2">
          <Card>
            <h3>Color Code: White</h3>
            <p>
              My dominant Color Code is White, with peace as the main motivation. For me, White does not mean being
              passive or avoiding responsibility. It means I naturally value calmness, emotional stability, and
              thoughtful response.
            </p>
            <p>
              I am not comfortable with unnecessary conflict or emotionally explosive situations. When I face tension, I
              usually try to create enough space to think clearly before responding.
            </p>
            <p>
              Calmness is not passivity. It is the space I create before choosing a response.
            </p>
          </Card>
          <Card>
            <h3>Signature Strengths: Social Intelligence & Perseverance</h3>
            <p>
              Social Intelligence helps me read situations, understand people&apos;s needs, and adjust how I communicate.
              I do not always need to be the loudest person in the room to understand what is happening.
            </p>
            <p>
              Perseverance helps me continue even when the process feels tiring. My perseverance is not always loud or
              dramatic. It often appears as quiet consistency.
            </p>
          </Card>
        </div>

        <div className="containerless-split" id="self-symbol">
          <div>
            <div className="section-kicker">Self-symbol</div>
            <h2>Core Server</h2>
            <p>
              A core server is not always seen, but it keeps the system connected. It receives, processes, organizes,
              and distributes information. It supports many connections at once. It does not need to be the most visible
              part of the network, but when it fails, the whole system can be affected.
            </p>
            <p>
              This symbol is close to the way I understand myself. I am not always the most vocal person in a group, but
              I often care about whether the system works: whether the timeline is clear, whether communication flows,
              whether people understand their roles, and whether the final result is useful.
            </p>
            <p>
              I do not need to be the loudest part of the system. I want to be a part that helps the system work better.
            </p>
          </div>
          <div className="self-symbol-visual" aria-label="Core Server self-symbol illustration">
            <img src={media.coreServer} alt="Core Server self-symbol" />
          </div>
        </div>

        <Card className="reflection-card">
          <div className="section-kicker">Empathy evidence</div>
          <h2>Accessibility taught me what usefulness really means.</h2>
          <p>
            My early experience as a volunteer typist at Pusat Layanan Disabilitas Universitas Brawijaya helped me see
            that support can be quiet but meaningful. It deepened my empathy and became one of the values I carried into
            my TELADAN journey.
          </p>
          <img src={media.pldVolunteer} alt="PLD UB volunteer documentation" />
        </Card>

        <Card className="mission-card">
          <div className="section-kicker">Mission</div>
          <h2>What I want to build from here</h2>
          <p>
            My mission is to build useful systems that turn scattered problems into structured, accessible, and reliable
            solutions.
          </p>
          <p>
            This mission comes from the pattern I found in myself. I often feel meaningful when I can take something
            scattered, repetitive, inefficient, or unclear, then make it easier to understand and use.
          </p>
          <p>
            Software engineering, Android development, automation, AI, and network systems are different ways for me to
            build systems that help people.
          </p>
        </Card>

        <SectionHeader
          kicker="Evidence in practice"
          title="Where this reflection appears in real life"
          description="The reflection is not meant to stay abstract. It shows up in the way I serve, lead, teach, and build."
        />
        <div className="grid grid-4">
          {evidenceCards.map((card) => (
            <Card key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </Card>
          ))}
        </div>

        <Card className="closing-reflection-card">
          <h2>I am still being built.</h2>
          <p>
            Lead Self did not give me a final answer about who I am. Instead, it helped me see the pattern behind my
            choices, strengths, and struggles.
          </p>
          <p>
            I am still learning how to be more assertive, more focused, and more honest with what I want. But for now, I
            understand one thing more clearly: I feel most like myself when I build systems that help.
          </p>
        </Card>
      </div>
    </section>
  );
}
