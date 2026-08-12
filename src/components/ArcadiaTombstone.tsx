import Image from "next/image";
import { TEAM } from "@/lib/team";

export function ArcadiaTombstone() {
  return (
    <main className="tombstone">
      <section className="tombstone-hero" aria-label="Arcadia farewell">
        <div className="tombstone-hero-media" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/arcadia-hero.svg"
            alt=""
            className="tombstone-hero-image"
          />
          <div className="tombstone-scanlines" />
          <div className="tombstone-stars" />
        </div>

        <div className="tombstone-hero-copy">
          <p className="tombstone-brand">Arcadia</p>
          <h1 className="tombstone-title">Game over — for now.</h1>
          <p className="tombstone-lede">
            Due to commitment and resource constraints, the team has decided to
            wind down Arcadia. Thank you for playing along.
          </p>
          <div className="tombstone-cta-group">
            <a className="pixel-btn pixel-btn-primary" href="#credits">
              Meet the party
            </a>
            <a className="pixel-btn pixel-btn-ghost" href="#next">
              Continue?
            </a>
          </div>
        </div>
      </section>

      <section id="next" className="tombstone-section">
        <h2 className="section-title">More to come</h2>
        <p className="section-copy">
          Arcadia is resting, not the end of the road. Future projects are on the
          horizon — different levels, same curiosity. Stay tuned for what we
          build next.
        </p>
      </section>

      <section id="credits" className="tombstone-section tombstone-credits">
        <h2 className="section-title">Credits</h2>
        <p className="section-copy">
          Thanks to every supporter who tried Arcadia, shared feedback, and kept
          the save file warm. Special thanks to the team that shipped it.
        </p>

        <ul className="credits-list">
          {TEAM.map((member) => (
            <li key={member.linkedin} className="credit-item">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="credit-link"
              >
                <span className="credit-portrait">
                  <Image
                    src={member.image}
                    alt=""
                    width={96}
                    height={96}
                    className="credit-photo"
                  />
                </span>
                <span className="credit-meta">
                  <span className="credit-name">{member.name}</span>
                  <span className="credit-role">{member.role}</span>
                  <span className="credit-linkedin">LinkedIn →</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <p className="tombstone-end" aria-hidden="true">
        <span className="blink">▶</span> insert coin to continue
      </p>
    </main>
  );
}
