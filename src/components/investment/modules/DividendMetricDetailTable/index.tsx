import { StatusBadge } from "@/components/investment";
import type { DividendAnalysisDetail } from "@/hooks/dividendAnalysis";

import { css, cx } from "../../../../../styled-system/css";
import type { InvestmentTone } from "../../parts/tone";

type DividendMetricDetailTableProps = {
  metrics: DividendAnalysisDetail["metrics"];
  scoreBreakdown: DividendAnalysisDetail["scoreBreakdown"];
};

export function DividendMetricDetailTable({
  metrics,
  scoreBreakdown,
}: DividendMetricDetailTableProps) {
  if (!scoreBreakdown) {
    return <RawMetricTable metrics={metrics} />;
  }

  const rows = [
    {
      index: 1,
      label: "FCF",
      allocation: scoreBreakdown.fcf.maxScore,
      value:
        scoreBreakdown.fcf.isNotApplicable || metrics.fcf === null
          ? "FCF N/A"
          : formatCurrency(metrics.fcf),
      score: scoreBreakdown.fcf.score,
      maxScore: scoreBreakdown.fcf.maxScore,
      detail: scoreBreakdown.fcf.reason,
    },
    {
      index: 2,
      label: "減配履歴",
      allocation: scoreBreakdown.dividendCutHistory.maxScore,
      value: `${scoreBreakdown.dividendCutHistory.periodYears}年`,
      score: scoreBreakdown.dividendCutHistory.score,
      maxScore: scoreBreakdown.dividendCutHistory.maxScore,
      detail: scoreBreakdown.dividendCutHistory.reason,
    },
    {
      index: 3,
      label: "増配率（年平均）",
      allocation: scoreBreakdown.dividendGrowth.maxScore,
      value: formatOptionalNumber(metrics.dividendGrowthRate10y, "%"),
      score: scoreBreakdown.dividendGrowth.score,
      maxScore: scoreBreakdown.dividendGrowth.maxScore,
      detail: scoreBreakdown.dividendGrowth.reason,
    },
    {
      index: 4,
      label: "配当性向",
      allocation: scoreBreakdown.payoutRatio.maxScore,
      value: formatOptionalNumber(metrics.payoutRatio, "%"),
      score: scoreBreakdown.payoutRatio.score,
      maxScore: scoreBreakdown.payoutRatio.maxScore,
      detail: scoreBreakdown.payoutRatio.reason,
    },
    {
      index: 5,
      label: "配当利回り",
      allocation: scoreBreakdown.dividendYield.maxScore,
      value: "目安レンジ内",
      score: scoreBreakdown.dividendYield.score,
      maxScore: scoreBreakdown.dividendYield.maxScore,
      detail: scoreBreakdown.dividendYield.reason,
    },
    {
      index: 6,
      label: "財務指標\n(PER / PBR / ROE)",
      allocation: scoreBreakdown.financialMetrics.maxScore,
      value: `PER ${formatOptionalNumber(metrics.per)} / PBR ${formatOptionalNumber(
        metrics.pbr,
      )} / ROE ${formatOptionalNumber(metrics.roe, "%")}`,
      score: scoreBreakdown.financialMetrics.score,
      maxScore: scoreBreakdown.financialMetrics.maxScore,
      detail: scoreBreakdown.financialMetrics.reason,
    },
  ];

  return (
    <div className={metricListClass}>
      {rows.map((row) => {
        const tone = getScoreTone(row.score, row.maxScore);

        return (
          <article
            aria-label={row.label.replace("\n", " ")}
            className={metricCardClass}
            key={row.label}
          >
            <div className={metricCardHeaderClass}>
              <div className={metricNameClass}>
                <span className={cx(indexClass, toneTextClass[tone])}>
                  {row.index}
                </span>
                <h4 className={metricTitleClass}>
                  {row.label.split("\n").map((line) => (
                    <span className={css({ display: "block" })} key={line}>
                      {line}
                    </span>
                  ))}
                </h4>
              </div>
              <StatusBadge tone={tone}>
                評価 {getScoreLabel(row.score, row.maxScore)}
              </StatusBadge>
            </div>
            <dl className={metricFactsClass}>
              <div>
                <dt className={metricTermClass}>配点</dt>
                <dd className={metricValueClass}>{row.allocation}点</dd>
              </div>
              <div>
                <dt className={metricTermClass}>得点</dt>
                <dd className={cx(metricValueClass, toneTextClass[tone])}>
                  {formatScore(row.score)} / {row.maxScore}
                </dd>
              </div>
              <div>
                <dt className={metricTermClass}>値</dt>
                <dd className={metricValueClass}>{row.value}</dd>
              </div>
              <div className={metricDetailFactClass}>
                <dt className={metricTermClass}>詳細</dt>
                <dd className={metricDetailValueClass}>{row.detail}</dd>
              </div>
            </dl>
          </article>
        );
      })}
      <p
        className={css({
          color: "investment-muted",
          fontSize: "xs",
          fontWeight: "800",
          mt: "3",
        })}
      >
        ※ 財務指標の配点内訳：ROE（4点）・PER（3点）・PBR（3点）
      </p>
    </div>
  );
}

function RawMetricTable({
  metrics,
}: {
  metrics: DividendAnalysisDetail["metrics"];
}) {
  const rows = [
    {
      label: "配当利回り",
      value: formatOptionalNumber(metrics.dividendYield, "%"),
    },
    {
      label: "配当性向",
      value: formatOptionalNumber(metrics.payoutRatio, "%"),
    },
    {
      label: "PER",
      value: formatOptionalNumber(metrics.per, "倍"),
    },
    {
      label: "PBR",
      value: formatOptionalNumber(metrics.pbr, "倍"),
    },
    {
      label: "ROE",
      value: formatOptionalNumber(metrics.roe, "%"),
    },
    {
      label: "自己資本比率",
      value: formatOptionalNumber(metrics.equityRatio, "%"),
    },
    {
      label: "FCF",
      value: metrics.fcf === null ? "N/A" : formatCurrency(metrics.fcf),
    },
    {
      label: "FCFステータス",
      value: metrics.freeCashFlowStatus,
    },
  ];

  return (
    <div className={rawMetricListClass}>
      {rows.map((row) => (
        <article
          aria-label={row.label}
          className={rawMetricRowClass}
          key={row.label}
        >
          <span className={metricTermClass}>{row.label}</span>
          <strong className={rawMetricValueClass}>{row.value}</strong>
        </article>
      ))}
    </div>
  );
}

const metricListClass = css({
  display: "grid",
  gap: "3",
  minW: 0,
});

const metricCardClass = css({
  bg: "white",
  border: "1px solid token(colors.investment-border-soft)",
  borderRadius: "8px",
  display: "grid",
  gap: "3",
  minW: 0,
  p: "3",
});

const metricCardHeaderClass = css({
  alignItems: "flex-start",
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  justifyContent: "space-between",
  minW: 0,
});

const metricNameClass = css({
  alignItems: "center",
  display: "flex",
  gap: "2",
  minW: 0,
});

const indexClass = css({
  alignItems: "center",
  border: "2px solid currentColor",
  borderRadius: "999px",
  display: "inline-flex",
  flexShrink: 0,
  fontSize: "xs",
  fontWeight: "900",
  h: "6",
  justifyContent: "center",
  w: "6",
});

const metricTitleClass = css({
  color: "investment-text",
  fontSize: "sm",
  fontWeight: "900",
  lineHeight: "1.35",
  m: 0,
  overflowWrap: "anywhere",
});

const metricFactsClass = css({
  display: "grid",
  gap: "2",
  gridTemplateColumns: {
    base: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
  },
  m: 0,
  minW: 0,
});

const metricDetailFactClass = css({
  gridColumn: { base: "auto", sm: "1 / -1" },
  minW: 0,
});

const metricTermClass = css({
  color: "investment-muted",
  display: "block",
  fontSize: "xs",
  fontWeight: "800",
  lineHeight: "1.4",
});

const metricValueClass = css({
  color: "investment-text",
  fontSize: "sm",
  fontWeight: "900",
  lineHeight: "1.45",
  m: 0,
  overflowWrap: "anywhere",
});

const metricDetailValueClass = css({
  color: "investment-muted",
  fontSize: "sm",
  fontWeight: "800",
  lineHeight: "1.55",
  m: 0,
  overflowWrap: "anywhere",
});

const rawMetricListClass = css({
  bg: "white",
  border: "1px solid token(colors.investment-border-soft)",
  borderRadius: "8px",
  display: "grid",
  minW: 0,
});

const rawMetricRowClass = css({
  alignItems: "start",
  borderBottom: "1px solid token(colors.investment-border-soft)",
  display: "grid",
  gap: "2",
  gridTemplateColumns: "minmax(96px, 0.9fr) minmax(0, 1.1fr)",
  p: "3",
  _last: {
    borderBottom: "0",
  },
});

const rawMetricValueClass = css({
  color: "investment-text",
  fontSize: "sm",
  fontWeight: "900",
  lineHeight: "1.45",
  overflowWrap: "anywhere",
  textAlign: "right",
});

const toneTextClass: Record<InvestmentTone, string> = {
  safe: css({ color: "investment-green" }),
  good: css({ color: "investment-green" }),
  watch: css({ color: "investment-orange" }),
  warning: css({ color: "investment-orange" }),
  danger: css({ color: "investment-red" }),
  neutral: css({ color: "investment-blue" }),
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 1,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 0,
  }).format(value)}円`;
}

function formatOptionalNumber(value: unknown, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "N/A";
  }

  return `${formatNumber(value)}${suffix}`;
}

function formatScore(score: number | null) {
  return score === null ? "N/A" : formatNumber(score);
}

function getScoreLabel(score: number | null, maxScore: number) {
  if (score === null) {
    return "対象外";
  }

  const ratio = score / maxScore;
  if (ratio >= 0.85) {
    return "満点";
  }

  if (ratio >= 0.7) {
    return "良好";
  }

  if (ratio >= 0.45) {
    return "注意";
  }

  return "要確認";
}

function getScoreTone(score: number | null, maxScore: number): InvestmentTone {
  if (score === null) {
    return "neutral";
  }

  const ratio = score / maxScore;
  if (ratio >= 0.7) {
    return "safe";
  }

  if (ratio >= 0.45) {
    return "warning";
  }

  return "danger";
}
