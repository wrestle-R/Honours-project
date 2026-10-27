import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  CircleDot,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { LungScene } from "@/components/lung-scene";
import { Workbench } from "@/components/workbench";
import { Brand } from "@/components/brand";
import { Orbital } from "@/components/orbital";
import { Reveal } from "@/components/reveal";

const science = [
  {
    number: "01",
    title: "Learn the patterns.",
    body: "We are training DenseNet121 and a ResNet50 baseline on chest X-rays. Multi-label learning lets a single image have more than one finding.",
    tag: "TRANSFER LEARNING",
  },
  {
    number: "02",
    title: "Make attention visible.",
    body: "Grad-CAM highlights regions that influence a model output. It helps us inspect model behaviour, while keeping the limits of visual explanations in view.",
    tag: "GRAD-CAM EXPLAINABILITY",
  },
  {
    number: "03",
    title: "Measure what matters.",
    body: "The evaluation plan uses patient-level splits, per-finding AUROC and threshold analysis. Real results will be published after training and validation.",
    tag: "REPRODUCIBLE EVALUATION",
  },
];
export default function Home() {
  return (
    <>
      <Reveal />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div id="top" className="page-top">
        <Navigation />
        <main id="main">
          <section className="hero wrap" aria-labelledby="hero-title">
            <div className="hero-main">
              <div className="hero-copy">
                <div className="eyebrow hero-eyebrow">
                  <span className="live-dot" /> EXPLAINABLE MEDICAL IMAGING
                </div>
                <h1 id="hero-title">
                  See beyond
                  <br />
                  <em>the scan.</em>
                </h1>
                <p>
                  A clearer view of chest X-rays.
                  <br />
                  Explore how deep learning sees,
                  <br className="desktop-break" /> and what it pays attention
                  to.
                </p>
                <div className="hero-actions">
                  <a className="button button-primary" href="#workbench">
                    Explore the workbench <ArrowRight size={18} />
                  </a>
                  <a
                    className="hero-scroll"
                    href="#science"
                    aria-label="Discover the science"
                  >
                    <ArrowDown size={18} />
                  </a>
                </div>
                <div className="hero-footnote">
                  <span className="small-line" /> AN HONOURS RESEARCH PROJECT
                </div>
              </div>
              <LungScene />
            </div>
            <div className="hero-facts">
              <div>
                <span className="fact-value">14</span>
                <div>
                  <strong>Radiographic findings</strong>
                  <span>ONE IMAGE. MULTIPLE POSSIBILITIES.</span>
                </div>
              </div>
              <div>
                <span className="fact-value">02</span>
                <div>
                  <strong>Models in comparison</strong>
                  <span>DENSENET121 × RESNET50</span>
                </div>
              </div>
              <div>
                <CircleDot className="fact-icon" size={33} strokeWidth={1} />
                <div>
                  <strong>A view into attention</strong>
                  <span>MAKING THE REASONING VISIBLE.</span>
                </div>
              </div>
            </div>
          </section>
          <div className="research-strip">
            <div className="wrap">
              <span>BUILT AROUND THE QUESTIONS THAT MATTER</span>
              <span>
                Predict <i /> Explain <i /> Evaluate <i /> Understand{" "}
                <ArrowUpRight size={17} />
              </span>
            </div>
          </div>
          <section
            className="workbench-section wrap section-space"
            id="workbench"
            aria-labelledby="workbench-title"
          >
            <div className="section-heading" data-reveal>
              <div>
                <p className="section-kicker">
                  <b>01</b> / THE WORKBENCH
                </p>
                <h2 id="workbench-title">
                  From pixels
                  <br />
                  to <em>perspective.</em>
                </h2>
              </div>
              <div className="section-intro">
                <span className="intro-line" />
                <p>
                  A prediction is the start of a conversation.
                  <br />
                  Explore the image, inspect attention and see the thinking
                  behind the approach.
                </p>
                <span className="availability">
                  <span /> TRY THE INTERACTIVE PREVIEW
                </span>
              </div>
            </div>
            <Workbench />
          </section>
          <section
            className="science-section section-space"
            id="science"
            aria-labelledby="science-title"
          >
            <div className="wrap">
              <div className="section-heading science-heading" data-reveal>
                <div>
                  <p className="section-kicker">
                    <b>02</b> / THE SCIENCE
                  </p>
                  <h2 id="science-title">
                    Built to ask
                    <br />
                    better questions<span className="orange">.</span>
                  </h2>
                </div>
                <div className="section-intro">
                  <p>
                    Prediction is only the beginning.
                    <br />
                    We are building a reproducible way to compare models,
                    inspect attention and understand the limitations.
                  </p>
                </div>
              </div>
              <div className="science-columns">
                {science.map((item) => (
                  <article key={item.number} data-reveal>
                    <span className="science-number">{item.number}</span>
                    <div className="science-diagram" aria-hidden="true">
                      {item.number === "01" ? (
                        <div className="network-diagram">
                          {Array.from({ length: 12 }, (_, i) => (
                            <i key={i} />
                          ))}
                        </div>
                      ) : item.number === "02" ? (
                        <div className="heat-diagram">
                          <i />
                          <i />
                          <i />
                        </div>
                      ) : (
                        <svg viewBox="0 0 160 65">
                          <path
                            d="M5 5v52h150"
                            stroke="currentColor"
                            strokeWidth=".7"
                            opacity=".4"
                            fill="none"
                          />
                          <path
                            d="M5 57C23 15 43 12 58 10S113 7 155 5"
                            stroke="#e16b3b"
                            strokeWidth="2"
                            fill="none"
                          />
                          <path
                            d="M5 57C35 46 35 25 70 20S120 13 155 9"
                            stroke="currentColor"
                            opacity=".6"
                            fill="none"
                          />
                          <path
                            d="M5 57L155 5"
                            stroke="currentColor"
                            strokeDasharray="2 5"
                            opacity=".2"
                          />
                        </svg>
                      )}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                    <span className="science-tag">{item.tag}</span>
                  </article>
                ))}
              </div>
              <div className="dataset-band" data-reveal>
                <div>
                  <span>THE DATASET</span>
                  <strong>NIH ChestX-ray14</strong>
                </div>
                <div>
                  <span>THE TASK</span>
                  <strong>14 finding categories</strong>
                </div>
                <div>
                  <span>THE EVALUATION PLAN</span>
                  <strong>Patient-level splits</strong>
                </div>
                <a
                  href="https://arxiv.org/abs/1705.02315"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Read the NIH ChestX-ray14 dataset paper"
                >
                  <ArrowUpRight size={25} />
                </a>
              </div>
              <p className="science-limitation">
                <InfoDot /> Report-derived labels can be noisy. Attention maps
                do not prove a diagnosis. Both are part of the research, and
                part of what we need to question.
              </p>
            </div>
          </section>
          <section
            className="about-section wrap section-space"
            id="about"
            aria-labelledby="about-title"
          >
            <div className="about-copy" data-reveal>
              <p className="section-kicker">
                <b>03</b> / THE BIGGER PICTURE
              </p>
              <h2 id="about-title">
                A little more
                <br />
                <em>clarity.</em>
              </h2>
              <p className="about-description">
                An honours project exploring what chest X-ray models learn,
                where they look, and where they fall short.
              </p>
              <a className="button button-primary" href="#workbench">
                Explore the demo <ArrowUpRight size={18} />
              </a>
              <p className="training-status">
                <span /> In development. Models are currently training.
              </p>
            </div>
            <Orbital />
            <div className="project-roadmap" data-reveal>
              <span>THE ROAD AHEAD</span>
              <div>
                <Check size={14} />
                <span>Experience & interface</span>
                <small>NOW</small>
              </div>
              <div>
                <span className="roadmap-dot" />
                <span>Model training & evaluation</span>
                <small>IN PROGRESS</small>
              </div>
              <div>
                <span className="roadmap-dot empty" />
                <span>Connected analysis workbench</span>
                <small>UP NEXT</small>
              </div>
            </div>
          </section>
        </main>
        <footer className="footer wrap">
          <div className="footer-top">
            <div>
              <Brand footer />
              <span className="footer-tagline">A CLEARER WAY TO LOOK.</span>
            </div>
            <div className="footer-links">
              <a
                href="https://github.com/wrestle-R/Honours-project"
                target="_blank"
                rel="noreferrer"
              >
                GitHub <ArrowUpRight size={17} />
              </a>
              <a href="#top">
                Back to top <ArrowUp size={16} />
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} LUCENT · HONOURS PROJECT</span>
            <span>An academic research prototype. Not for clinical use.</span>
            <span>
              BUILT WITH CURIOSITY <span className="orange">✳</span>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
function InfoDot() {
  return (
    <span className="info-dot" aria-hidden="true">
      i
    </span>
  );
}
