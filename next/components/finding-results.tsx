"use client";
import { ChartNoAxesColumnIncreasing, Download } from "lucide-react";
import {
  displayFinding,
  MODEL_NAMES,
  type FindingName,
  type ModelId,
  type Prediction,
} from "@/lib/analysis";
import type { CSSProperties } from "react";

type Props = {
  results: Partial<Record<ModelId, Prediction>>;
  selected: FindingName;
  onSelect: (finding: FindingName) => void;
  aboveOnly: boolean;
  onFilter: (value: boolean) => void;
  busy: boolean;
  onExport: () => void;
};
export function FindingResults({
  results,
  selected,
  onSelect,
  aboveOnly,
  onFilter,
  busy,
  onExport,
}: Props) {
  const ids = (Object.keys(results) as ModelId[]).filter((id) => results[id]);
  const first = results[ids[0]];
  const rows =
    first?.findings
      .filter(
        (row) =>
          !aboveOnly ||
          ids.some(
            (id) =>
              results[id]?.findings.find((item) => item.finding === row.finding)
                ?.above_threshold,
          ),
      )
      .sort(
        (a, b) =>
          Math.max(
            ...ids.map(
              (id) =>
                results[id]?.findings.find((row) => row.finding === b.finding)
                  ?.score || 0,
            ),
          ) -
          Math.max(
            ...ids.map(
              (id) =>
                results[id]?.findings.find((row) => row.finding === a.finding)
                  ?.score || 0,
            ),
          ),
      ) || [];
  return (
    <section className="findings-panel" aria-labelledby="findings-heading">
      <div className="panel-heading">
        <div>
          <span className="step-label">02 / MODEL OUTPUT</span>
          <h2 id="findings-heading">Finding scores</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Export analysis as JSON"
          title="Export analysis as JSON"
          onClick={onExport}
          disabled={!first || busy}
        >
          <Download size={18} />
        </button>
      </div>
      {!first ? (
        <div className="results-empty">
          <ChartNoAxesColumnIncreasing size={30} strokeWidth={1.2} />
          <h3>{busy ? "Reading the image…" : "Ready when you are."}</h3>
          <p>
            {busy
              ? "The selected model is working. Its actual scores will appear here."
              : "Choose an image and run an analysis to see all 14 finding scores."}
          </p>
        </div>
      ) : (
        <>
          <div className="results-summary">
            {ids.map((id) => (
              <span key={id}>
                <strong>
                  {
                    results[id]!.findings.filter((item) => item.above_threshold)
                      .length
                  }
                </strong>{" "}
                above threshold <small>{MODEL_NAMES[id]}</small>
              </span>
            ))}
          </div>
          <div
            className="results-filter"
            role="group"
            aria-label="Filter finding scores"
          >
            <button aria-pressed={!aboveOnly} onClick={() => onFilter(false)}>
              All 14 findings
            </button>
            <button aria-pressed={aboveOnly} onClick={() => onFilter(true)}>
              Above threshold
            </button>
          </div>
          <div
            className={`score-columns ${ids.length === 2 ? "two-models" : ""}`}
          >
            <span>Finding</span>
            {ids.map((id) => (
              <span key={id}>{MODEL_NAMES[id]}</span>
            ))}
          </div>
          <div className="score-list" aria-label="Finding score results">
            {rows.map((row) => (
              <button
                className={`score-row ${ids.length === 2 ? "two-models" : ""} ${selected === row.finding ? "is-selected" : ""}`}
                key={row.finding}
                onClick={() => onSelect(row.finding)}
                aria-pressed={selected === row.finding}
                disabled={busy}
                aria-label={`${displayFinding(row.finding)}. ${ids
                  .map((id) => {
                    const item = results[id]!.findings.find(
                      (value) => value.finding === row.finding,
                    )!;
                    return `${MODEL_NAMES[id]} score ${item.score.toFixed(3)}, threshold ${item.threshold.toFixed(3)}, ${item.above_threshold ? "above" : "below"} threshold`;
                  })
                  .join(". ")}`}
              >
                <span className="score-name">
                  <i />
                  {displayFinding(row.finding)}
                </span>
                {ids.map((id) => {
                  const item = results[id]!.findings.find(
                    (value) => value.finding === row.finding,
                  )!;
                  return (
                    <span
                      className={`score-value ${item.above_threshold ? "above" : ""}`}
                      key={id}
                    >
                      <strong>{item.score.toFixed(3)}</strong>
                      <span
                        className="score-track"
                        style={
                          {
                            "--score": `${item.score * 100}%`,
                            "--threshold": `${item.threshold * 100}%`,
                          } as CSSProperties
                        }
                      >
                        <i />
                        <b />
                      </span>
                    </span>
                  );
                })}
              </button>
            ))}
            {!rows.length && (
              <p className="no-findings">
                No finding met its validation threshold. This does not establish
                a clinically normal scan.
              </p>
            )}
          </div>
          <p className="scores-note">
            <span /> Scores range from 0 to 1. The marker shows each finding’s
            validation threshold. Orange scores meet that threshold.
          </p>
          <p className="scores-caution">
            These scores are not calibrated probabilities or a diagnosis.
          </p>
        </>
      )}
    </section>
  );
}
