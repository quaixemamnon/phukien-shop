import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api, { errMsg } from '../../api';
import { formatPrice, ORDER_STATUS } from '../../utils/format';

const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const today = new Date();
const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
const shortMoney = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : v >= 1e3 ? `${Math.round(v / 1e3)}k` : v);

export default function AdminStats() {
  const [q, setQ] = useState({ from: toISO(monthStart), to: toISO(today), groupBy: 'day' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = async (params) => {
    setError('');
    if (params.from > params.to) return setError('Ngày bắt đầu phải trước ngày kết thúc');
    try {
      const { data: d } = await api.get('/admin/stats/revenue', { params });
      setData(d);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    load(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();
    const summary = [
      ['BÁO CÁO DOANH THU'],
      [`Từ ngày ${q.from} đến ngày ${q.to}`],
      [],
      ['Tổng doanh thu', data.totals.revenue],
      ['Số đơn đã giao', data.totals.orders],
      ['Giá trị đơn trung bình', data.totals.avg],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Tổng quan');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.series.map((s) => ({ 'Thời gian': s._id, 'Doanh thu': s.revenue, 'Số đơn': s.orders }))), 'Theo thời gian');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.topProducts.map((p, i) => ({ STT: i + 1, 'Sản phẩm': p.name, 'Số lượng bán': p.quantity, 'Doanh thu': p.revenue }))), 'Sản phẩm bán chạy');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.byCategory.map((c) => ({ 'Danh mục': c.name, 'Doanh thu': c.revenue }))), 'Theo danh mục');
    XLSX.writeFile(wb, `BaoCaoDoanhThu_${q.from}_${q.to}.xlsx`);
    toast.success('Đã xuất file Excel');
  };

  return (
    <>
      <div className="toolbar">
        <h1>Thống kê doanh thu</h1>
        <button className="btn outline" onClick={exportExcel} disabled={!data}>Xuất Excel</button>
      </div>
      <form className="card pad filter-row" onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <label className="inline">Từ ngày <input id="st-from" type="date" value={q.from} onChange={(e) => setQ({ ...q, from: e.target.value })} /></label>
        <label className="inline">Đến ngày <input id="st-to" type="date" value={q.to} onChange={(e) => setQ({ ...q, to: e.target.value })} /></label>
        <select id="st-group" value={q.groupBy} onChange={(e) => setQ({ ...q, groupBy: e.target.value })}>
          <option value="day">Theo ngày</option>
          <option value="month">Theo tháng</option>
          <option value="year">Theo năm</option>
        </select>
        <button className="btn primary">Xem thống kê</button>
      </form>
      {error && <p className="alert bad">{error}</p>}

      {data && (
        <>
          <div className="grid stat-grid">
            <div className="card pad stat"><span className="muted small">Doanh thu</span><b>{formatPrice(data.totals.revenue)}</b></div>
            <div className="card pad stat"><span className="muted small">Đơn tính doanh thu (đã giao, đã thanh toán)</span><b>{data.totals.orders}</b></div>
            <div className="card pad stat"><span className="muted small">Giá trị đơn trung bình</span><b>{formatPrice(data.totals.avg)}</b></div>
            {Object.entries(data.statusCounts).map(([k, v]) => (
              <div key={k} className="card pad stat"><span className="muted small">Đơn {ORDER_STATUS[k]?.label.toLowerCase()}</span><b>{v}</b></div>
            ))}
          </div>

          <section className="card pad">
            <h2>Biểu đồ doanh thu</h2>
            {data.series.length === 0 ? (
              <p className="muted">Không có dữ liệu trong khoảng thời gian này.</p>
            ) : (
              <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                  <ComposedChart data={data.series}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="_id" />
                    <YAxis yAxisId="l" tickFormatter={shortMoney} width={50} />
                    <YAxis yAxisId="r" orientation="right" allowDecimals={false} width={30} />
                    <Tooltip formatter={(v, n) => (n === 'Doanh thu' ? formatPrice(v) : v)} />
                    <Legend />
                    <Bar yAxisId="l" dataKey="revenue" name="Doanh thu" fill="#0a6a94" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="r" dataKey="orders" name="Số đơn" stroke="#e07a1f" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <div className="two-col even">
            <section className="card pad">
              <h2>Top sản phẩm bán chạy</h2>
              <table className="table">
                <thead><tr><th>#</th><th>Sản phẩm</th><th>SL</th><th>Doanh thu</th></tr></thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={p._id}><td>{i + 1}</td><td>{p.name}</td><td>{p.quantity}</td><td>{formatPrice(p.revenue)}</td></tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="card pad">
              <h2>Doanh thu theo danh mục</h2>
              <table className="table">
                <thead><tr><th>Danh mục</th><th>Doanh thu</th><th>Tỷ lệ</th></tr></thead>
                <tbody>
                  {data.byCategory.map((c) => (
                    <tr key={c._id}>
                      <td>{c.name}</td>
                      <td>{formatPrice(c.revenue)}</td>
                      <td>{data.totals.revenue ? Math.round((c.revenue / data.byCategory.reduce((s, x) => s + x.revenue, 0)) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </>
      )}
    </>
  );
}
