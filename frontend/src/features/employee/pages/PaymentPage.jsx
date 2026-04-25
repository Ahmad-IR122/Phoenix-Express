import React, { useMemo, useState } from 'react';
import './paymentPage.css';

const WITHDRAWAL_METHODS = [
  { value: '', label: 'اختر طريقة الاستلام' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'office_cash', label: 'نقدًا من المكتب' },
  { value: 'e_wallet', label: 'محفظة إلكترونية' },
];

const INITIAL_SUMMARY = {
  currentBalance: 1280,
};

const INITIAL_TRANSACTIONS = [
  {
    id: 1,
    date: '2026-04-22',
    time: '10:45 ص',
    type: 'عمولة شحنة',
    amount: 35,
    status: 'مكتمل',
    statusTone: 'completed',
  },
  {
    id: 2,
    date: '2026-04-21',
    time: '04:15 م',
    type: 'سحب',
    amount: 400,
    status: 'قيد المعالجة',
    statusTone: 'processing',
  },
  {
    id: 3,
    date: '2026-04-19',
    time: '12:10 م',
    type: 'عمولة شحنة',
    amount: 52,
    status: 'مكتمل',
    statusTone: 'completed',
  },
  {
    id: 4,
    date: '2026-04-17',
    time: '09:25 ص',
    type: 'سحب',
    amount: 150,
    status: 'مرفوض',
    statusTone: 'rejected',
  },
];

const MIN_WITHDRAWAL_AMOUNT = 50;

const formatCurrency = (value) => `₪${Number(value || 0).toLocaleString('en-US')}`;

function EmployeeWalletPage() {
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState('');

  const summaryCards = useMemo(
    () => [
      {
        title: 'الرصيد الحالي',
        value: formatCurrency(summary.currentBalance),
        icon: 'bi-wallet2',
        tone: 'primary',
        note: 'المتاح للسحب الآن',
      },
    ],
    [summary]
  );

  const validateForm = () => {
    const nextErrors = {};
    const numericAmount = Number(withdrawAmount);

    if (!withdrawMethod) {
      nextErrors.method = 'يرجى اختيار طريقة الاستلام.';
    }

    if (!withdrawAmount) {
      nextErrors.amount = 'يرجى إدخال مبلغ السحب.';
    } else if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      nextErrors.amount = 'يجب إدخال مبلغ صحيح أكبر من صفر.';
    } else if (numericAmount < MIN_WITHDRAWAL_AMOUNT) {
      nextErrors.amount = `الحد الأدنى للسحب هو ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}.`;
    } else if (numericAmount > summary.currentBalance) {
      nextErrors.amount = 'المبلغ المطلوب أكبر من الرصيد الحالي.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFeedback('');

    if (!validateForm()) {
      return;
    }

    const numericAmount = Number(withdrawAmount);
    const now = new Date();

    setSummary((current) => ({
      ...current,
      currentBalance: current.currentBalance - numericAmount,
    }));

    setTransactions((current) => [
      {
        id: Date.now(),
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'سحب',
        amount: numericAmount,
        status: 'قيد المعالجة',
        statusTone: 'processing',
      },
      ...current,
    ]);

    setWithdrawMethod('');
    setWithdrawAmount('');
    setErrors({});
    setFeedback('تم إرسال طلب السحب بنجاح وسيتم مراجعته من الإدارة.');
  };

  return (
    <div className="employee-wallet-page" dir="rtl">
      <section className="employee-wallet-page__hero">
        <div className="employee-wallet-page__hero-copy">
          <h1 className="employee-wallet-page__title">المحفظة</h1>
          <p className="employee-wallet-page__subtitle">
            راقب رصيدك الحالي، قدّم طلب سحب مستحقات، وراجع آخر العمليات المالية بشكل واضح ومرتب.
          </p>
        </div>
        <div className="employee-wallet-page__hero-icon">
          <i className="bi bi-wallet2"></i>
        </div>
      </section>

      <section className="employee-wallet-page__summary">
        {summaryCards.map((card) => (
          <article key={card.title} className={`employee-wallet-page__summary-card employee-wallet-page__summary-card--${card.tone}`}>
            <div className="employee-wallet-page__summary-icon">
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div className="employee-wallet-page__summary-content">
              <p className="employee-wallet-page__summary-title">{card.title}</p>
              <h2 className="employee-wallet-page__summary-value">{card.value}</h2>
              <p className="employee-wallet-page__summary-note">{card.note}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="employee-wallet-page__content">
        <div className="employee-wallet-page__withdraw-card">
          <div className="employee-wallet-page__section-head">
            <h3 className="employee-wallet-page__section-title">طلب سحب مستحقات</h3>
            <p className="employee-wallet-page__section-text">
              اختر طريقة الاستلام وأدخل المبلغ المطلوب ضمن الرصيد المتاح.
            </p>
          </div>

          <form className="employee-wallet-page__form" onSubmit={handleSubmit}>
            <div className="employee-wallet-page__field">
              <label className="employee-wallet-page__label" htmlFor="withdraw-method">
                طريقة الاستلام
              </label>
              <select
                id="withdraw-method"
                className={`employee-wallet-page__input ${errors.method ? 'employee-wallet-page__input--error' : ''}`}
                value={withdrawMethod}
                onChange={(event) => setWithdrawMethod(event.target.value)}
              >
                {WITHDRAWAL_METHODS.map((method) => (
                  <option key={method.value || 'placeholder'} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.method ? <p className="employee-wallet-page__error">{errors.method}</p> : null}
            </div>

            <div className="employee-wallet-page__field">
              <label className="employee-wallet-page__label" htmlFor="withdraw-amount">
                مبلغ السحب
              </label>
              <input
                id="withdraw-amount"
                type="number"
                min="0"
                step="1"
                className={`employee-wallet-page__input ${errors.amount ? 'employee-wallet-page__input--error' : ''}`}
                placeholder="أدخل مبلغ السحب"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
              />
              {errors.amount ? <p className="employee-wallet-page__error">{errors.amount}</p> : null}
            </div>

            <button type="submit" className="employee-wallet-page__submit-btn">
              طلب سحب
            </button>

            <p className="employee-wallet-page__hint">
              ملاحظة: الحد الأدنى لطلب السحب هو {formatCurrency(MIN_WITHDRAWAL_AMOUNT)}، ويتم خصم المبلغ من الرصيد الحالي بعد إرسال الطلب محليًا.
            </p>

            {feedback ? <div className="employee-wallet-page__feedback">{feedback}</div> : null}
          </form>
        </div>

        <div className="employee-wallet-page__transactions-card">
          <div className="employee-wallet-page__section-head">
            <h3 className="employee-wallet-page__section-title">سجل العمليات</h3>
            <p className="employee-wallet-page__section-text">
              آخر الحركات المالية المرتبطة بمحفظتك.
            </p>
          </div>

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
                    <td>{transaction.date}</td>
                    <td>{transaction.time}</td>
                    <td>{transaction.type}</td>
                    <td className="employee-wallet-page__amount-cell">{formatCurrency(transaction.amount)}</td>
                    <td>
                      <span className={`employee-wallet-page__status employee-wallet-page__status--${transaction.statusTone}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EmployeeWalletPage;
