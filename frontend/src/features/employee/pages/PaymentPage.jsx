import React, { useEffect, useMemo, useState } from 'react';
import './paymentPage.css';
import {
  getEmployeeWallet,
  submitEmployeeHandoverRequest,
} from '../services/employeeService';

const HANDOVER_METHODS = [
  { value: '', label: 'اختر طريقة التسليم' },
  { value: 'office_cash', label: 'تسليم نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'e_wallet', label: 'محفظة إلكترونية' },
];

const formatCurrency = (value) => `₪${Number(value || 0).toLocaleString('en-US')}`;

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toISOString().slice(0, 10);
};

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusTone = (status) => {
  if (status === 'paid' || status === 'completed') return 'completed';
  if (status === 'rejected') return 'rejected';
  return 'processing';
};

const InfoTooltip = ({ text }) => (
  <span className="employee-wallet-page__info-icon" title={text} aria-label={text}>
    <i className="bi bi-info-circle"></i>
  </span>
);

function EmployeeWalletPage() {
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [handoverMethod, setHandoverMethod] = useState('');
  const [handoverAmount, setHandoverAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const response = await getEmployeeWallet();
      setWalletData(response?.data || null);
    } catch (error) {
      setLoadError(
        error?.response?.data?.message || 'تعذر تحميل بيانات المبالغ المحصلة حالياً.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    const refreshWalletOnFocus = () => {
      loadWallet();
    };

    const refreshWalletOnVisible = () => {
      if (document.visibilityState === 'visible') {
        loadWallet();
      }
    };

    window.addEventListener('focus', refreshWalletOnFocus);
    document.addEventListener('visibilitychange', refreshWalletOnVisible);

    return () => {
      window.removeEventListener('focus', refreshWalletOnFocus);
      document.removeEventListener('visibilitychange', refreshWalletOnVisible);
    };
  }, []);

  const summary = walletData?.summary || {
    currentBalance: 0,
  };

  const transactions = useMemo(() => {
    return (walletData?.transactions || []).map((transaction) => ({
      ...transaction,
      dateLabel: formatDate(transaction.date),
      timeLabel: formatTime(transaction.date),
      statusTone: getStatusTone(transaction.status),
    }));
  }, [walletData]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'المبالغ المحصلة',
        value: formatCurrency(summary.currentBalance),
        icon: 'bi-wallet2',
        tone: 'primary',
        note: 'المبالغ المحصلة من العملاء ولم تُسلّم للشركة بعد',
      },
    ],
    [summary]
  );

  const validateForm = () => {
    const nextErrors = {};
    const numericAmount = Number(handoverAmount);

    if (!handoverMethod) {
      nextErrors.method = 'يرجى اختيار طريقة التسليم.';
    }

    if (!handoverAmount) {
      nextErrors.amount = 'يرجى إدخال المبلغ المراد تسليمه.';
    } else if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = 'يجب إدخال مبلغ صحيح أكبر من صفر.';
    } else if (numericAmount > Number(summary.currentBalance || 0)) {
      nextErrors.amount = 'المبلغ المطلوب أكبر من المبالغ المحصلة الحالية.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await submitEmployeeHandoverRequest({
        amount: Number(handoverAmount),
        withdrawalMethod: handoverMethod,
      });

      setHandoverMethod('');
      setHandoverAmount('');
      setErrors({});
      setFeedback('تم إرسال طلب تسليم المبلغ للشركة بنجاح وبانتظار المراجعة.');
      await loadWallet();
    } catch (error) {
      setFeedback(
        error?.response?.data?.message || 'تعذر إرسال طلب تسليم المبلغ حالياً.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-wallet-page" dir="rtl">
      <section className="employee-wallet-page__hero">
        <div className="employee-wallet-page__hero-copy">
          <h1 className="employee-wallet-page__title">المبالغ المحصلة</h1>
          <p className="employee-wallet-page__subtitle">
            راقب المبالغ التي قمت بتحصيلها من العملاء، وقدّم طلبات تسليمها للشركة، وراجع سجل العمليات المالية بشكل واضح ومرتب.
          </p>
        </div>
        <div className="employee-wallet-page__hero-icon">
          <i className="bi bi-wallet2"></i>
        </div>
      </section>

      <section className="employee-wallet-page__summary">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className={`employee-wallet-page__summary-card employee-wallet-page__summary-card--${card.tone}`}
          >
            <div className="employee-wallet-page__summary-icon">
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="employee-wallet-page__summary-content">
              <div className="employee-wallet-page__summary-title-row">
                <p className="employee-wallet-page__summary-title">{card.title}</p>
                <InfoTooltip text={card.note} />
              </div>
              <h2 className="employee-wallet-page__summary-value">{card.value}</h2>
            </div>
          </article>
        ))}
      </section>

      <section className="employee-wallet-page__section">
        <div className="employee-wallet-page__withdraw-card">
          <div className="employee-wallet-page__section-head">
            <h3 className="employee-wallet-page__section-title">تسليم مبالغ للشركة</h3>
          </div>

          <form className="employee-wallet-page__form" onSubmit={handleSubmit}>
            <div className="employee-wallet-page__field">
              <label className="employee-wallet-page__label" htmlFor="handover-method">
                طريقة التسليم
              </label>
              <select
                id="handover-method"
                className={`employee-wallet-page__input ${errors.method ? 'employee-wallet-page__input--error' : ''}`}
                value={handoverMethod}
                onChange={(event) => setHandoverMethod(event.target.value)}
              >
                {HANDOVER_METHODS.map((method) => (
                  <option key={method.value || 'placeholder'} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.method ? <p className="employee-wallet-page__error">{errors.method}</p> : null}
            </div>

            <div className="employee-wallet-page__field">
              <label className="employee-wallet-page__label" htmlFor="handover-amount">
                مبلغ التسليم
              </label>
              <input
                id="handover-amount"
                type="number"
                min="0"
                step="1"
                className={`employee-wallet-page__input ${errors.amount ? 'employee-wallet-page__input--error' : ''}`}
                placeholder="أدخل المبلغ المراد تسليمه"
                value={handoverAmount}
                onChange={(event) => setHandoverAmount(event.target.value)}
              />
              {errors.amount ? <p className="employee-wallet-page__error">{errors.amount}</p> : null}
            </div>

            <button type="submit" className="employee-wallet-page__submit-btn" disabled={submitting}>
              {submitting ? 'جارٍ إرسال الطلب...' : 'إرسال طلب التسليم'}
            </button>

            <div className="employee-wallet-page__hint-row">
              <InfoTooltip text='لا يتم خصم المبلغ من "المبالغ المحصلة" إلا بعد اعتماد طلب التسليم من الإدارة.' />
            </div>

            {feedback ? <div className="employee-wallet-page__feedback">{feedback}</div> : null}
          </form>
        </div>
      </section>

      <section className="employee-wallet-page__section">
        <div className="employee-wallet-page__transactions-card">
          <div className="employee-wallet-page__section-head">
            <h3 className="employee-wallet-page__section-title">سجل العمليات</h3>
          </div>

          {loadError ? (
            <div className="employee-wallet-page__feedback">{loadError}</div>
          ) : isLoading ? (
            <div className="employee-wallet-page__hint">جارٍ تحميل البيانات...</div>
          ) : (
            <>
              <div className="employee-wallet-page__table-wrap">
                <table className="employee-wallet-page__table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>الوقت</th>
                      <th>النوع</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{transaction.dateLabel}</td>
                        <td>{transaction.timeLabel}</td>
                        <td>{transaction.type}</td>
                        <td className="employee-wallet-page__amount-cell">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td>
                          <span
                            className={`employee-wallet-page__status employee-wallet-page__status--${transaction.statusTone}`}
                          >
                            {transaction.statusLabel || transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="employee-wallet-page__mobile-transactions">
                {transactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="employee-wallet-page__mobile-transaction-card"
                  >
                    <div className="employee-wallet-page__mobile-transaction-top">
                      <span className="employee-wallet-page__amount-cell">
                        {formatCurrency(transaction.amount)}
                      </span>
                      <span
                        className={`employee-wallet-page__status employee-wallet-page__status--${transaction.statusTone}`}
                      >
                        {transaction.statusLabel || transaction.status}
                      </span>
                    </div>

                    <div className="employee-wallet-page__mobile-transaction-grid">
                      <div className="employee-wallet-page__mobile-transaction-row">
                        <span className="employee-wallet-page__mobile-label">النوع</span>
                        <span className="employee-wallet-page__mobile-value">{transaction.type}</span>
                      </div>

                      <div className="employee-wallet-page__mobile-transaction-row">
                        <span className="employee-wallet-page__mobile-label">التاريخ</span>
                        <span className="employee-wallet-page__mobile-value">{transaction.dateLabel}</span>
                      </div>

                      <div className="employee-wallet-page__mobile-transaction-row">
                        <span className="employee-wallet-page__mobile-label">الوقت</span>
                        <span className="employee-wallet-page__mobile-value">{transaction.timeLabel}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default EmployeeWalletPage;
