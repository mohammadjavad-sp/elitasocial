import type { CmsRecord } from "@/lib/cms-shared";
import { pricingCategoryIds, pricingCategoryLabels, type PricingCategoryId } from "@/lib/pricing-categories";

export type PlanCategoryFilter = "all" | PricingCategoryId;
const number = new Intl.NumberFormat("fa-IR");

export function PlanCategoryFilters({ records, selected, loading, onChange }: {
  records: readonly CmsRecord[];
  selected: PlanCategoryFilter;
  loading: boolean;
  onChange: (category: PlanCategoryFilter) => void;
}) {
  return <div className="admin-consultation-filters admin-plan-categories" role="group" aria-label="دسته‌بندی پلن‌ها">
    {pricingCategoryIds.map(id => <button type="button" key={id} disabled={loading} aria-pressed={selected === id} onClick={() => onChange(id)}>
      <span>{pricingCategoryLabels[id]}</span><span className="admin-consultation-count">{number.format(records.filter(record => record.data.categoryId === id).length)}</span>
    </button>)}
    <button type="button" disabled={loading} aria-pressed={selected === "all"} onClick={() => onChange("all")}><span>همهٔ پلن‌ها</span><span className="admin-consultation-count">{number.format(records.length)}</span></button>
  </div>;
}
