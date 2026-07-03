import { devtools } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { enterprisesControllerGetDividendAnalysis } from "@/apis/generated/dividend-analysis/dividend-analysis";
import { enterprisesControllerGetQuantsInfo } from "@/apis/generated/enterprises/enterprises";
import type {
  EnterpriseQuantInfoDto,
  EnterpriseScoreBreakdownDto,
  GetEnterpriseDividendAnalysisResponseDto,
  GetEnterpriseQuantsInfoResponseDto,
} from "@/apis/generated/model";

export type DividendAnalysisRequestStatus =
  | "idle"
  | "loading"
  | "success"
  | "empty"
  | "error";

export type DividendEnterprise = EnterpriseQuantInfoDto & {
  sector?: string;
  totalScore: number;
  judgement: string;
  safetyLabel: "safe" | "neutral" | "watch";
  scoreBreakdown: EnterpriseScoreBreakdownDto;
  latestDividendYield: number;
  isFinancialBusiness: boolean;
  isFcfNotApplicable: boolean;
  updatedAt?: string;
  dataAsOfDate?: string;
};
type DividendAnalysisMetricValue = number | null;
type DividendAnalysisScoreBreakdown = EnterpriseScoreBreakdownDto & {
  fcf: EnterpriseScoreBreakdownDto["fcf"] & {
    score: number | null;
    reason?: string;
  };
  dividendCutHistory: EnterpriseScoreBreakdownDto["dividendCutHistory"] & {
    reason?: string;
  };
  dividendGrowth: EnterpriseScoreBreakdownDto["dividendGrowth"] & {
    reason?: string;
  };
  payoutRatio: EnterpriseScoreBreakdownDto["payoutRatio"] & {
    reason?: string;
  };
  dividendYield: EnterpriseScoreBreakdownDto["dividendYield"] & {
    reason?: string;
  };
  financialMetrics: EnterpriseScoreBreakdownDto["financialMetrics"] & {
    reason?: string;
  };
};
export type DividendAnalysisDetail =
  GetEnterpriseDividendAnalysisResponseDto & {
    sector?: string;
    totalScore: number;
    judgement: string;
    safetyLabel: "safe" | "neutral" | "watch";
    metrics: GetEnterpriseDividendAnalysisResponseDto["metrics"] & {
      fcf: DividendAnalysisMetricValue;
      payoutRatio: DividendAnalysisMetricValue;
      dividendGrowthRate10y: DividendAnalysisMetricValue;
      dividendCutCount10y: DividendAnalysisMetricValue;
      per: DividendAnalysisMetricValue;
      pbr: DividendAnalysisMetricValue;
      roe: DividendAnalysisMetricValue;
    };
    scoreBreakdown: DividendAnalysisScoreBreakdown | null;
    analysisSummary?: string | null;
    isFinancialBusiness: boolean;
    isFcfNotApplicable: boolean;
    dataSources?: { name: string; asOfDate: string }[];
    updatedAt?: string;
    dataAsOfDate?: string;
    isRealtime?: boolean;
    disclaimers?: string[];
  };
export type DividendAnalysisOverview =
  Partial<GetEnterpriseQuantsInfoResponseDto> & {
    enterprises: DividendEnterprise[];
    updatedAt: string;
    dataAsOfDate: string;
    isRealtime: boolean;
    disclaimers: string[];
  };

type DividendAnalysisStoreOptions = {
  initialState?: Partial<
    Pick<
      DividendAnalysisStoreState,
      | "overviewStatus"
      | "status"
      | "detailStatus"
      | "overview"
      | "enterprises"
      | "selectedSymbolId"
      | "detail"
      | "error"
    >
  >;
};

export type DividendAnalysisStoreState = {
  overviewStatus: DividendAnalysisRequestStatus;
  status: DividendAnalysisRequestStatus;
  detailStatus: DividendAnalysisRequestStatus;
  overview: DividendAnalysisOverview | null;
  enterprises: DividendEnterprise[];
  selectedSymbolId: string | null;
  detail: DividendAnalysisDetail | null;
  error: string | null;
  load: () => Promise<void>;
  loadList: () => Promise<void>;
  loadDetail: (symbolId: string) => Promise<void>;
  selectSymbol: (symbolId: string) => Promise<void>;
  selectEnterprise: (symbolId: string) => Promise<void>;
  retry: () => Promise<void>;
  resetError: () => void;
};

const defaultState = {
  overviewStatus: "idle",
  status: "idle",
  detailStatus: "idle",
  overview: null,
  enterprises: [],
  selectedSymbolId: null,
  detail: null,
  error: null,
} satisfies Pick<
  DividendAnalysisStoreState,
  | "overviewStatus"
  | "status"
  | "detailStatus"
  | "overview"
  | "enterprises"
  | "selectedSymbolId"
  | "detail"
  | "error"
>;

type LegacyQuantsInfoResponse = {
  enterprises?: EnterpriseQuantInfoDto[];
  updatedAt?: string;
  dataAsOfDate?: string;
  isRealtime?: boolean;
  disclaimers?: string[];
};

const emptyScoreBreakdown = {
  fcf: { score: 0, maxScore: 0, isNotApplicable: false },
  dividendCutHistory: { score: 0, maxScore: 0, periodYears: 0 },
  dividendGrowth: { score: 0, maxScore: 0, periodYears: 0 },
  payoutRatio: { score: 0, maxScore: 0 },
  dividendYield: { score: 0, maxScore: 0 },
  financialMetrics: { score: 0, maxScore: 0 },
} satisfies EnterpriseScoreBreakdownDto;

const toNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const findNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  for (const childValue of Object.values(value)) {
    const found = findNumber(childValue);
    if (found !== null) {
      return found;
    }
  }

  return null;
};

const normalizeDetail = (
  detail: GetEnterpriseDividendAnalysisResponseDto,
  enterprise?: DividendEnterprise,
): DividendAnalysisDetail => {
  const legacyDetail = detail as Partial<DividendAnalysisDetail>;
  const metrics = detail.metrics;
  const isFcfNotApplicable =
    legacyDetail.isFcfNotApplicable ??
    metrics.freeCashFlowStatus === "NOT_APPLICABLE";

  return {
    ...detail,
    sector: legacyDetail.sector ?? enterprise?.sector,
    totalScore: toNumber(legacyDetail.totalScore ?? detail.dividendScore),
    judgement: legacyDetail.judgement ?? "参考スコア",
    safetyLabel:
      legacyDetail.safetyLabel ?? enterprise?.safetyLabel ?? "neutral",
    metrics: {
      ...metrics,
      fcf:
        legacyDetail.metrics?.fcf ??
        (isFcfNotApplicable ? null : findNumber(metrics.freeCashFlow)),
      payoutRatio:
        legacyDetail.metrics?.payoutRatio ?? findNumber(metrics.payoutRatio),
      dividendGrowthRate10y:
        legacyDetail.metrics?.dividendGrowthRate10y ?? null,
      dividendCutCount10y: legacyDetail.metrics?.dividendCutCount10y ?? null,
      per: legacyDetail.metrics?.per ?? findNumber(metrics.per),
      pbr: legacyDetail.metrics?.pbr ?? findNumber(metrics.pbr),
      roe: legacyDetail.metrics?.roe ?? findNumber(metrics.roe),
    },
    scoreBreakdown: legacyDetail.scoreBreakdown ?? null,
    analysisSummary: legacyDetail.analysisSummary ?? detail.analysis?.summary,
    isFinancialBusiness: legacyDetail.isFinancialBusiness ?? false,
    isFcfNotApplicable,
    dataSources: legacyDetail.dataSources,
    updatedAt: legacyDetail.updatedAt ?? detail.asOf,
    dataAsOfDate: legacyDetail.dataAsOfDate ?? detail.asOf,
    isRealtime: legacyDetail.isRealtime ?? false,
    disclaimers: legacyDetail.disclaimers ?? [],
  };
};

const normalizeEnterprise = (
  enterprise: EnterpriseQuantInfoDto,
  rank: number,
): DividendEnterprise => {
  const legacyEnterprise = enterprise as Partial<DividendEnterprise>;
  const totalScore = toNumber(
    legacyEnterprise.totalScore ?? enterprise.dividendScore,
  );
  const isFcfNotApplicable =
    legacyEnterprise.isFcfNotApplicable ??
    enterprise.freeCashFlowStatus === "NOT_APPLICABLE";

  return {
    ...enterprise,
    rank,
    totalScore,
    judgement: legacyEnterprise.judgement ?? "参考スコア",
    safetyLabel: legacyEnterprise.safetyLabel ?? "neutral",
    scoreBreakdown: legacyEnterprise.scoreBreakdown ?? emptyScoreBreakdown,
    latestDividendYield: toNumber(
      legacyEnterprise.latestDividendYield ?? enterprise.dividendYield,
    ),
    isFinancialBusiness: legacyEnterprise.isFinancialBusiness ?? false,
    isFcfNotApplicable,
  };
};

const normalizeOverview = (
  overview: GetEnterpriseQuantsInfoResponseDto,
): DividendAnalysisOverview => {
  // TODO(#34): Replace this compatibility layer once the BFF OpenAPI exposes the
  // detail metadata required by the dividend analysis UI and fixtures are migrated.
  const legacyOverview = overview as LegacyQuantsInfoResponse;
  const hasItems = Array.isArray(overview.items);
  const sourceEnterprises = hasItems
    ? overview.items
    : (legacyOverview.enterprises ?? []);
  const sortedEnterprises = [...sourceEnterprises].sort((left, right) =>
    hasItems
      ? toNumber(right.dividendScore) - toNumber(left.dividendScore)
      : toNumber((right as Partial<DividendEnterprise>).totalScore) -
        toNumber((left as Partial<DividendEnterprise>).totalScore),
  );
  const enterprises = sortedEnterprises
    .slice(0, hasItems ? 50 : sortedEnterprises.length)
    .map((enterprise, index) => normalizeEnterprise(enterprise, index + 1));
  const dataAsOfDate = legacyOverview.dataAsOfDate ?? overview.asOf ?? "";

  return {
    ...overview,
    enterprises,
    updatedAt: legacyOverview.updatedAt ?? dataAsOfDate,
    dataAsOfDate,
    isRealtime: legacyOverview.isRealtime ?? false,
    disclaimers: legacyOverview.disclaimers ?? [],
  };
};

export function createDividendAnalysisStore(
  options: DividendAnalysisStoreOptions = {},
) {
  const initialState = {
    ...defaultState,
    ...options.initialState,
  };

  return createStore<DividendAnalysisStoreState>()(
    devtools(
      (set, get) => {
        const loadDetail = async (symbolId: string) => {
          set(
            { detailStatus: "loading", selectedSymbolId: symbolId },
            false,
            "dividendAnalysis/detail:start",
          );

          try {
            const response =
              await enterprisesControllerGetDividendAnalysis(symbolId);
            if (response.status !== 200) {
              throw new Error("高配当分析データを取得できませんでした");
            }
            const enterprise = get().enterprises.find(
              (item) => item.symbolId === symbolId,
            );
            const detail = normalizeDetail(response.data, enterprise);

            set(
              {
                detail,
                detailStatus: "success",
                selectedSymbolId: symbolId,
              },
              false,
              "dividendAnalysis/detail:success",
            );
          } catch {
            set(
              {
                detail: null,
                detailStatus: "error",
                error: "高配当分析データを取得できませんでした",
              },
              false,
              "dividendAnalysis/detail:error",
            );
          }
        };

        return {
          ...initialState,
          load: async () => {
            set(
              {
                detail: null,
                detailStatus: "idle",
                error: null,
                enterprises: [],
                overview: null,
                overviewStatus: "loading",
                status: "loading",
                selectedSymbolId: null,
              },
              false,
              "dividendAnalysis/overview:start",
            );

            try {
              const response = await enterprisesControllerGetQuantsInfo();
              if (response.status !== 200) {
                throw new Error("高配当分析データを取得できませんでした");
              }

              const overview = normalizeOverview(response.data);
              const { enterprises } = overview;

              set(
                {
                  overview,
                  enterprises,
                  overviewStatus:
                    enterprises.length === 0 ? "empty" : "success",
                  status: enterprises.length === 0 ? "empty" : "success",
                  selectedSymbolId: enterprises[0]?.symbolId ?? null,
                },
                false,
                "dividendAnalysis/overview:success",
              );

              if (enterprises[0]) {
                await loadDetail(enterprises[0].symbolId);
              }
            } catch {
              set(
                {
                  detail: null,
                  detailStatus: "idle",
                  error: "高配当分析データを取得できませんでした",
                  enterprises: [],
                  overview: null,
                  overviewStatus: "error",
                  status: "error",
                  selectedSymbolId: null,
                },
                false,
                "dividendAnalysis/overview:error",
              );
            }
          },
          loadList: async () => {
            await get().load();
          },
          loadDetail,
          selectSymbol: async (symbolId: string) => {
            if (get().selectedSymbolId === symbolId && get().detail) {
              return;
            }

            await loadDetail(symbolId);
          },
          selectEnterprise: async (symbolId: string) => {
            await get().selectSymbol(symbolId);
          },
          retry: async () => {
            if (get().overviewStatus === "error" || !get().overview) {
              await get().loadList();
              return;
            }

            const symbolId = get().selectedSymbolId;
            if (symbolId) {
              await get().loadDetail(symbolId);
            }
          },
          resetError: () =>
            set(
              {
                detailStatus:
                  get().detailStatus === "error" ? "idle" : get().detailStatus,
                error: null,
                overviewStatus:
                  get().overviewStatus === "error"
                    ? "idle"
                    : get().overviewStatus,
                status: get().status === "error" ? "idle" : get().status,
              },
              false,
              "dividendAnalysis/reset-error",
            ),
        };
      },
      { name: "dividend-analysis-store" },
    ),
  );
}

export type DividendAnalysisStore = ReturnType<
  typeof createDividendAnalysisStore
>;
