import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api';

const LABELS = ['', 'Rất tệ', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời'];

// Form đánh giá sản phẩm, dùng ở trang chi tiết đơn hàng và trang chi tiết sản phẩm
export default function ReviewForm({ orderId, productId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/reviews', { orderId, productId, rating, comment });
      toast.success('Cảm ơn bạn đã đánh giá');
      onDone && onDone();
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="star-picker">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n} sao`}>★</button>
        ))}
        <span className="muted small"> {LABELS[rating]}</span>
      </div>
      <textarea id={`review-${productId}`} rows="3" maxLength={1000} placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="btn primary" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</button>
    </form>
  );
}
