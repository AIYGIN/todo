import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { apiMockServer } from "@/apis/api.mock-server";
import {
  getEnterprisesControllerGetDividendAnalysisMockHandler,
  getEnterprisesControllerGetQuantsInfoMockHandler,
} from "@/apis/generated/dividend-analysis/dividend-analysis.msw";
import { getEnterprisesControllerGetQuantsInfoMockHandler as getEnterprisesControllerGetOverviewMockHandler } from "@/apis/generated/enterprises/enterprises.msw";
import type {
  EnterpriseQuantInfoDto,
  GetEnterpriseDividendAnalysisResponseDto,
  GetEnterpriseQuantsInfoResponseDto,
} from "@/apis/generated/model";
import { DividendMetricDetailTable } from "@/components/investment/modules/DividendMetricDetailTable";

import { DividendAnalysisPage, DividendAnalysisTemplate } from "./index";

const disclaimers = [
  "表示内容は参考情報です。",
  "データは遅延または欠損する場合があります。",
];

const createScoreBreakdown = (
  fcfScore: number | null,
  isFcfNotApplicable = false,
) => ({
  fcf: {
    score: fcfScore ?? 0,
    maxScore: 20,
    isNotApplicable: isFcfNotApplicable,
  },
  dividendCutHistory: { score: 18, maxScore: 20, periodYears: 10 },
  dividendGrowth: { score: 16, maxScore: 20, periodYears: 10 },
  payoutRatio: { score: 4, maxScore: 15 },
  dividendYield: { score: 9, maxScore: 10 },
  financialMetrics: { score: 13, maxScore: 20 },
});

const enterprises: EnterpriseQuantInfoDto[] = [
  {
    symbolId: "2914",
    companyName: "日本たばこ産業",
    sector: "食料品",
    rank: 1,
    totalScore: 92.4,
    judgement: "参考スコア",
    safetyLabel: "safe",
    scoreBreakdown: createScoreBreakdown(15),
    latestDividendYield: 4.8,
    isFinancialBusiness: false,
    isFcfNotApplicable: false,
    updatedAt: "2026-06-25T09:00:00.000Z",
    dataAsOfDate: "2026-06-24",
  },
  {
    symbolId: "8316",
    companyName: "三井住友フィナンシャルグループ",
    sector: "銀行業",
    rank: 2,
    totalScore: 90.1,
    judgement: "参考スコア",
    safetyLabel: "safe",
    scoreBreakdown: createScoreBreakdown(null, true),
    latestDividendYield: 3.9,
    isFinancialBusiness: true,
    isFcfNotApplicable: true,
    updatedAt: "2026-06-25T09:00:00.000Z",
    dataAsOfDate: "2026-06-24",
  },
];

const quantsInfoResponse: GetEnterpriseQuantsInfoResponseDto = {
  enterprises,
  updatedAt: "2026-06-25T09:00:00.000Z",
  dataAsOfDate: "2026-06-24",
  isRealtime: false,
  disclaimers,
};

const createOverviewItem = (
  index: number,
  dividendScore: number,
): EnterpriseQuantInfoDto => ({
  rank: index,
  symbolId: `R2${String(index).padStart(3, "0")}`,
  companyName: `R2高配当候補${String(index).padStart(2, "0")}`,
  dividendScore,
  dividendYield: 2 + index / 100,
  payoutRatio: 30 + index / 10,
  per: 10 + index / 10,
  pbr: 1 + index / 100,
  roe: 8 + index / 10,
  equityRatio: 40 + index / 10,
  freeCashFlowStatus: "AVAILABLE",
  missingFields: [],
  warnings: [],
});

const createOverviewResponse = (
  items: EnterpriseQuantInfoDto[],
): GetEnterpriseQuantsInfoResponseDto => ({
  scoreVersion: "dividend-bff-r2",
  asOf: "2026-06-30",
  sort: "dividendScore",
  order: "desc",
  items,
});

const createCurrentDetailResponse = (
  enterprise: EnterpriseQuantInfoDto,
): GetEnterpriseDividendAnalysisResponseDto =>
  ({
    symbolId: enterprise.symbolId,
    companyName: enterprise.companyName,
    scoreVersion: "dividend-bff-r2",
    asOf: "2026-06-30",
    rank: enterprise.rank,
    dividendScore: enterprise.dividendScore,
    metrics: {
      dividendYield: enterprise.dividendYield,
      payoutRatio: enterprise.payoutRatio ?? null,
      per: enterprise.per ?? null,
      pbr: enterprise.pbr ?? null,
      roe: enterprise.roe ?? null,
      equityRatio: enterprise.equityRatio ?? null,
      freeCashFlow: 1234567890,
      freeCashFlowStatus: enterprise.freeCashFlowStatus,
    },
    analysis: {
      summary: "scoreBreakdownなしの現行詳細DTOです",
      positiveFactors: [],
      riskFactors: [],
    },
    missingFields: [],
    warnings: [],
  }) as GetEnterpriseDividendAnalysisResponseDto;

const createDetail = (
  enterprise: EnterpriseQuantInfoDto,
): GetEnterpriseDividendAnalysisResponseDto => ({
  symbolId: enterprise.symbolId,
  companyName: enterprise.companyName,
  sector: enterprise.sector,
  totalScore: enterprise.totalScore,
  judgement: "参考スコア",
  safetyLabel: enterprise.safetyLabel,
  metrics: {
    fcf: enterprise.isFcfNotApplicable ? null : 120000000000,
    payoutRatio: 42.5,
    dividendGrowthRate10y: 5.2,
    dividendCutCount10y: 0,
    per: 14.2,
    pbr: 1.4,
    roe: 9.6,
  },
  scoreBreakdown: {
    fcf: {
      score: enterprise.isFcfNotApplicable ? null : 15,
      maxScore: 20,
      isNotApplicable: enterprise.isFcfNotApplicable,
      reason: enterprise.isFcfNotApplicable
        ? "金融業のためFCFは評価対象外です"
        : "FCFを確認できます",
    },
    dividendCutHistory: {
      score: 18,
      maxScore: 20,
      periodYears: 10,
      reason: "10年分の履歴を表示します",
    },
    dividendGrowth: {
      score: 16,
      maxScore: 20,
      periodYears: 10,
      reason: "10年分の推移を表示します",
    },
    payoutRatio: {
      score: 4,
      maxScore: 15,
      reason: "配当性向スコアを表示します",
    },
    dividendYield: {
      score: 9,
      maxScore: 10,
      reason: "配当利回りスコアを表示します",
    },
    financialMetrics: {
      score: 13,
      maxScore: 20,
      reason: "財務指標を表示します",
    },
  },
  analysisSummary: null,
  isFinancialBusiness: enterprise.isFinancialBusiness,
  isFcfNotApplicable: enterprise.isFcfNotApplicable,
  dataSources: [{ name: "J-Quants mock", asOfDate: "2026-06-24" }],
  updatedAt: "2026-06-25T09:05:00.000Z",
  dataAsOfDate: "2026-06-24",
  scoreVersion: "dividend-poc-v1",
  isRealtime: false,
  disclaimers,
});

const details = Object.fromEntries(
  enterprises.map((enterprise) => [
    enterprise.symbolId,
    createDetail(enterprise),
  ]),
);

const useDividendSuccessHandlers = () => {
  apiMockServer.use(
    getEnterprisesControllerGetQuantsInfoMockHandler(quantsInfoResponse),
    getEnterprisesControllerGetDividendAnalysisMockHandler(({ params }) => {
      const symbolId = String(params.symbolId);
      return details[symbolId] ?? createDetail(enterprises[0]);
    }),
  );
};

describe("DividendAnalysisPage", () => {
  it("API成功時に一覧、データ鮮度、非リアルタイム、免責注記を表示する", async () => {
    useDividendSuccessHandlers();

    render(<DividendAnalysisPage />);

    expect(
      await screen.findByRole("heading", { name: "高配当分析" }),
    ).toBeInTheDocument();
    expect(await screen.findAllByText("日本たばこ産業")).toHaveLength(1);
    expect(
      screen.getByText("三井住友フィナンシャルグループ"),
    ).toBeInTheDocument();
    expect(screen.getByText("2銘柄")).toBeInTheDocument();
    expect(
      screen.getByText("データ更新: 2026-06-25 09:00"),
    ).toBeInTheDocument();
    expect(screen.getByText("データ基準日: 2026-06-24")).toBeInTheDocument();
    expect(
      screen.getByText("リアルタイムデータではありません"),
    ).toBeInTheDocument();
    expect(screen.getByText("表示内容は参考情報です。")).toBeInTheDocument();
  });

  it("API失敗時に復旧可能なエラー状態を表示する", async () => {
    apiMockServer.use(
      http.get("*/enterprises/quantsInfo", () =>
        HttpResponse.json(
          { message: "高配当分析データを取得できませんでした" },
          { status: 500 },
        ),
      ),
    );

    render(<DividendAnalysisPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "高配当分析データを取得できませんでした",
    );
    expect(screen.getByRole("button", { name: "再試行" })).toBeEnabled();
  });

  it("行選択で詳細を切り替え、金融業のFCFをN/Aとして表示する", async () => {
    useDividendSuccessHandlers();
    const user = userEvent.setup();

    render(<DividendAnalysisPage />);

    await user.click(
      await screen.findByRole("button", {
        name: "8316 三井住友フィナンシャルグループ 詳細を表示",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "三井住友フィナンシャルグループ",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("FCF N/A")).toBeInTheDocument();
    expect(
      screen.getByText(/金融業のためFCFは評価対象外です/),
    ).toBeInTheDocument();
  });

  it("新overview DTOのitemsをdividendScore順の上位50件として一覧表示する", async () => {
    const items = Array.from({ length: 51 }, (_, index) =>
      createOverviewItem(index + 1, index + 1),
    );
    const sortedTopItems = [...items]
      .sort((left, right) => right.dividendScore - left.dividendScore)
      .slice(0, 50);
    const hiddenItem = items[0];

    apiMockServer.use(
      getEnterprisesControllerGetOverviewMockHandler(
        createOverviewResponse(items),
      ),
      getEnterprisesControllerGetDividendAnalysisMockHandler(() =>
        createDetail(enterprises[0]),
      ),
    );

    render(<DividendAnalysisPage />);

    expect(
      await screen.findByRole("button", {
        name: `${sortedTopItems[0].symbolId} ${sortedTopItems[0].companyName} 詳細を表示`,
      }),
    ).toBeInTheDocument();

    const detailButtons = screen.getAllByRole("button", {
      name: /R2\d{3} R2高配当候補\d{2} 詳細を表示/,
    });

    expect(detailButtons).toHaveLength(50);
    expect(detailButtons[0]).toHaveAccessibleName(
      `${sortedTopItems[0].symbolId} ${sortedTopItems[0].companyName} 詳細を表示`,
    );
    expect(detailButtons[49]).toHaveAccessibleName(
      `${sortedTopItems[49].symbolId} ${sortedTopItems[49].companyName} 詳細を表示`,
    );
    expect(screen.getByText("50銘柄")).toBeInTheDocument();
    expect(screen.queryByText(hiddenItem.companyName)).not.toBeInTheDocument();

    const topRow = detailButtons[0].closest("tr");
    expect(topRow).not.toBeNull();
    const topCells = within(topRow as HTMLTableRowElement).getAllByRole("cell");
    expect(topCells[3]).toHaveTextContent("51");
    expect(topCells[3]).toHaveTextContent("/100");
  });

  it("scoreBreakdownなしの詳細DTOでも詳細分析を表示する", async () => {
    const items = [createOverviewItem(1, 88)];
    const user = userEvent.setup();

    apiMockServer.use(
      getEnterprisesControllerGetOverviewMockHandler(
        createOverviewResponse(items),
      ),
      getEnterprisesControllerGetDividendAnalysisMockHandler(() =>
        createCurrentDetailResponse(items[0]),
      ),
    );

    render(<DividendAnalysisPage />);

    await user.click(
      await screen.findByRole("button", {
        name: `${items[0].symbolId} ${items[0].companyName} 詳細を表示`,
      }),
    );

    expect(await screen.findAllByText("配当安全性スコア")).toHaveLength(2);
    const scoreSection = screen.getByRole("region", {
      name: "配当安全性スコア",
    });

    expect(screen.getAllByText("88").length).toBeGreaterThanOrEqual(1);
    expect(
      within(scoreSection).queryByText("スコア内訳"),
    ).not.toBeInTheDocument();

    const metricsRegion = screen.getByRole("article", {
      name: "FCF",
    }).parentElement;
    expect(metricsRegion).not.toBeNull();
    expect(
      within(metricsRegion as HTMLElement).getByText("配当利回り"),
    ).toBeInTheDocument();
    expect(
      within(metricsRegion as HTMLElement).getByText("2.0%"),
    ).toBeInTheDocument();
    expect(
      within(metricsRegion as HTMLElement).getByText("配当性向"),
    ).toBeInTheDocument();
    expect(
      within(metricsRegion as HTMLElement).getByText("30.1%"),
    ).toBeInTheDocument();
    expect(
      within(metricsRegion as HTMLElement).getByText("FCF"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Templateはpropsで渡された状態を表示し選択を委譲する", async () => {
    const user = userEvent.setup();
    const onSelectSymbol = vi.fn();
    const onRetry = vi.fn();

    render(
      <DividendAnalysisTemplate
        detail={null}
        detailStatus="error"
        enterprises={enterprises}
        error="詳細データを取得できませんでした"
        onRetry={onRetry}
        onSelectSymbol={onSelectSymbol}
        overview={quantsInfoResponse}
        selectedSymbolId="2914"
        status="success"
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "8316 三井住友フィナンシャルグループ 詳細を表示",
      }),
    );

    expect(onSelectSymbol).toHaveBeenCalledWith("8316");
  });

  it("Templateはsticky詳細表示中に再試行を委譲する", async () => {
    const user = userEvent.setup();
    const onSelectSymbol = vi.fn();
    const onRetry = vi.fn();

    render(
      <DividendAnalysisTemplate
        detail={null}
        detailStatus="error"
        enterprises={enterprises}
        error="詳細データを取得できませんでした"
        onRetry={onRetry}
        onSelectSymbol={onSelectSymbol}
        overview={quantsInfoResponse}
        selectedSymbolId="2914"
        status="success"
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "2914 日本たばこ産業 詳細を表示",
      }),
    );

    await user.click(screen.getByRole("button", { name: "再試行" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "詳細データを取得できませんでした",
    );
  });

  it("一覧テーブルから内訳指標列を除外し、詳細分析には指標を残す", async () => {
    const user = userEvent.setup();
    const onSelectSymbol = vi.fn();
    const detail = details["2914"];

    render(
      <DividendAnalysisTemplate
        detail={detail}
        detailStatus="success"
        enterprises={enterprises}
        error={null}
        onRetry={vi.fn()}
        onSelectSymbol={onSelectSymbol}
        overview={quantsInfoResponse}
        selectedSymbolId="2914"
        status="success"
      />,
    );

    const row = screen
      .getByRole("button", {
        name: "2914 日本たばこ産業 詳細を表示",
      })
      .closest("tr");

    expect(row).not.toBeNull();

    const listTable = row?.closest("table");
    expect(listTable).not.toBeNull();

    await user.click(
      screen.getByRole("button", {
        name: "2914 日本たばこ産業 詳細を表示",
      }),
    );

    const detailRegion = screen.getByRole("article", {
      name: "FCF",
    }).parentElement;
    expect(detailRegion).not.toBeNull();

    expect(
      within(detailRegion as HTMLElement).getByText("FCF"),
    ).toBeInTheDocument();
    expect(
      within(detailRegion as HTMLElement).getByText("減配履歴"),
    ).toBeInTheDocument();
    expect(
      within(detailRegion as HTMLElement).getByText("増配率（年平均）"),
    ).toBeInTheDocument();
    expect(
      within(detailRegion as HTMLElement).getByText("配当性向"),
    ).toBeInTheDocument();
    expect(
      within(detailRegion as HTMLElement).getByText("配当利回り"),
    ).toBeInTheDocument();
    expect(
      within(detailRegion as HTMLElement).getByText("財務指標"),
    ).toBeInTheDocument();

    const removedListColumnHeaders = [
      /FCF\s*\(30点\)/,
      /減配履歴\s*\(20点\)/,
      /増配率\s*\(15点\)/,
      /配当性向\s*\(15点\)/,
      /利回り\s*\(10点\)/,
      /財務指標\s*\(10点\)/,
      /利回り\s*\(直近\)/,
    ];

    for (const name of removedListColumnHeaders) {
      expect
        .soft(
          within(listTable as HTMLTableElement).queryByRole("columnheader", {
            name,
          }),
        )
        .not.toBeInTheDocument();
    }

    expect
      .soft(within(row as HTMLTableRowElement).getAllByRole("cell"))
      .toHaveLength(5);
  });

  it("指標詳細テーブルはmetricsとscoreBreakdownから配点、評価、得点、詳細を表示する", () => {
    const detail = details["2914"];

    render(
      <DividendMetricDetailTable
        metrics={detail.metrics}
        scoreBreakdown={detail.scoreBreakdown}
      />,
    );

    expect(screen.getByText("FCF")).toBeInTheDocument();
    expect(screen.getByText("120,000,000,000円")).toBeInTheDocument();
    expect(screen.getAllByText("評価 良好").length).toBeGreaterThan(0);
    expect(screen.getAllByText("得点 15 / 20").length).toBeGreaterThan(0);
    expect(screen.getByText(/詳細: FCFを確認できます/)).toBeInTheDocument();
    expect(screen.getByText("配当利回り")).toBeInTheDocument();
    expect(
      screen.getByText(/詳細: 配当利回りスコアを表示します/),
    ).toBeInTheDocument();
  });

  it("指標詳細テーブルは配当性向と配当利回りに対応するscoreBreakdownを表示する", () => {
    const detail = details["2914"];

    render(
      <DividendMetricDetailTable
        metrics={detail.metrics}
        scoreBreakdown={detail.scoreBreakdown}
      />,
    );

    const payoutRatioCard = screen.getByRole("article", { name: "配当性向" });
    const dividendYieldCard = screen.getByRole("article", {
      name: "配当利回り",
    });

    expect(within(payoutRatioCard).getByText("15点")).toBeInTheDocument();
    expect(
      within(payoutRatioCard).getByText("得点 4 / 15"),
    ).toBeInTheDocument();
    expect(
      within(payoutRatioCard).getByText(/詳細: 配当性向スコアを表示します/),
    ).toBeInTheDocument();

    expect(within(dividendYieldCard).getByText("10点")).toBeInTheDocument();
    expect(
      within(dividendYieldCard).getByText("得点 9 / 10"),
    ).toBeInTheDocument();
    expect(
      within(dividendYieldCard).getByText(/詳細: 配当利回りスコアを表示します/),
    ).toBeInTheDocument();
  });
});
