import React from "react";
import {
  deleteEmployeeSupportConversation,
  getEmployeeSupportConversations,
  sendEmployeeSupportMessage,
} from "../../../services/supportChatService";
import "./supportChatsPage.css";

const EMPLOYEE_CHAT_STORAGE_KEY = "phoenix_employee_chat_threads";

const getThreads = () => {
  try {
    const stored = localStorage.getItem(EMPLOYEE_CHAT_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveThreads = (threads) => {
  localStorage.setItem(EMPLOYEE_CHAT_STORAGE_KEY, JSON.stringify(threads));
};

const hasCustomerMessage = (thread) =>
  !thread.employeeHiddenAt &&
  !thread.employeeHidden &&
  Array.isArray(thread.messages) &&
  thread.messages.some((message) => message.role === "customer" && message.text?.trim());

const formatTime = (value) =>
  new Intl.DateTimeFormat("ar-PS", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));

const SupportChatsPage = () => {
  const [threads, setThreads] = React.useState(() => getThreads());
  const [selectedThreadId, setSelectedThreadId] = React.useState(() => getThreads()[0]?.id || null);
  const [replyText, setReplyText] = React.useState("");
  const [isSendingReply, setIsSendingReply] = React.useState(false);

  React.useEffect(() => {
    const loadThreads = async () => {
      let nextThreads;
      try {
        const response = await getEmployeeSupportConversations();
        nextThreads = response.data || [];
      } catch {
        nextThreads = getThreads();
      }

      nextThreads = nextThreads.filter(hasCustomerMessage);
      setThreads(nextThreads);
      setSelectedThreadId((current) =>
        nextThreads.some((thread) => thread.id === current) ? current : nextThreads[0]?.id || null
      );
    };

    const intervalId = window.setInterval(loadThreads, 1800);
    loadThreads();

    return () => window.clearInterval(intervalId);
  }, []);

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) || null;

  const handleDeleteThread = (threadId) => {
    if (isSendingReply) return;

    deleteEmployeeSupportConversation(threadId).catch(() => {});
    const storedThreads = getThreads();
    const nextStoredThreads = storedThreads.map((thread) =>
      thread.id === threadId
        ? { ...thread, employeeHidden: true, employeeHiddenAt: Date.now() }
        : thread
    );
    const nextVisibleThreads = nextStoredThreads.filter(hasCustomerMessage);

    saveThreads(nextStoredThreads);
    setThreads(nextVisibleThreads);
    setSelectedThreadId((current) =>
      current === threadId ? nextVisibleThreads[0]?.id || null : current
    );
  };

  const handleReply = async (event) => {
    event.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedThread || isSendingReply) return;

    setIsSendingReply(true);

    try {
      const response = await sendEmployeeSupportMessage(selectedThread.id, text);
      const updatedThread = response.data;
      const nextThreads = threads.map((thread) =>
        thread.id === updatedThread.id ? updatedThread : thread
      );

      saveThreads(nextThreads);
      setThreads(nextThreads);
      setReplyText("");
      setIsSendingReply(false);
      return;
    } catch {
      // Fallback for local development before running the new database migrations.
    }

    const employeeMessage = {
      id: `employee-${Date.now()}`,
      role: "employee",
      text,
      createdAt: Date.now(),
    };

    const nextThreads = threads.map((thread) =>
      thread.id === selectedThread.id
        ? {
            ...thread,
            status: "answered",
            updatedAt: Date.now(),
            messages: [...thread.messages, employeeMessage],
          }
        : thread
    );

    saveThreads(nextThreads);
    setThreads(nextThreads);
    setReplyText("");
    setIsSendingReply(false);
  };

  return (
    <div className="employee-support-chats" dir="rtl">
      <section className="employee-support-chats__header">
        <div>
          <p className="employee-support-chats__eyebrow">خدمة العملاء</p>
          <h1>محادثات العملاء</h1>
          <p>تابع رسائل العملاء الواردة من مساعد فينوكس وقم بالرد عليها من هنا.</p>
        </div>
        <span className="employee-support-chats__count">{threads.length} محادثة</span>
      </section>

      <section className="employee-support-chats__layout">
        <aside className="employee-support-chats__list">
          {threads.length === 0 ? (
            <div className="employee-support-chats__empty">
              لا توجد محادثات واردة حالياً.
            </div>
          ) : (
            threads.map((thread) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              return (
                <button
                  type="button"
                  className={`employee-support-chats__thread ${
                    thread.id === selectedThreadId ? "is-active" : ""
                  }`}
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <span className="employee-support-chats__thread-top">
                    <strong>{thread.customerName}</strong>
                    <small>{formatTime(thread.updatedAt)}</small>
                  </span>
                  <span className="employee-support-chats__thread-message">
                    {lastMessage?.text || "محادثة جديدة"}
                  </span>
                  <span className={`employee-support-chats__status ${thread.status}`}>
                    {thread.status === "answered" ? "تم الرد" : "بانتظار الرد"}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="employee-support-chats__delete"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteThread(thread.id);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDeleteThread(thread.id);
                      }
                    }}
                  >
                    حذف المحادثة
                  </span>
                </button>
              );
            })
          )}
        </aside>

        <main className="employee-support-chats__conversation">
          {selectedThread ? (
            <>
              <header className="employee-support-chats__conversation-header">
                <div>
                  <h2>{selectedThread.customerName}</h2>
                  <p>{selectedThread.customerEmail || "لا يوجد بريد إلكتروني"}</p>
                </div>
                <div className="employee-support-chats__conversation-actions">
                  <span>{selectedThread.status === "answered" ? "تم الرد" : "بانتظار الرد"}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteThread(selectedThread.id)}
                    disabled={isSendingReply}
                  >
                    حذف
                  </button>
                </div>
              </header>

              <div className="employee-support-chats__messages">
                {selectedThread.messages.map((message) => (
                  <article
                    className={`employee-support-chats__message ${message.role}`}
                    key={message.id}
                  >
                    <p>{message.text}</p>
                    <time>{formatTime(message.createdAt)}</time>
                  </article>
                ))}
              </div>

              <form className="employee-support-chats__reply" onSubmit={handleReply}>
                <input
                  type="text"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder="اكتب ردك للعميل..."
                />
                <button type="submit" disabled={!replyText.trim() || isSendingReply}>
                  {isSendingReply ? "جارٍ الإرسال..." : "إرسال الرد"}
                </button>
              </form>
            </>
          ) : (
            <div className="employee-support-chats__placeholder">
              اختر محادثة من القائمة لعرض التفاصيل والرد على العميل.
            </div>
          )}
        </main>
      </section>
    </div>
  );
};

export default SupportChatsPage;
