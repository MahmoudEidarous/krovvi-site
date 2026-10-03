"use client";

/**
 * A diagram in a shared answer (a ```mermaid fence), drawn the way the app
 * draws it (catch8 src/lib/diagram.ts diagramPage and components/diagram.tsx):
 * the same Mermaid, the same settings, the same greys, on the answer's card.
 * Mermaid is fetched only when a chat has a diagram, once for the page.
 * Strict security: no scripts, no click handlers and no HTML inside labels,
 * so nothing in the drawing can run. A drawing Mermaid cannot read is left
 * out, as the app leaves it out.
 */

import { useEffect, useId, useState } from "react";

import { INK } from "@/components/objects/kit";

/** The app's own Mermaid (catch8 assets/mermaid/mermaid-11.17.2.min.txt). */
const MERMAID = "https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.esm.min.mjs";

/** Longer than this is not a diagram (catch8 lib/diagram.ts MAX_DIAGRAM_CHARS). */
const MAX_CHARS = 6000;

/** The app's drawing width, which charts are laid out to. */
const WIDTH = 324;

function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2].map((i) => Math.round(channel(a, i) * (1 - t) + channel(b, i) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** components/diagram.tsx INK, in the page's tokens (the same values). */
const ink = {
  ground: INK.surface,
  node: INK.surfaceHi,
  border: INK.line,
  edge: INK.faint,
  rule: mix(INK.faint, INK.surface, 0.5),
  text: INK.fg,
  soft: INK.muted,
  ladder: [0.14, 0.32, 0.5, 0.64, 0.76].map((t) => mix(INK.fg, INK.line, t)),
};

/** lib/diagram.ts diagramPage's settings, as they are. */
function settings() {
  const scale = (value: string) =>
    Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [
        [`cScale${i}`, value],
        [`cScaleLabel${i}`, ink.text],
        [`cScaleInv${i}`, ink.border],
        [`cScalePeer${i}`, ink.border],
      ]).flat()
    );
  return {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme: "base",
    htmlLabels: false,
    fontFamily: "-apple-system, system-ui, sans-serif",
    fontSize: 14,
    flowchart: { htmlLabels: false, useMaxWidth: false, curve: "basis", padding: 12, nodeSpacing: 30, rankSpacing: 38, diagramPadding: 2, wrappingWidth: 190 },
    sequence: {
      useMaxWidth: false,
      mirrorActors: false,
      wrap: true,
      width: 84,
      height: 34,
      actorMargin: 24,
      boxMargin: 8,
      boxTextMargin: 4,
      noteMargin: 8,
      messageMargin: 28,
      diagramMarginX: 2,
      diagramMarginY: 2,
      actorFontSize: 14,
      actorFontWeight: 500,
      messageFontSize: 13,
      noteFontSize: 13,
    },
    xyChart: {
      useMaxWidth: false,
      width: WIDTH,
      height: 230,
      titleFontSize: 15,
      titlePadding: 8,
      xAxis: { labelFontSize: 12, titleFontSize: 12, tickLength: 3 },
      yAxis: { labelFontSize: 12, titleFontSize: 12, tickLength: 3 },
    },
    themeVariables: {
      darkMode: true,
      background: ink.ground,
      mainBkg: ink.node,
      primaryColor: ink.node,
      primaryTextColor: ink.text,
      primaryBorderColor: ink.border,
      secondaryColor: ink.node,
      secondaryTextColor: ink.text,
      secondaryBorderColor: ink.border,
      tertiaryColor: ink.node,
      tertiaryTextColor: ink.text,
      tertiaryBorderColor: ink.border,
      lineColor: ink.edge,
      textColor: ink.text,
      nodeTextColor: ink.text,
      nodeBorder: ink.border,
      edgeLabelBackground: ink.ground,
      clusterBkg: ink.ground,
      clusterBorder: ink.border,
      titleColor: ink.text,
      actorBkg: ink.node,
      actorBorder: ink.border,
      actorTextColor: ink.text,
      actorLineColor: ink.rule,
      signalColor: ink.edge,
      signalTextColor: ink.text,
      labelBoxBkgColor: ink.node,
      labelBoxBorderColor: ink.border,
      labelTextColor: ink.text,
      loopTextColor: ink.soft,
      noteBkgColor: ink.node,
      noteTextColor: ink.text,
      noteBorderColor: ink.border,
      activationBkgColor: ink.node,
      activationBorderColor: ink.border,
      sequenceNumberColor: ink.ground,
      ...Object.fromEntries(
        Array.from({ length: 8 }, (_, i) => [
          [`git${i}`, ink.ladder[i % ink.ladder.length]],
          [`gitBranchLabel${i}`, ink.ground],
          [`gitInv${i}`, ink.ground],
        ]).flat()
      ),
      commitLabelColor: ink.text,
      commitLabelBackground: ink.node,
      tagLabelColor: ink.text,
      tagLabelBackground: ink.node,
      tagLabelBorder: ink.border,
      quadrant1Fill: ink.node,
      quadrant2Fill: ink.ground,
      quadrant3Fill: ink.node,
      quadrant4Fill: ink.ground,
      quadrantPointFill: ink.text,
      quadrantPointTextFill: ink.text,
      quadrantXAxisTextFill: ink.soft,
      quadrantYAxisTextFill: ink.soft,
      quadrantTitleFill: ink.text,
      quadrantInternalBorderStrokeFill: ink.border,
      quadrantExternalBorderStrokeFill: ink.border,
      xyChart: {
        backgroundColor: ink.ground,
        titleColor: ink.text,
        xAxisLabelColor: ink.soft,
        xAxisTitleColor: ink.soft,
        xAxisTickColor: ink.border,
        xAxisLineColor: ink.border,
        yAxisLabelColor: ink.soft,
        yAxisTitleColor: ink.soft,
        yAxisTickColor: ink.border,
        yAxisLineColor: ink.border,
        plotColorPalette: ink.ladder.join(", "),
      },
      ...scale(ink.node),
      fontSize: "14px",
    },
    themeCSS: [
      `text, tspan { font-family: -apple-system, system-ui, sans-serif; }`,
      `.node rect, .node polygon, .node circle, .node path, .cluster rect { stroke-width: 1px; }`,
      `.node .label text, .nodeLabel, .actor tspan, text.actor { font-weight: 500; }`,
      `.flowchart-link, .edgePath .path, .messageLine0, .messageLine1, .relation { stroke-width: 1.25px; }`,
      `.edgeLabel text, .edgeLabel tspan { font-size: 12.5px; fill: ${ink.soft}; }`,
      `.edgeLabel rect, .labelBkg { opacity: 1 !important; fill: ${ink.ground} !important; }`,
      `marker[id*="zeroOr"] circle, marker[id*="ZERO_OR"] circle { fill: ${ink.ground} !important; stroke: ${ink.edge} !important; }`,
      `.relationshipLabelBox { fill: ${ink.ground} !important; opacity: 1 !important; }`,
      `.messageText { font-size: 13px; fill: ${ink.text}; }`,
      `.actor-line { stroke-width: 1px; }`,
      `marker path, .arrowheadPath { fill: ${ink.edge}; stroke: ${ink.edge}; }`,
    ].join(" "),
  };
}

type MermaidApi = { initialize: (config: unknown) => void; render: (id: string, code: string) => Promise<{ svg: string }> };

let loading: Promise<MermaidApi> | null = null;

/** Mermaid, fetched and set up once for the page. Drawings render one at a time, as Mermaid needs. */
function mermaid(): Promise<MermaidApi> {
  loading ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ MERMAID).then((m: { default: MermaidApi }) => {
    m.default.initialize(settings());
    return m.default;
  });
  return loading;
}

let queue: Promise<unknown> = Promise.resolve();

export function Diagram({ code }: { code: string }) {
  const id = `d${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const clean = code.replace(/\r\n/g, "\n").trim();
  const usable = !!clean && clean.length <= MAX_CHARS;

  useEffect(() => {
    if (!usable) return;
    let live = true;
    const job = queue.then(() => mermaid().then((api) => api.render(id, clean)));
    queue = job.catch(() => undefined);
    job.then(
      (out) => live && setSvg(out.svg),
      () => live && setFailed(true)
    );
    return () => {
      live = false;
    };
  }, [id, clean, usable]);

  if (!usable || failed) return null;
  return (
    <div
      className="mb-3 overflow-x-auto"
      dir="ltr"
      role="img"
      aria-label="Diagram"
      style={{ background: ink.ground, borderRadius: 17, padding: 14, minHeight: svg ? undefined : 96 }}
      // Mermaid's own drawing, made under strict security (sanitized, no scripts or handlers).
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
