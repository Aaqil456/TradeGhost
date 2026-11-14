import { signClass } from '../../components/ui/primitives'
import type { PairBreakdown } from '../../lib/finance/types'
import { fmtCurrency, fmtPct, signOf } from '../../lib/format/format'

export function PairTable({ pairs }: { pairs: PairBreakdown[] }) {
  return (
    <table className="w-full min-w-[420px] text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted">
        <tr>
          <th className="pb-2 font-medium">Pair</th>
          <th className="pb-2 text-right font-medium">Trades</th>
          <th className="pb-2 text-right font-medium">Win rate</th>
          <th className="pb-2 text-right font-medium">Net P&L</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((p) => (
          <tr key={p.symbol} className="border-t border-line">
            <td className="py-2 font-medium">{p.symbol}</td>
            <td className="nums py-2 text-right font-mono">{p.trades}</td>
            <td className="nums py-2 text-right font-mono">{fmtPct(p.winRate, 0)}</td>
            <td className={`nums py-2 text-right font-mono ${signClass[signOf(p.netPnl)]}`}>
              {fmtCurrency(p.netPnl, { signed: true })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
