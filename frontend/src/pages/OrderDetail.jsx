import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';
import OrderInfo, { BackLink } from '../components/OrderInfo';
import { Stars } from '../components/common';
import ReviewForm from '../components/ReviewForm';
import NotFound from './NotFound';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [openReview, setOpenReview] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    api
      .get(`/orders/${id}`)
      .then((r) => {
        setOrder(r.data);
        if (r.data.orderStatus === 'delivered') api.get(`/reviews/order/${id}`).then((rv) => setReviews(rv.data));
      })
      .catch(() => setNotFound(true));
  }, [id]);

  useEffect(load, [load]);

  if (notFound) return <NotFound />;
  if (!order) return <p className="muted">Đang tải...</p>;

  const cancel = async () => {
    const reason = window.prompt('Lý do hủy đơn (không bắt buộc):', '');
    if (reason === null) return;
    try {
      await api.patch(`/orders/${id}/cancel`, { reason: reason || undefined });
      toast.success('Đã hủy đơn hàng');
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const payAgain = async () => {
    try {
      const { data } = await api.post(`/orders/${id}/pay`);
      window.location.href = data.paymentUrl;
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const canPayAgain = order.paymentMethod !== 'COD' && order.paymentStatus !== 'paid' && order.orderStatus === 'pending';

  const itemAction = (item) => {
    if (order.orderStatus !== 'delivered') return null;
    const done = reviews.find((r) => String(r.product) === String(item.product));
    if (done) return <span className="small muted">Đã đánh giá <Stars value={done.rating} /></span>;
    if (openReview === String(item.product))
      return <ReviewForm orderId={id} productId={item.product} onDone={() => { setOpenReview(null); load(); }} />;
    return <button className="btn outline" onClick={() => setOpenReview(String(item.product))}>Đánh giá</button>;
  };

  return (
    <>
      <BackLink to="/orders">Đơn hàng của tôi</BackLink>
      <div className="toolbar">
        <h1>Đơn hàng {order.orderCode}</h1>
        <div className="row-center">
          {canPayAgain && <button className="btn primary" onClick={payAgain}>Thanh toán lại</button>}
          {order.orderStatus === 'pending' && <button className="btn outline danger" onClick={cancel}>Hủy đơn</button>}
        </div>
      </div>
      <OrderInfo order={order} renderItemAction={itemAction} />
    </>
  );
}
