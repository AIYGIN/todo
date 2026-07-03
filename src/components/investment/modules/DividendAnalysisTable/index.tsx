"use client";

import { StatusBadge } from "@/components/investment";
import type { DividendEnterprise } from "@/hooks/dividendAnalysis";

import { css, cx } from "../../../../../styled-system/css";
import { type InvestmentTone, scoreToTone, toneTokens } from "../../parts/tone";

type DividendAnalysisTableProps = {
  enterprises: DividendEnterprise[];
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string) => void;
};

export function DividendAnalysisTable({
  enterprises,
  selectedSymbolId,
  onSelectSymbol,
}: DividendAnalysisTableProps) {
  if (enterprises.length === 0) {
    return (
      <p className={css({ color: "investment-muted", fontWeight: "700" })}>
        表示できる銘柄はありません
      </p>
    );
  }

  return (
    <div className={css({ overflowX: "auto", pb: "1" })}>
      <table className={tableClass}>
        <thead>
          <tr>
            {[
              "順位",
              "銘柄",
              "セクター",
              "配当安全性スコア\n(100点満点)",
              "判定",
            ].map((header) => (
              <th className={headerCellClass} key={header} scope="col">
                {header.split("\n").map((line) => (
                  <span className={css({ display: "block" })} key={line}>
                    {line}
                  </span>
                ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {enterprises.map((enterprise) => {
            const selected = enterprise.symbolId === selectedSymbolId;
            const tone = scoreToTone(Math.round(enterprise.totalScore));

            return (
              <tr
                aria-selected={selected}
                className={cx(
                  rowClass,
                  selected ? selectedRowClass : undefined,
                )}
                key={enterprise.symbolId}
                onClick={() => onSelectSymbol(enterprise.symbolId)}
              >
                <td className={rankCellClass}>{enterprise.rank}</td>
                <td className={companyCellClass}>
                  <button
                    aria-label={`${enterprise.symbolId} ${enterprise.companyName} 詳細を表示`}
                    className={companyButtonClass}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectSymbol(enterprise.symbolId);
                    }}
                    type="button"
                  >
                    <LogoMark enterprise={enterprise} />
                    <span className={css({ minW: 0 })}>
                      <span className={companyNameClass}>
                        {enterprise.companyName}
                      </span>
                      <span className={symbolClass}>{enterprise.symbolId}</span>
                    </span>
                  </button>
                </td>
                <td className={bodyCellClass}>{enterprise.sector}</td>
                <td className={scoreCellClass}>
                  <ScoreBar score={enterprise.totalScore} tone={tone} />
                </td>
                <td className={badgeCellClass}>
                  <StatusBadge tone={toTone(enterprise.safetyLabel)}>
                    {enterprise.judgement}
                  </StatusBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LogoMark({ enterprise }: { enterprise: DividendEnterprise }) {
  const kind = getLogoKind(enterprise.symbolId);

  return (
    <span className={logoClass} aria-hidden="true">
      {kind === "mitsubishi" ? (
        <span className={mitsubishiLogoClass}>
          <span />
          <span />
          <span />
        </span>
      ) : null}
      {kind === "ntt" ? (
        <span className={nttLogoClass}>
          <span />
        </span>
      ) : null}
      {kind === "mufg" ? (
        <span className={mufgLogoClass}>
          <span />
        </span>
      ) : null}
      {kind === "jt" ? <span className={jtLogoClass}>JT</span> : null}
      {kind === "text" ? (
        <span className={textLogoClass}>
          {enterprise.companyName.slice(0, 2)}
        </span>
      ) : null}
    </span>
  );
}

function ScoreBar({ score, tone }: { score: number; tone: InvestmentTone }) {
  const token = toneTokens[tone];
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className={css({ display: "grid", gap: "1", minW: "150px" })}>
      <p
        className={css({ color: token.ring, fontWeight: "900", lineHeight: 1 })}
      >
        <span className={css({ fontSize: "3xl" })}>{formatNumber(score)}</span>
        <span className={css({ color: "investment-text", fontSize: "sm" })}>
          {" "}
          /100
        </span>
      </p>
      <div className={progressTrackClass}>
        <span
          className={progressFillClass}
          style={{ width: `${pct}%`, backgroundColor: token.ring }}
        />
      </div>
    </div>
  );
}

const tableClass = css({
  borderCollapse: "separate",
  borderSpacing: 0,
  color: "investment-text",
  fontSize: "sm",
  minW: "760px",
  w: "full",
});

const headerCellClass = css({
  color: "#42506c",
  fontSize: "xs",
  fontWeight: "800",
  lineHeight: "1.45",
  pb: "4",
  px: "3",
  textAlign: "center",
  whiteSpace: "nowrap",
});

const rowClass = css({
  cursor: "pointer",
  transition: "background-color 160ms ease, box-shadow 160ms ease",
  "& td": {
    borderTop: "1px solid token(colors.investment-border-soft)",
  },
  _hover: {
    bg: "#f8fbff",
  },
});

const selectedRowClass = css({
  bg: "#fbfdff",
  boxShadow: "inset 0 0 0 2px #3b82f6",
  "& td:first-child": { borderLeftRadius: "8px" },
  "& td:last-child": { borderRightRadius: "8px" },
});

const bodyCellClass = css({
  fontWeight: "800",
  px: "3",
  py: "4",
  textAlign: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
});

const rankCellClass = cx(
  bodyCellClass,
  css({ fontSize: "lg", textAlign: "center", w: "52px" }),
);

const companyCellClass = cx(
  bodyCellClass,
  css({ minW: "220px", textAlign: "left" }),
);

const companyButtonClass = css({
  alignItems: "center",
  bg: "transparent",
  border: 0,
  cursor: "pointer",
  display: "grid",
  gap: "3",
  gridTemplateColumns: "44px minmax(0, 1fr)",
  minH: "54px",
  p: 0,
  textAlign: "left",
  w: "full",
  _focusVisible: {
    outline: "3px solid token(colors.investment-blue-soft)",
    outlineOffset: "2px",
  },
});

const logoClass = css({
  alignItems: "center",
  bg: "white",
  border: "1px solid token(colors.investment-border)",
  borderRadius: "8px",
  display: "inline-flex",
  h: "40px",
  justifyContent: "center",
  lineHeight: 1,
  overflow: "hidden",
  position: "relative",
  w: "40px",
});

const mitsubishiLogoClass = css({
  display: "grid",
  h: "28px",
  placeItems: "center",
  position: "relative",
  w: "28px",
  "& span": {
    bg: "#ef3434",
    display: "block",
    h: "13px",
    position: "absolute",
    transform: "rotate(45deg)",
    w: "13px",
  },
  "& span:nth-child(1)": { top: "1px" },
  "& span:nth-child(2)": { bottom: "2px", left: "2px" },
  "& span:nth-child(3)": { bottom: "2px", right: "2px" },
});

const nttLogoClass = css({
  border: "4px solid #1473d2",
  borderRadius: "999px",
  display: "block",
  h: "26px",
  position: "relative",
  w: "26px",
  "& span": {
    border: "3px solid #1473d2",
    borderLeftColor: "transparent",
    borderRadius: "999px",
    display: "block",
    h: "14px",
    left: "2px",
    position: "absolute",
    top: "2px",
    w: "14px",
  },
});

const mufgLogoClass = css({
  border: "4px solid #ef3434",
  borderRadius: "999px",
  display: "block",
  h: "26px",
  position: "relative",
  w: "26px",
  "& span": {
    bg: "#ef3434",
    borderRadius: "999px",
    display: "block",
    h: "8px",
    left: "5px",
    position: "absolute",
    top: "5px",
    w: "8px",
  },
});

const jtLogoClass = css({
  color: "#16a34a",
  fontSize: "lg",
  fontWeight: "900",
});

const textLogoClass = css({
  color: "investment-muted",
  fontSize: "sm",
  fontWeight: "900",
});

const companyNameClass = css({
  color: "investment-text",
  display: "block",
  fontWeight: "900",
  maxW: "180px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

const symbolClass = css({
  color: "investment-muted",
  display: "block",
  fontSize: "xs",
  fontWeight: "800",
  mt: "1",
});

const scoreCellClass = cx(
  bodyCellClass,
  css({ minW: "170px", textAlign: "left" }),
);
const badgeCellClass = cx(bodyCellClass, css({ minW: "120px" }));

const progressTrackClass = css({
  bg: "#e9eef6",
  borderRadius: "999px",
  h: "7px",
  overflow: "hidden",
  w: "full",
});

const progressFillClass = css({
  borderRadius: "999px",
  display: "block",
  h: "full",
});

function formatNumber(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function getLogoKind(symbolId: string) {
  if (symbolId === "8058") return "mitsubishi";
  if (symbolId === "9432") return "ntt";
  if (symbolId === "8306") return "mufg";
  if (symbolId === "2914") return "jt";
  return "text";
}

function toTone(label: DividendEnterprise["safetyLabel"]) {
  if (label === "safe") {
    return "safe";
  }

  if (label === "neutral") {
    return "watch";
  }

  return "danger";
}
