"use client";
import { ChartNoAxesColumnIncreasing, Download } from "lucide-react";
import {
  displayFinding,
  MODEL_NAMES,
  type FindingName,
  type ModelId,
  type Prediction,
} from "@/lib/analysis";
import { PieChart } from "./charts/pie-chart";
import { PieSlice } from "./charts/pie-slice";
import { PieCenter } from "./charts/pie-center";
import { useState, type CSSProperties } from "react";
import { BarChart } from "./charts/bar-chart";
import { Bar } from "./charts/bar";
import { BarXAxis } from "./charts/bar-x-axis";
import { Grid } from "./charts/grid";

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
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");
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
          <div className="chart-switch" role="tablist" aria-label="Chart representation">
            {(["bar", "pie"] as const).map(type => <button key={type} id={`chart-tab-${type}`} role="tab" aria-selected={chartType === type} aria-controls="finding-chart-panel" tabIndex={chartType === type ? 0 : -1} onKeyDown={event => {if(event.key === "ArrowLeft" || event.key === "ArrowRight") {event.preventDefault(); const next = type === "bar" ? "pie" : "bar"; setChartType(next); document.getElementById(`chart-tab-${next}`)?.focus();}}} onClick={() => setChartType(type)}>{type === "bar" ? "Bar chart" : "Pie chart"}</button>)}
          </div>
          <div id="finding-chart-panel" role="tabpanel" aria-labelledby={`chart-tab-${chartType}`}>
          {chartType === "bar" ? <>
            <div className="bar-model-key">{ids.map((id, index) => <span key={id} style={{color:index === 0 ? "var(--orange)" : "var(--chart-comparison)"}}>{MODEL_NAMES[id]}</span>)}<small>Scroll horizontally to explore all findings →</small></div>
            <div className="vertical-chart-scroll" tabIndex={0} role="region" aria-label="Scrollable vertical finding score chart">
              <BarChart className="vertical-finding-chart" data={first.findings.map(row => Object.fromEntries([["name", displayFinding(row.finding)], ...ids.map(id => [id, results[id]!.findings.find(item => item.finding === row.finding)!.score])]))} xDataKey="name" aspectRatio="auto" orientation="vertical" margin={{left:24,right:24,top:30,bottom:65}}>
                <Grid horizontal />
                {ids.map((id,index) => <Bar key={id} dataKey={id} fill={index === 0 ? "var(--orange)" : "var(--chart-comparison)"} showValue valueLabelPosition="top" valueLabelFormatter={value => value.toFixed(3)} valueLabelColor="var(--text)" animate={false} />)}
                <BarXAxis showAllLabels />
              </BarChart>
            </div>
          </> : <div className="model-donuts">
            {ids.map((id) => {
              const findings = results[id]!.findings;
              const colors = ["#e77e50", "#76b6d2", "#b49bdd", "#d6b85c", "#72b895", "#de8ca5", "#8eabc8", "#b6be70", "#c5966b", "#70bbb8", "#a9a3e3", "#d295bd", "#b7aaa0", "#85a56d"];
              const data = findings.map((item, i) => ({label: displayFinding(item.finding), value: item.score, color: colors[i % colors.length]}));
              const total = data.reduce((sum, item) => sum + item.value, 0);
              return <article className="model-donut all-findings-pie" key={id}>
                <div className="pie-heading"><h3>{MODEL_NAMES[id]}</h3><p>All 14 finding scores</p></div>
                <div className="donut-visual" role="img" aria-label={`${MODEL_NAMES[id]}: relative scores for all 14 findings. Exact values are available in the expandable score table.`}>
                  {total > 0 ? <PieChart size={260} innerRadius={75} padAngle={0.008} cornerRadius={2} data={data}>
                    {data.map((item, i) => <PieSlice key={item.label} index={i} hoverEffect="grow" animate={false} />)}
                    <PieCenter>{({label, value, isHovered}) => <div className="donut-center"><strong>{isHovered ? value.toFixed(3) : "14"}</strong><span>{isHovered ? label : "finding scores"}</span></div>}</PieCenter>
                  </PieChart> : <p>All finding scores are zero.</p>}
                </div>

              </article>;
            })}
          </div>
          }
          </div>
          {chartType === "pie" && <p className="pie-explanation">Slice sizes show each finding’s share of the sum of model scores. Findings can coexist; these shares are not disease probabilities. The exact score table includes all 14 findings, including scores too small to form a visible slice. Hover a slice for its finding and score; exact values are below.</p>}
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
          <details className="finding-details"><summary>Exact scores &amp; explanation selection</summary>
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
          </details>
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
