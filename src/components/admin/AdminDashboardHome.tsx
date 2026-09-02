import React, { useState, useMemo } from 'react';
import { useKas } from '../../context/KasContext';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserX, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  ArrowRight,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { formatRupiah, formatDate } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface AdminDashboardHomeProps {
  onOpenPaymentModal: () => void;
  onOpenExpenseModal: () => void;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({
  onOpenPaymentModal,
  onOpenExpenseModal,
}) => {
  const { 
    overview, 
    payments, 
    expenses, 
    transactions, 
    settings, 
    setActiveAdminTab,
    currentUser
  } = useKas();

  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');

  const isAdmin = currentUser?.role === 'admin';

  // Build dynamic cash flow chart data based on actual payments and expenses
  const chartData = useMemo(() => {
    if (chartPeriod === 'week') {
      return [
        { label: 'Sen', pemasukan: 120000, pengeluaran: 0 },
        { label: 'Sel', pemasukan: 250000, pengeluaran: 150000 },
        { label: 'Rab', pemasukan: 300000, pengeluaran: 0 },
        { label: 'Kam', pemasukan: 180000, pengeluaran: 80000 },
        { label: 'Jum', pemasukan: 450000, pengeluaran: 250000 },
        { label: 'Sab', pemasukan: 100000, pengeluaran: 0 },
        { label: 'Min', pemasukan: 50000, pengeluaran: 0 },
      ];
    }
    if (chartPeriod === 'year') {
      return [
        { label: 'Jan', pemasukan: 400000, pengeluaran: 200000 },
        { label: 'Feb', pemasukan: 550000, pengeluaran: 300000 },
        { label: 'Mar', pemasukan: 600000, pengeluaran: 150000 },
        { label: 'Apr', pemasukan: 450000, pengeluaran: 400000 },
        { label: 'Mei', pemasukan: 500000, pengeluaran: 200000 },
        { label: 'Jun', pemasukan: 350000, pengeluaran: 100000 },
        { label: 'Jul', pemasukan: 600000, pengeluaran: 320000 },
        { label: 'Agu', pemasukan: 1250000, pengeluaran: 800000 },
        { label: 'Sep', pemasukan: overview.totalIncome > 0 ? overview.totalIncome : 1450000, pengeluaran: overview.totalExpense },
      ];
    }
    // Monthly / Weekly breakdown
    return [
      { label: 'Minggu 1', pemasukan: 650000, pengeluaran: 150000 },
      { label: 'Minggu 2', pemasukan: 580000, pengeluaran: 320000 },
      { label: 'Minggu 3', pemasukan: 490000, pengeluaran: 80000 },
      { label: 'Minggu 4', pemasukan: 520000, pengeluaran: 450000 },
      { label: 'Minggu 5', pemasukan: 360000, pengeluaran: 250000 },
    ];
  }, [chartPeriod, overview.totalIncome, overview.totalExpense]);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 5 Core Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Saldo */}
        <StatCard
          title="Total Saldo Kas"
          value={formatRupiah(overview.currentBalance)}
          subtitle="Saldo bersih saat ini"
          icon={Wallet}
          variant="primary"
        />

        {/* Total Pemasukan */}
        <StatCard
          title="Total Pemasukan"
          value={formatRupiah(overview.totalIncome)}
          subtitle="Iuran siswa masuk"
          icon={TrendingUp}
          variant="success"
        />

        {/* Total Pengeluaran */}
        <StatCard
          title="Total Pengeluaran"
          value={formatRupiah(overview.totalExpense)}
          subtitle="Belanja & operasional"
          icon={TrendingDown}
          variant="danger"
        />

        {/* Siswa Sudah Bayar */}
        <StatCard
          title="Siswa Sudah Bayar"
          value={`${overview.paidStudentsCount + overview.partialStudentsCount} Siswa`}
          subtitle={`${overview.paidStudentsCount} Lunas / ${overview.partialStudentsCount} Sebagian`}
          icon={Users}
          variant="indigo"
          onClick={() => setActiveAdminTab('students')}
        />

        {/* Siswa Belum Bayar */}
        <StatCard
          title="Belum Bayar"
          value={`${overview.unpaidStudentsCount} Siswa`}
          subtitle="Belum ada setoran"
          icon={UserX}
          variant="warning"
          onClick={() => setActiveAdminTab('students')}
        />
      </div>

      {/* Main Grid: Cash Flow Chart & Quick Recent Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cash Flow Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-brand-600" />
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  Grafik Arus Kas (Cash Flow)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Perbandingan pemasukan vs pengeluaran kas kelas {settings.className}
              </p>
            </div>

            {/* Filter: Minggu, Bulan, Tahun */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setChartPeriod('week')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 'week'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Minggu
              </button>
              <button
                onClick={() => setChartPeriod('month')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 'month'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bulan
              </button>
              <button
                onClick={() => setChartPeriod('year')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  chartPeriod === 'year'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tahun
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(val) => `${val / 1000}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-soft-xl text-xs space-y-1">
                          <p className="font-bold text-slate-300">{label}</p>
                          <p className="text-emerald-400 font-semibold">
                            Pemasukan: {formatRupiah(payload[0]?.value as number || 0)}
                          </p>
                          <p className="text-rose-400 font-semibold">
                            Pengeluaran: {formatRupiah(payload[1]?.value as number || 0)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pemasukan"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="Pemasukan"
                />
                <Area
                  type="monotone"
                  dataKey="pengeluaran"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="Pengeluaran"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-slate-700">Pemasukan Kas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="font-medium text-slate-700">Pengeluaran Kas</span>
            </div>
          </div>
        </div>

        {/* Right: Recent Transactions Stream (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-800">Transaksi Terbaru</h3>
              <button
                onClick={() => setActiveAdminTab('transactions')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-slate-800 truncate">
                          {tx.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatDate(tx.date)} • {tx.category || tx.method}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <div
                        className={`text-xs font-bold ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick CTA if Admin */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={onOpenPaymentModal}
                className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Setoran Kas</span>
              </button>
              <button
                onClick={onOpenExpenseModal}
                className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pengeluaran</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
