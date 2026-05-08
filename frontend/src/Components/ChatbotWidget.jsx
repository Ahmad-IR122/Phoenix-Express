import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiChevronDown,
  FiMaximize2,
  FiMessageCircle,
  FiMinus,
  FiNavigation,
  FiSend,
  FiTruck,
  FiX,
} from "react-icons/fi";
import API from "../apis/api";
import {
  getCustomerSupportConversation,
  sendCustomerSupportMessage,
} from "../services/supportChatService";
import "../styles/ChatbotWidget.css";

const CHAT_STORAGE_KEY = "phoenix_assistant_history";
const CHAT_LANGUAGE_KEY = "phoenix_assistant_language";
const EMPLOYEE_CHAT_STORAGE_KEY = "phoenix_employee_chat_threads";
const ACTIVE_EMPLOYEE_THREAD_KEY = "phoenix_active_employee_thread";
const EMPLOYEE_SEEN_MESSAGES_KEY = "phoenix_seen_employee_messages";
const PENDING_EMPLOYEE_THREAD_ID = "pending-employee-thread";

const statusLabels = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  picked_up: { ar: "تم استلام الطرد", en: "Picked up" },
  in_transit: { ar: "قيد التوصيل", en: "In transit" },
  delivered: { ar: "تم التسليم", en: "Delivered" },
};

const mockShipments = {
  PH12345678: {
    trackingNumber: "PH12345678",
    status: "delivered",
    origin: "نابلس",
    destination: "رام الله",
    eta: "تم التسليم بتاريخ 2026-04-20",
  },
  PH87654321: {
    trackingNumber: "PH87654321",
    status: "in_transit",
    origin: "القدس",
    destination: "نابلس",
    eta: "متوقع خلال 24 ساعة",
  },
  PH11223344: {
    trackingNumber: "PH11223344",
    status: "picked_up",
    origin: "نابلس",
    destination: "حيفا",
    eta: "متوقع خلال يومين",
  },
};

const mockOrders = [
  { id: "PH12345678", status: "delivered", route: "نابلس -> رام الله" },
  { id: "PH87654321", status: "in_transit", route: "القدس -> نابلس" },
  { id: "PH11223344", status: "picked_up", route: "نابلس -> حيفا" },
];

const welcomeMessages = {
  ar: "مرحباً بك في مساعد فينوكس. يمكنني مساعدتك في تتبع الشحنات، معرفة الأسعار، مدة التوصيل، طلباتك، أو التواصل مع المدير.",
  en: "Welcome to Phoenix Assistant. I can help with shipment tracking, prices, delivery time, orders, or contacting the manager.",
};

const normalize = (text) => text.trim().toLowerCase();
const isArabicText = (text) => /[\u0600-\u06FF]/.test(text);

const createMessage = (role, text, options = {}) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text,
  createdAt: Date.now(),
  ...options,
});

const getEmployeeMessageSourceId = (message) =>
  message.sourceId || message.id || `employee-${message.createdAt}-${message.text}`;

const createInitialMessages = (language = "ar") => [
  createMessage("bot", welcomeMessages[language], { channel: "assistant", id: "welcome" }),
];

const getEmployeeThreads = () => {
  try {
    const stored = localStorage.getItem(EMPLOYEE_CHAT_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveEmployeeThreads = (threads) => {
  localStorage.setItem(EMPLOYEE_CHAT_STORAGE_KEY, JSON.stringify(threads));
};

const getQuickQuestionResponse = (rawText, respondArabic) => {
  const question = rawText.trim();

  const arabicAnswers = {
    "\u0648\u064a\u0646 \u0634\u062d\u0646\u062a\u064a\u061f":
      "\u0623\u0631\u0633\u0644 \u0631\u0642\u0645 \u0627\u0644\u062a\u062a\u0628\u0639 \u0643\u0645\u0627 \u064a\u0638\u0647\u0631 \u0641\u064a \u0637\u0644\u0628\u0643\u060c \u0645\u062b\u0644: VGCJAWZH3P\u060c \u0648\u0633\u0623\u0639\u0631\u0636 \u0627\u0644\u062d\u0627\u0644\u0629 \u0625\u0630\u0627 \u0643\u0627\u0646\u062a \u0627\u0644\u0634\u062d\u0646\u0629 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u062d\u0633\u0627\u0628\u0643.",
    "\u0643\u0645 \u0633\u0639\u0631 \u0627\u0644\u062a\u0648\u0635\u064a\u0644\u061f":
      "\u0627\u0644\u0633\u0639\u0631 \u064a\u0639\u062a\u0645\u062f \u0639\u0644\u0649 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644. \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a \u064a\u0638\u0647\u0631 \u0644\u0643 \u062f\u0627\u062e\u0644 \u0646\u0645\u0648\u0630\u062c \u0637\u0644\u0628 \u062e\u062f\u0645\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0642\u0628\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628.",
    "\u0643\u0645 \u0645\u062f\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644\u061f":
      "\u0645\u062f\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u062a\u062e\u062a\u0644\u0641 \u062d\u0633\u0628 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0648\u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628. \u0628\u0639\u062f \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628\u060c \u064a\u0645\u0643\u0646\u0643 \u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0645\u0646 \u0631\u0642\u0645 \u0627\u0644\u062a\u062a\u0628\u0639.",
    "\u0634\u0648 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u062a\u0627\u062d\u0629\u061f":
      "\u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u062a\u0638\u0647\u0631 \u0636\u0645\u0646 \u0646\u0645\u0648\u0630\u062c \u0637\u0644\u0628 \u0627\u0644\u062a\u0648\u0635\u064a\u0644. \u0628\u0634\u0643\u0644 \u0639\u0627\u0645\u060c \u0627\u0644\u062e\u062f\u0645\u0629 \u062a\u0634\u0645\u0644 \u0645\u0646\u0627\u0637\u0642 \u0645\u062b\u0644 \u0627\u0644\u0636\u0641\u0629\u060c \u0627\u0644\u0642\u062f\u0633\u060c \u0648\u0627\u0644\u062f\u0627\u062e\u0644 \u062d\u0633\u0628 \u0627\u0644\u062a\u0648\u0641\u0631.",
    "\u0643\u064a\u0641 \u0623\u0637\u0644\u0628 \u062e\u062f\u0645\u0629 \u062a\u0648\u0635\u064a\u0644\u061f":
      "\u0645\u0646 \u0632\u0631 \u0637\u0644\u0628 \u062e\u062f\u0645\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644\u060c \u0639\u0628\u0626 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0631\u0633\u0644 \u0648\u0627\u0644\u0645\u0633\u062a\u0644\u0645 \u0648\u0627\u0644\u0637\u0631\u062f\u060c \u062b\u0645 \u0623\u0631\u0633\u0644 \u0627\u0644\u0637\u0644\u0628. \u0628\u0639\u062f\u0647\u0627 \u0633\u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0631\u0642\u0645 \u062a\u062a\u0628\u0639 \u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0634\u062d\u0646\u0629.",
    "\u0647\u0644 \u0641\u064a \u062a\u0648\u0635\u064a\u0644 \u0644\u0644\u0642\u062f\u0633\u061f":
      "\u0646\u0639\u0645\u060c \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0644\u0644\u0642\u062f\u0633 \u0645\u062f\u0639\u0648\u0645 \u062d\u0633\u0628 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0648\u062a\u0648\u0641\u0631 \u0627\u0644\u062e\u062f\u0645\u0629. \u0627\u062e\u062a\u0631 \u0627\u0644\u0642\u062f\u0633 \u0641\u064a \u0646\u0645\u0648\u0630\u062c \u0627\u0644\u0637\u0644\u0628 \u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u0633\u0639\u0631 \u0648\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644.",
    "\u0647\u0644 \u0641\u064a \u062a\u0648\u0635\u064a\u0644 \u0644\u0644\u062f\u0627\u062e\u0644\u061f":
      "\u0646\u0639\u0645\u060c \u064a\u0648\u062c\u062f \u062a\u0648\u0635\u064a\u0644 \u0644\u0644\u062f\u0627\u062e\u0644 \u062d\u0633\u0628 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u062a\u0627\u062d\u0629. \u0627\u062e\u062a\u0631 \u0627\u0644\u062f\u0627\u062e\u0644 \u0641\u064a \u0646\u0645\u0648\u0630\u062c \u0637\u0644\u0628 \u0627\u0644\u062a\u0648\u0635\u064a\u0644 \u0644\u062a\u0638\u0647\u0631 \u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0648\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644.",
    "\u0643\u064a\u0641 \u0623\u063a\u0644\u0641 \u0637\u0631\u062f \u0642\u0627\u0628\u0644 \u0644\u0644\u0643\u0633\u0631\u061f":
      "\u0627\u0633\u062a\u062e\u062f\u0645 \u0635\u0646\u062f\u0648\u0642\u0627\u064b \u0645\u062a\u064a\u0646\u0627\u064b\u060c \u0648\u0627\u0645\u0644\u0623 \u0627\u0644\u0641\u0631\u0627\u063a\u0627\u062a \u0628\u0645\u0627\u062f\u0629 \u062d\u0645\u0627\u064a\u0629\u060c \u0648\u0627\u0643\u062a\u0628 \u0645\u0644\u0627\u062d\u0638\u0629 \u0648\u0627\u0636\u062d\u0629 \u0623\u0646 \u0627\u0644\u0637\u0631\u062f \u0642\u0627\u0628\u0644 \u0644\u0644\u0643\u0633\u0631 \u0639\u0646\u062f \u062a\u0639\u0628\u0626\u0629 \u0627\u0644\u0637\u0644\u0628.",
    "\u0648\u064a\u0646 \u0623\u0634\u0648\u0641 \u0637\u0644\u0628\u0627\u062a\u064a\u061f":
      "\u064a\u0645\u0643\u0646\u0643 \u0645\u0631\u0627\u062c\u0639\u0629 \u0637\u0644\u0628\u0627\u062a\u0643 \u0645\u0646 \u0635\u0641\u062d\u0629 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a\u060c \u0648\u064a\u0638\u0647\u0631 \u0647\u0646\u0627\u0643 \u0622\u062e\u0631 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u062d\u0633\u0627\u0628\u0643.",
  };

  const englishAnswers = {
    "Where is my shipment?":
      "Send the tracking number exactly as shown in your order, for example: VGCJAWZH3P. I will show the status only if the shipment is linked to your account.",
    "What is the delivery price?":
      "The price depends on the delivery region. The exact cost appears in the delivery request form before submitting the order.",
    "How long does delivery take?":
      "Delivery time depends on the region and order status. After creating the order, follow updates using the tracking number.",
    "Which regions are covered?":
      "Available regions appear in the delivery request form. In general, service covers areas such as the West Bank, Jerusalem, and inside the Green Line depending on availability.",
    "How do I request delivery?":
      "Open the delivery service page, fill in sender, receiver, and parcel details, then submit the order. A tracking number will be generated for follow-up.",
    "Do you deliver to Jerusalem?":
      "Yes, Jerusalem delivery is supported depending on the exact area and service availability. Select Jerusalem in the request form to see price and details.",
    "Do you deliver inside the Green Line?":
      "Yes, delivery inside the Green Line is available depending on the listed areas. Select it in the delivery request form to see cost and details.",
    "How should I pack fragile items?":
      "Use a strong box, fill empty spaces with protective material, and add a clear fragile note when creating the order.",
    "Where can I see my orders?":
      "You can review your orders from the profile page. It shows the latest orders linked to your account.",
  };

  return respondArabic ? arabicAnswers[question] || "" : englishAnswers[question] || "";
};

const findCustomerThread = (preferredThreadId) => {
  const threads = getEmployeeThreads();
  const user = getStoredUser();

  if (preferredThreadId) {
    const preferredThread = threads.find((thread) => thread.id === preferredThreadId);
    if (preferredThread) return preferredThread;
  }

  if (!user) return null;

  return (
    threads.find((thread) => thread.customerId && thread.customerId === user.id) ||
    threads.find((thread) => thread.customerEmail && thread.customerEmail === user.email) ||
    null
  );
};

const getStoredUser = () => {
  const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const getUserStorageId = (user = getStoredUser()) =>
  user?.id || user?.userId || user?.user_id || user?.email || "guest";

const getUserChatStorageKey = (user = getStoredUser()) =>
  `${CHAT_STORAGE_KEY}_${getUserStorageId(user)}`;

const getUserActiveThreadKey = (user = getStoredUser()) =>
  `${ACTIVE_EMPLOYEE_THREAD_KEY}_${getUserStorageId(user)}`;

const getUserSeenEmployeeMessagesKey = (user = getStoredUser()) =>
  `${EMPLOYEE_SEEN_MESSAGES_KEY}_${getUserStorageId(user)}`;

const getSeenEmployeeMessageIds = (user = getStoredUser()) => {
  try {
    const stored = localStorage.getItem(getUserSeenEmployeeMessagesKey(user));
    const parsed = stored ? JSON.parse(stored) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
};

const saveSeenEmployeeMessageIds = (ids, user = getStoredUser()) => {
  localStorage.setItem(
    getUserSeenEmployeeMessagesKey(user),
    JSON.stringify(Array.from(ids).slice(-200))
  );
};

const isUserAuthenticated = () =>
  Boolean(
    (localStorage.getItem("token") || sessionStorage.getItem("token")) && getStoredUser()
  );

const getStatusText = (status, language) => {
  const normalizedStatus = statusLabels[status] || statusLabels.pending;
  return normalizedStatus[language] || normalizedStatus.ar;
};

const extractTrackingNumber = (text) => {
  const compactText = text.replace(/[^a-zA-Z0-9]/g, " ").toUpperCase();
  const candidates = compactText.match(/\b[A-Z0-9]{8,16}\b/g) || [];
  const ignoredWords = new Set([
    "PHOENIX",
    "EXPRESS",
    "DELIVERY",
    "TRACKING",
    "SHIPMENT",
    "PASSWORD",
  ]);

  return candidates.find((candidate) => !ignoredWords.has(candidate)) || "";
};

const isBackToAssistantRequest = (text) => {
  const normalizedText = normalize(text);

  return (
    normalizedText.includes("العودة للمساعد") ||
    normalizedText.includes("رجوع للمساعد") ||
    normalizedText.includes("انهاء المحادثة") ||
    normalizedText.includes("إنهاء المحادثة") ||
    normalizedText.includes("خروج من الموظف") ||
    normalizedText.includes("back to assistant") ||
    normalizedText.includes("end chat")
  );
};

const playSoftPing = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gain.gain.value = 0.025;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch {
    // Audio may be blocked by the browser; the notification badge still appears.
  }
};

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const sendLockRef = React.useRef(false);
  const syncedEmployeeSourceIdsRef = React.useRef(new Set());
  const activeEmployeeThreadIdRef = React.useRef(null);
  const [userStorageId, setUserStorageId] = React.useState(() => getUserStorageId());
  const [language, setLanguage] = React.useState(
    () => localStorage.getItem(CHAT_LANGUAGE_KEY) || "ar"
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [inputValue, setInputValue] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [isQuickQuestionsOpen, setIsQuickQuestionsOpen] = React.useState(false);
  const [activeEmployeeThreadId, setActiveEmployeeThreadId] = React.useState(
    () => localStorage.getItem(getUserActiveThreadKey()) || null
  );
  const isEmployeeChatActive = Boolean(activeEmployeeThreadId);
  const [messages, setMessages] = React.useState(() => {
    if (!isUserAuthenticated()) return [];

    const stored = localStorage.getItem(getUserChatStorageKey());
    if (!stored) return createInitialMessages("ar");

    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : createInitialMessages("ar");
    } catch {
      return createInitialMessages("ar");
    }
  });

  const isArabic = language === "ar";
  const isAuthenticated = isUserAuthenticated();
  const quickQuestions = React.useMemo(
    () =>
      isArabic
        ? [
            "وين شحنتي؟",
            "كم سعر التوصيل؟",
            "كم مدة التوصيل؟",
            "شو المناطق المتاحة؟",
            "كيف أطلب خدمة توصيل؟",
            "هل في توصيل للقدس؟",
            "هل في توصيل للداخل؟",
            "كيف أغلف طرد قابل للكسر؟",
            "وين أشوف طلباتي؟",
          ]
        : [
            "Where is my shipment?",
            "What is the delivery price?",
            "How long does delivery take?",
            "Which regions are covered?",
            "How do I request delivery?",
            "Do you deliver to Jerusalem?",
            "Do you deliver inside the Green Line?",
            "How should I pack fragile items?",
            "Where can I see my orders?",
          ],
    [isArabic]
  );
  const quickQuestionItems = React.useMemo(
    () =>
      isArabic
        ? [
            "\u0648\u064a\u0646 \u0634\u062d\u0646\u062a\u064a\u061f",
            "\u0643\u0645 \u0633\u0639\u0631 \u0627\u0644\u062a\u0648\u0635\u064a\u0644\u061f",
            "\u0643\u0645 \u0645\u062f\u0629 \u0627\u0644\u062a\u0648\u0635\u064a\u0644\u061f",
            "\u0634\u0648 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u062a\u0627\u062d\u0629\u061f",
            "\u0643\u064a\u0641 \u0623\u0637\u0644\u0628 \u062e\u062f\u0645\u0629 \u062a\u0648\u0635\u064a\u0644\u061f",
            "\u0647\u0644 \u0641\u064a \u062a\u0648\u0635\u064a\u0644 \u0644\u0644\u0642\u062f\u0633\u061f",
            "\u0647\u0644 \u0641\u064a \u062a\u0648\u0635\u064a\u0644 \u0644\u0644\u062f\u0627\u062e\u0644\u061f",
            "\u0643\u064a\u0641 \u0623\u063a\u0644\u0641 \u0637\u0631\u062f \u0642\u0627\u0628\u0644 \u0644\u0644\u0643\u0633\u0631\u061f",
            "\u0648\u064a\u0646 \u0623\u0634\u0648\u0641 \u0637\u0644\u0628\u0627\u062a\u064a\u061f",
          ]
        : [
            "Where is my shipment?",
            "What is the delivery price?",
            "How long does delivery take?",
            "Which regions are covered?",
            "How do I request delivery?",
            "Do you deliver to Jerusalem?",
            "Do you deliver inside the Green Line?",
            "How should I pack fragile items?",
            "Where can I see my orders?",
          ],
    [isArabic]
  );
  void quickQuestions;
  const visibleMessages = React.useMemo(
    () =>
      isEmployeeChatActive
        ? messages.filter((message) => message.channel === "employee" || message.sourceId)
        : messages.filter((message) => message.channel !== "employee" && !message.sourceId),
    [isEmployeeChatActive, messages]
  );

  React.useEffect(() => {
    localStorage.setItem(CHAT_LANGUAGE_KEY, language);
  }, [language]);

  React.useEffect(() => {
    if (!isAuthenticated) return;

    localStorage.setItem(getUserChatStorageKey(), JSON.stringify(messages.slice(-40)));
  }, [isAuthenticated, messages, userStorageId]);

  React.useEffect(() => {
    const syncUserChat = () => {
      const nextUserId = getUserStorageId();
      if (nextUserId === userStorageId) return;

      setUserStorageId(nextUserId);

      if (!isUserAuthenticated()) {
        setMessages([]);
        setActiveEmployeeThreadId(null);
        setUnreadCount(0);
        return;
      }

      const storedMessages = localStorage.getItem(getUserChatStorageKey());
      const storedThreadId = localStorage.getItem(getUserActiveThreadKey());

      try {
        const parsedMessages = storedMessages ? JSON.parse(storedMessages) : null;
        setMessages(
          Array.isArray(parsedMessages) && parsedMessages.length > 0
            ? parsedMessages
            : createInitialMessages(language)
        );
      } catch {
        setMessages(createInitialMessages(language));
      }

      setActiveEmployeeThreadId(storedThreadId || null);
      setUnreadCount(0);
    };

    const intervalId = window.setInterval(syncUserChat, 900);
    syncUserChat();

    return () => window.clearInterval(intervalId);
  }, [language, userStorageId]);

  React.useEffect(() => {
    if (!isOpen || isMinimized) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, isTyping, isOpen, isMinimized]);

  React.useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
      window.setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [isOpen, isMinimized]);

  React.useEffect(() => {
    syncedEmployeeSourceIdsRef.current = new Set(
      messages.map((message) => message.sourceId).filter(Boolean)
    );
  }, [messages]);

  React.useEffect(() => {
    activeEmployeeThreadIdRef.current = activeEmployeeThreadId;
  }, [activeEmployeeThreadId]);

  React.useEffect(() => {
    if (isAuthenticated) return;

    setActiveEmployeeThreadId(null);
    setMessages([]);
    setUnreadCount(0);
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (activeEmployeeThreadId && activeEmployeeThreadId !== PENDING_EMPLOYEE_THREAD_ID) {
      localStorage.setItem(getUserActiveThreadKey(), activeEmployeeThreadId);
    } else {
      localStorage.removeItem(getUserActiveThreadKey());
    }
  }, [activeEmployeeThreadId, userStorageId]);

  React.useEffect(() => {
    const syncEmployeeReplies = () => {
      const currentActiveThreadId = activeEmployeeThreadIdRef.current;
      if (!isAuthenticated) return;

      const syncFromThread = (thread) => {
      const activeThreadId = activeEmployeeThreadIdRef.current;

      if (!thread) {
        if (activeThreadId) {
          setActiveEmployeeThreadId(null);
          localStorage.removeItem(getUserActiveThreadKey());
        }
        return;
      }

      if (activeThreadId === PENDING_EMPLOYEE_THREAD_ID) return;

      if (activeThreadId && thread.id !== activeThreadId) {
        return;
      }

      const currentMessages = JSON.parse(localStorage.getItem(getUserChatStorageKey()) || "[]");
      const allKnownMessages = [...messages, ...(Array.isArray(currentMessages) ? currentMessages : [])];
      const existingSourceIds = new Set(
        allKnownMessages
          .map((message) => message.sourceId || message.id)
          .filter(Boolean)
      );
      const seenEmployeeSourceIds = getSeenEmployeeMessageIds();
      const existingEmployeeTexts = new Set(
        allKnownMessages
          .filter((message) => message.role === "bot")
          .map((message) => message.text)
      );
      const newEmployeeMessages = thread.messages.filter(
        (message) =>
          message.role === "employee" &&
          !existingSourceIds.has(getEmployeeMessageSourceId(message)) &&
          !seenEmployeeSourceIds.has(getEmployeeMessageSourceId(message)) &&
          !syncedEmployeeSourceIdsRef.current.has(getEmployeeMessageSourceId(message)) &&
          !existingEmployeeTexts.has(message.text)
      );

      if (newEmployeeMessages.length === 0) return;

      newEmployeeMessages.forEach((message) => {
        const sourceId = getEmployeeMessageSourceId(message);
        syncedEmployeeSourceIdsRef.current.add(sourceId);
        seenEmployeeSourceIds.add(sourceId);
      });
      saveSeenEmployeeMessageIds(seenEmployeeSourceIds);

      if (!activeThreadId && thread.id) {
        setActiveEmployeeThreadId(thread.id);
        localStorage.setItem(getUserActiveThreadKey(), thread.id);
      }

      setMessages((current) => [
        ...current,
        ...newEmployeeMessages.map((message) =>
          createMessage("bot", message.text, {
            channel: "employee",
            sourceId: getEmployeeMessageSourceId(message),
          })
        ),
      ]);

      if (!isOpen || isMinimized || !activeThreadId) {
        setUnreadCount((current) => Math.min(current + newEmployeeMessages.length, 9));
        playSoftPing();
      }
      };
      
      getCustomerSupportConversation()
        .then((response) => syncFromThread(response.data))
        .catch(() =>
          syncFromThread(
            findCustomerThread(
              currentActiveThreadId || localStorage.getItem(getUserActiveThreadKey())
            )
          )
        );
    };

    const intervalId = window.setInterval(syncEmployeeReplies, 2500);
    syncEmployeeReplies();

    return () => window.clearInterval(intervalId);
  }, [activeEmployeeThreadId, isAuthenticated, isMinimized, isOpen, messages]);

  const addBotMessage = React.useCallback((text, options = {}) => {
    const messageOptions = {
      channel: "assistant",
      ...options,
    };

    setMessages((current) => {
      const recentBotMessage = [...current]
        .reverse()
        .find((message) => message.role === "bot");

      if (recentBotMessage?.text === text) {
        return current;
      }

      return [...current, createMessage("bot", text, messageOptions)];
    });

    if (!isOpen || isMinimized) {
      setUnreadCount((current) => Math.min(current + 1, 9));
      playSoftPing();
    }
  }, [isMinimized, isOpen]);

  const handleLanguageToggle = () => {
    const nextLanguage = language === "ar" ? "en" : "ar";
    setLanguage(nextLanguage);
    addBotMessage(
      nextLanguage === "ar"
        ? "تم تحويل لغة المحادثة إلى العربية."
        : "The chat language has been switched to English."
    );
  };

  const getLoginRequiredMessage = () =>
    language === "ar"
      ? "يرجى تسجيل الدخول أولاً لاستخدام مساعد فينوكس وخدمات المحادثة."
      : "Please sign in first to use Phoenix Assistant chat services.";

  const fetchShipment = async (trackingNumber) => {
    try {
      const response = await API.get(`/tracking/number/${encodeURIComponent(trackingNumber)}`);
      const shipment = response.data?.data || response.data;

      return {
        trackingNumber:
          shipment.tracking_number ||
          shipment.trackingNumber ||
          shipment.shipment?.tracking_number ||
          trackingNumber,
        status:
          shipment.current_status ||
          shipment.status ||
          shipment.shipment?.current_status ||
          "pending",
        origin:
          shipment.origin_city ||
          shipment.origin ||
          shipment.order?.origin_city ||
          (isArabic ? "غير متوفر" : "Unavailable"),
        destination:
          shipment.destination_city ||
          shipment.destination ||
          shipment.order?.destination_city ||
          (isArabic ? "غير متوفر" : "Unavailable"),
        eta:
          shipment.expected_delivery_date ||
          shipment.eta ||
          shipment.order?.expected_delivery_date ||
          (isArabic ? "غير متوفر" : "Unavailable"),
      };
    } catch {
      return mockShipments[trackingNumber] || null;
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await API.get("/orders/me");
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data.slice(0, 3) : mockOrders;
    } catch {
      return mockOrders;
    }
  };

  const navigateTo = (path, text) => {
    navigate(path);
    return text;
  };

const saveSupportMessage = (rawText) => {
    const supportMessages = JSON.parse(localStorage.getItem("phoenix_support_messages") || "[]");
    localStorage.setItem(
      "phoenix_support_messages",
      JSON.stringify([...supportMessages, { text: rawText, createdAt: Date.now() }])
    );
  };

  const includesAny = (value, keywords) =>
    keywords.some((keyword) => value.includes(keyword));

  const buildGeneralAssistantResponse = (rawText, text, respondArabic) => {
    const looksLikeQuestion =
      rawText.includes("?") ||
      rawText.includes("؟") ||
      includesAny(text, ["كيف", "شو", "متى", "ليش", "هل", "وين", "كم", "what", "how", "when", "why", "can"]);

    if (includesAny(text, ["شكرا", "يسلمو", "يعطيك", "thanks", "thank you"])) {
      return respondArabic
        ? "على الرحب والسعة. يسعدني مساعدتك في أي وقت بخصوص الشحنات أو الطلبات أو أي استفسار بسيط."
        : "You are welcome. I am happy to help with shipments, orders, or any quick question.";
    }

    if (includesAny(text, ["باي", "مع السلامة", "سلام", "bye", "goodbye"])) {
      return respondArabic
        ? "شكراً لتواصلك مع فينوكس إكسبرس. نتمنى لك يوماً موفقاً."
        : "Thank you for contacting Phoenix Express. Have a great day.";
    }

    if (includesAny(text, ["مين انت", "من انت", "شو انت", "who are you", "assistant"])) {
      return respondArabic
        ? "أنا مساعد فينوكس، موجود لمساعدتك في تتبع الشحنات، فهم خطوات الطلب، معرفة الأسعار التقريبية، ومتابعة أي سؤال سريع قبل التواصل مع الموظف."
        : "I am Phoenix Assistant. I can help with shipment tracking, order steps, estimated pricing, and quick questions before contacting support.";
    }

    if (includesAny(text, ["دوام", "ساعات", "متى بترد", "working hours", "office hours"])) {
      return respondArabic
        ? "يتم الرد على محادثات الموظف خلال أوقات الدوام الرسمية. يمكنك ترك رسالتك الآن، وسيتم متابعتها حسب ترتيب وصولها."
        : "Employee replies are handled during official working hours. You can leave your message now, and it will be reviewed in order.";
    }

    if (includesAny(text, ["الغاء", "إلغاء", "بدي الغي", "cancel"])) {
      return respondArabic
        ? "يمكن طلب إلغاء الشحنة إذا لم تكن خرجت للتوصيل بعد. ارسلي رقم التتبع أو رقم الطلب، وإذا كان الطلب قيد المعالجة سيساعدك الموظف بالإجراء المناسب."
        : "An order can usually be cancelled if it has not gone out for delivery yet. Send the tracking or order number so support can check it.";
    }

    if (includesAny(text, ["تعديل", "اغير", "أغير", "عنوان", "رقم تلفون", "phone", "address", "edit", "change"])) {
      return respondArabic
        ? "لتعديل بيانات الشحنة مثل العنوان أو رقم الهاتف، يرجى إرسال رقم التتبع والبيانات الصحيحة. إذا لم يتم تسليم الشحنة بعد يمكن للموظف مراجعة إمكانية التعديل."
        : "To update shipment details such as address or phone number, send the tracking number and the correct information. Support can check if the update is still possible.";
    }

    if (includesAny(text, ["تأخير", "متأخر", "تاخير", "ما وصلت", "delayed", "late"])) {
      return respondArabic
        ? "نعتذر عن أي تأخير. قد يحدث التأخير بسبب ضغط الطلبات أو العنوان أو ظروف الطريق. أرسل رقم التتبع وسأحاول عرض الحالة، أو تواصل مع الموظف للمتابعة المباشرة."
        : "Sorry for the delay. Delays may happen due to order load, address issues, or road conditions. Send the tracking number or contact support for direct follow-up.";
    }

    if (includesAny(text, ["دفع", "كاش", "بطاقة", "تحصيل", "payment", "cash", "card", "cod"])) {
      return respondArabic
        ? "تعتمد طريقة الدفع على نوع الخدمة المتاحة للطلب. غالباً يمكن التعامل مع الدفع عند الاستلام أو حسب سياسة الطلب، ويمكن تأكيد التفاصيل عند إنشاء الشحنة."
        : "Payment options depend on the selected service. Cash on delivery or request-based payment rules can be confirmed when creating the shipment.";
    }

    if (includesAny(text, ["تغليف", "كسر", "قابل للكسر", "fragile", "package", "packaging"])) {
      return respondArabic
        ? "يفضل تغليف الطرود القابلة للكسر جيداً بمواد حماية مناسبة، وكتابة ملاحظة واضحة أنها قابلة للكسر عند تقديم الطلب حتى يتم التعامل معها بحذر."
        : "Fragile parcels should be packed with protective material and marked as fragile in the order notes so they can be handled carefully.";
    }

    if (includesAny(text, ["استلام", "مندوب", "pickup", "driver", "courier"])) {
      return respondArabic
        ? "بعد تقديم طلب التوصيل، تتم مراجعة البيانات ثم تنسيق عملية الاستلام حسب المنطقة والوقت المتاح. يمكنك متابعة الحالة من رقم التتبع."
        : "After submitting a delivery request, pickup is arranged based on the area and available schedule. You can follow the status using the tracking number.";
    }

    if (includesAny(text, ["شكوى", "مشكلة", "غلط", "complaint", "problem", "issue"])) {
      return respondArabic
        ? "آسفين على أي إزعاج. اكتب تفاصيل المشكلة ورقم التتبع إن وجد، ويمكنك اختيار تواصل مع الموظف حتى يتم توثيق الطلب ومتابعته بشكل مباشر."
        : "Sorry for the inconvenience. Please share the issue details and tracking number if available, or contact an employee for direct follow-up.";
    }

    if (looksLikeQuestion) {
      return respondArabic
        ? "أقدر أساعدك في أسئلة الشحن، الأسعار، مدة التوصيل، المناطق، تعديل الطلبات، أو الإلغاء. لو سؤالك خاص بشحنة معيّنة اكتب رقم التتبع، ولو يحتاج متابعة بشرية اختَر تواصل مع الموظف."
        : "Good question. If it is related to delivery or orders, I can help with tracking, pricing, delivery time, supported regions, edits, or cancellations. For account-specific cases, use Contact employee.";
    }

    return respondArabic
      ? "لم أفهم المطلوب بدقة. يمكنك كتابة سؤالك بطريقة أوضح، أو اختيار تواصل مع الموظف لمتابعة مباشرة."
      : "I understand. I can help with Phoenix Express, deliveries, orders, tracking, pricing, and supported regions. Please add more detail or contact an employee for direct support.";
  };

  const openEmployeeThread = async (rawText, options = {}) => {
    const shouldStoreMessage = options.storeMessage !== false;
    const user = getStoredUser();
    if (shouldStoreMessage) {
      try {
      const response = await sendCustomerSupportMessage(rawText);
      const conversation = response.data;
      setActiveEmployeeThreadId(conversation.id);
      localStorage.setItem(getUserActiveThreadKey(), conversation.id);
      return conversation;
      } catch {
        // Fallback for local development before running the new database migrations.
      }
    }

    const threads = getEmployeeThreads();
    const existingThread = activeEmployeeThreadId
      ? threads.find((thread) => thread.id === activeEmployeeThreadId)
      : null;
    const threadId = existingThread?.id || `thread-${Date.now()}`;
    const customerName =
      user?.customer?.individual_profile?.full_name ||
      user?.customer?.company_profile?.company_name ||
      user?.name ||
      user?.email ||
      "عميل فينوكس";
    const customerMessage = shouldStoreMessage
      ? {
          id: `customer-${Date.now()}`,
          role: "customer",
          text: rawText,
          createdAt: Date.now(),
        }
      : null;

    const nextThreads = existingThread
      ? threads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                employeeHidden: false,
                employeeHiddenAt: null,
                status: "open",
                updatedAt: Date.now(),
                messages: customerMessage ? [...thread.messages, customerMessage] : thread.messages,
              }
            : thread
        )
      : [
          {
            id: threadId,
            customerId: user?.id || null,
            customerName,
            customerEmail: user?.email || "",
            status: "open",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: customerMessage ? [customerMessage] : [],
          },
          ...threads,
        ];

    saveEmployeeThreads(nextThreads);
    setActiveEmployeeThreadId(threadId);
    localStorage.setItem(getUserActiveThreadKey(), threadId);
    return nextThreads.find((thread) => thread.id === threadId);
  };

  const startEmployeeChat = async () => {
    if (!isUserAuthenticated()) {
      addBotMessage(getLoginRequiredMessage());
      return;
    }

    try {
      const response = await getCustomerSupportConversation();
      const conversation = response.data;

      if (conversation?.id) {
        setActiveEmployeeThreadId(conversation.id);
        localStorage.setItem(getUserActiveThreadKey(), conversation.id);
      } else {
        setActiveEmployeeThreadId(PENDING_EMPLOYEE_THREAD_ID);
      }
    } catch {
      const existingThread = findCustomerThread(localStorage.getItem(getUserActiveThreadKey()));

      if (existingThread?.id) {
        setActiveEmployeeThreadId(existingThread.id);
        localStorage.setItem(getUserActiveThreadKey(), existingThread.id);
      } else {
        setActiveEmployeeThreadId(PENDING_EMPLOYEE_THREAD_ID);
      }
    }

  };

  const buildResponse = async (rawText) => {
    const text = normalize(rawText);
    const trackingNumber = extractTrackingNumber(rawText);
    const user = getStoredUser();
    const inputLooksArabic = isArabicText(rawText);
    const responseLanguage = inputLooksArabic ? "ar" : language;
    const respondArabic = responseLanguage === "ar";
    const quickQuestionResponse = getQuickQuestionResponse(rawText, respondArabic);

    if (quickQuestionResponse) {
      return quickQuestionResponse;
    }

    const wantsEmployee =
      text.includes("employee") ||
      text.includes("staff") ||
      text.includes("موظف") ||
      text.includes("الموظف") ||
      text.includes("تواصل مع الموظف");

    if (wantsEmployee) {
      if (!user) {
        return respondArabic
          ? "للتواصل مع الموظف المختص، يرجى تسجيل الدخول أولاً حتى نتمكن من ربط المحادثة بحسابك ومتابعة الردود."
          : "Please sign in first so we can connect the employee conversation to your account.";
      }

      startEmployeeChat();
      return "";
    }

    if (activeEmployeeThreadId) {
      return respondArabic
        ? "أنت حالياً في وضع محادثة الموظف. يرجى كتابة رسالتك للموظف، أو اختيار العودة للمساعد للرجوع إلى الردود التلقائية."
        : "You are currently in employee chat mode. Please type your message to the employee, or go back to the assistant for automated replies.";
    }

    const wantsTracking =
      trackingNumber ||
      text.includes("track") ||
      text.includes("tracking") ||
      text.includes("where is my shipment") ||
      text.includes("وين شحنتي") ||
      text.includes("وين الطرد") ||
      text.includes("تتبع") ||
      text.includes("الشحنة") ||
      text.includes("شحنة") ||
      text.includes("طرد");

    if (wantsTracking) {
      if (!trackingNumber) {
        return respondArabic
          ? "يرجى تزويدي برقم التتبع الخاص بالشحنة، مثل: PH12345678، وسأعرض لك الحالة مباشرة."
          : "Please provide the shipment tracking number, for example: PH12345678.";
      }

      const shipment = await fetchShipment(trackingNumber);

      if (!shipment) {
        return respondArabic
          ? `لا يمكن عرض تفاصيل الشحنة ${trackingNumber}. الرقم غير صحيح أو أن الشحنة غير مرتبطة بحسابك. إذا كنت تعتقد أن هناك خطأ، اختَر "تواصل مع الموظف" للتحقق.`
          : `Shipment ${trackingNumber} cannot be displayed. The number is invalid or it is not linked to your account. Please contact an employee if you think this is a mistake.`;
      }

      const status = getStatusText(shipment.status, responseLanguage);

      return respondArabic
        ? `تم العثور على بيانات الشحنة ${shipment.trackingNumber}.\nالحالة الحالية: ${status}.\nالمسار: من ${shipment.origin} إلى ${shipment.destination}.\nالموعد المتوقع: ${shipment.eta}.`
        : `Shipment ${shipment.trackingNumber} was found.\nCurrent status: ${status}.\nRoute: ${shipment.origin} to ${shipment.destination}.\nETA: ${shipment.eta}.`;
    }

    if (text.includes("price") || text.includes("pricing") || text.includes("سعر") || text.includes("تكلفة")) {
      return respondArabic
        ? "تعتمد تكلفة التوصيل على المدينة، حجم الطرد، ونوع الخدمة المطلوبة. للحصول على سعر أدق، يرجى تعبئة طلب خدمة التوصيل وسيتم احتساب الرسوم حسب البيانات المدخلة."
        : "Delivery cost depends on city, parcel size, and service type. For an accurate quote, please submit a delivery request.";
    }

    if (text.includes("time") || text.includes("delivery time") || text.includes("وقت") || text.includes("مدة")) {
      return respondArabic
        ? "مدة التوصيل المتوقعة غالباً من 24 إلى 48 ساعة داخل المناطق المتاحة، وقد تختلف حسب المدينة وحالة الشحنة."
        : "Expected delivery time is usually 24 to 48 hours in supported areas, depending on city and shipment status.";
    }

    if (text.includes("region") || text.includes("areas") || text.includes("منطقة") || text.includes("مناطق")) {
      return respondArabic
        ? "تغطي فينوكس إكسبرس عدة مناطق، منها نابلس، رام الله، القدس، وحيفا. ويمكنك تأكيد توفر الخدمة عند تقديم طلب التوصيل."
        : "Phoenix Express covers several areas including Nablus, Ramallah, Jerusalem, and Haifa. Coverage can be confirmed when submitting a delivery request.";
    }

    if (
      text.includes("service") ||
      text.includes("services") ||
      text.includes("خدمة") ||
      text.includes("خدمات") ||
      text.includes("استخدم") ||
      text.includes("استخدام")
    ) {
      return respondArabic
        ? "لاستخدام خدمات فينوكس، يمكنك اختيار خدمة التوصيل من القائمة وتعبئة بيانات الطرد والاستلام والتسليم. بعد إنشاء الطلب ستحصل على رقم تتبع، ويمكنك استخدامه هنا أو في صفحة تتبع الشحنة لمعرفة الحالة."
        : "To use Phoenix services, choose the delivery service page and fill in parcel, pickup, and delivery details. After submitting the order, you will receive a tracking number that you can use here or on the tracking page.";
    }

    if (text.includes("order") || text.includes("orders") || text.includes("طلب") || text.includes("طلباتي")) {
      if (!user) {
        return respondArabic
          ? "لعرض طلباتك السابقة، يرجى تسجيل الدخول أولاً ثم إعادة المحاولة."
          : "Please sign in first to view your recent orders.";
      }

      const orders = await fetchOrders();
      const orderList = orders
        .slice(0, 3)
        .map((order) => {
          const id = order.tracking_number || order.trackingNumber || order.id || order.code;
          const status = getStatusText(order.status || "pending", responseLanguage);
          const route = order.route || `${order.origin_city || "Origin"} -> ${order.destination_city || "Destination"}`;
          return `• ${id}: ${status} (${route})`;
        })
        .join("\n");

      return respondArabic ? `آخر طلباتك المسجلة:\n${orderList}` : `Your latest orders:\n${orderList}`;
    }

    if (text.includes("profile") || text.includes("account") || text.includes("بروفايل") || text.includes("حساب")) {
      return navigateTo(
        "/profile",
        respondArabic ? "تم فتح صفحة الملف الشخصي." : "Opening your profile page."
      );
    }

    if (text.includes("manager") || text.includes("admin") || text.includes("مدير") || text.includes("المدير")) {
      saveSupportMessage(rawText);
      return respondArabic
        ? "تم تسجيل طلبك للتواصل مع المدير. سيتم مراجعة الرسالة والرد عليك في أقرب وقت ممكن."
        : "Your request to contact the manager has been saved. The team will review it as soon as possible.";
    }

    if (text.includes("support") || text.includes("help") || text.includes("دعم") || text.includes("مساعدة")) {
      saveSupportMessage(rawText);
      return respondArabic
        ? "تم تسجيل رسالتك لدى فريق الدعم. سيتم متابعتها في أقرب وقت ممكن."
        : "Your support message has been saved and will be reviewed soon.";
    }

    if (text.includes("hello") || text.includes("hi") || text.includes("مرحبا") || text.includes("هلو")) {
      return respondArabic
        ? "مرحباً بك في فينوكس إكسبرس. كيف يمكنني مساعدتك؟"
        : "Welcome to Phoenix Express. How can I help you?";
    }

    if (respondArabic) {
      if (includesAny(text, ["كيف اطلب", "كيف أطلب", "طلب توصيل", "ابعت طرد", "ارسل طرد", "أرسل طرد"])) {
        return "يمكنك طلب خدمة التوصيل من زر طلب خدمة التوصيل في الموقع، ثم تعبئة بيانات المرسل والمستلم والطرد والمنطقة. بعد إنشاء الطلب ستحصل على رقم تتبع لمتابعة الشحنة.";
      }

      if (includesAny(text, ["سعر", "تكلفة", "كم", "الاسعار", "الأسعار"])) {
        return "أسعار التوصيل تعتمد على المنطقة وحجم الطرد ونوع الخدمة. الأسعار الأساسية المعروضة في الموقع هي مرجع سريع، أما السعر النهائي فيظهر عند تعبئة طلب التوصيل.";
      }

      if (includesAny(text, ["وقت", "مدة", "متى", "كم يوم", "كم ساعة"])) {
        return "مدة التوصيل تختلف حسب المنطقة وحالة الطلب، وغالباً تكون خلال 24 إلى 48 ساعة للمناطق المتاحة. يمكنك متابعة الحالة من رقم التتبع.";
      }

      if (includesAny(text, ["منطقة", "مناطق", "وين بتوصلوا", "بتوصلوا", "القدس", "الضفة", "الداخل"])) {
        return "تغطي فينوكس عدة مناطق مثل الضفة الغربية والقدس والداخل، ويمكن التأكد من توفر المنطقة أثناء تعبئة طلب خدمة التوصيل.";
      }

      if (includesAny(text, ["تغليف", "قابل للكسر", "كسر", "طرد حساس"])) {
        return "يفضل تغليف الطرود الحساسة بمواد حماية مناسبة وكتابة ملاحظة أنها قابلة للكسر عند إنشاء الطلب، حتى يتم التعامل معها بعناية أكبر.";
      }

      if (includesAny(text, ["تأخير", "تاخير", "متأخر", "ما وصلت", "وينها"])) {
        return "إذا تأخرت الشحنة، يرجى إدخال رقم التتبع لمعرفة آخر حالة. وقد يحدث التأخير بسبب ضغط الطلبات أو العنوان أو ظروف الطريق.";
      }

      if (includesAny(text, ["دفع", "كاش", "تحصيل", "الدفع عند الاستلام"])) {
        return "طرق الدفع والتحصيل تعتمد على نوع الطلب وسياسة الخدمة. يمكنك توضيح تفاصيل الدفع عند إنشاء طلب التوصيل أو التواصل مع الموظف للحالات الخاصة.";
      }

      if (includesAny(text, ["تعديل", "أعدل", "اغير", "أغير", "العنوان", "رقم الهاتف"])) {
        return "يمكن مراجعة تعديل بيانات الشحنة إذا لم يتم تسليمها بعد. أرسل رقم التتبع والبيانات الصحيحة، أو تواصل مع الموظف لمتابعة التعديل مباشرة.";
      }

      if (includesAny(text, ["الغاء", "إلغاء", "ألغي", "الغي"])) {
        return "يمكن طلب إلغاء الشحنة إذا كانت ما زالت قيد المعالجة ولم تخرج للتوصيل. أرسل رقم التتبع أو تواصل مع الموظف للتأكد من إمكانية الإلغاء.";
      }
    }

    return buildGeneralAssistantResponse(rawText, text, respondArabic);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isTyping || sendLockRef.current) return;

    sendLockRef.current = true;

    if (!isUserAuthenticated()) {
      addBotMessage(getLoginRequiredMessage());
      setInputValue("");
      sendLockRef.current = false;
      return;
    }

    if (!activeEmployeeThreadId) {
      addBotMessage(
        language === "ar"
          ? "\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u062d\u062f \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a \u0627\u0644\u0645\u0648\u062c\u0648\u062f\u0629\u060c \u0623\u0648 \u0641\u062a\u062d \u0645\u062d\u0627\u062f\u062b\u0629 \u0645\u0639 \u0627\u0644\u0645\u0648\u0638\u0641 \u0644\u0643\u062a\u0627\u0628\u0629 \u0631\u0633\u0627\u0644\u0629 \u0645\u0628\u0627\u0634\u0631\u0629."
          : "Please choose one of the available options, or open employee chat to type a direct message."
      );
      setInputValue("");
      sendLockRef.current = false;
      return;
    }

    if (activeEmployeeThreadId && isBackToAssistantRequest(trimmedValue)) {
      setInputValue("");
      setActiveEmployeeThreadId(null);
      localStorage.removeItem(getUserActiveThreadKey());
      sendLockRef.current = false;
      return;

    }

    setMessages((current) => [
      ...current,
      createMessage("user", trimmedValue, {
        channel: activeEmployeeThreadId ? "employee" : "assistant",
      }),
    ]);
    setInputValue("");

    if (activeEmployeeThreadId) {
      if (!getStoredUser()) {
        setActiveEmployeeThreadId(null);
        localStorage.removeItem(getUserActiveThreadKey());
        setIsTyping(true);
        window.setTimeout(() => {
          setIsTyping(false);
          addBotMessage(
            language === "ar"
              ? "انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى قبل إرسال رسالة للموظف."
            : "Your session has ended. Please sign in again before messaging the employee."
          );
          sendLockRef.current = false;
        }, 350);
        return;
      }

      openEmployeeThread(trimmedValue);
      sendLockRef.current = false;
      return;
    }

    setIsTyping(true);

    window.setTimeout(async () => {
      try {
        const responseText = await buildResponse(trimmedValue);
        if (responseText) {
          addBotMessage(responseText);
        }
      } catch {
        addBotMessage(
          language === "ar"
            ? "حدث خلل مؤقت أثناء معالجة طلبك. يمكنك إعادة المحاولة أو اختيار تواصل مع الموظف للمساعدة المباشرة."
            : "A temporary issue occurred while processing your request. Please try again or contact an employee for direct support."
        );
      } finally {
        setIsTyping(false);
        sendLockRef.current = false;
      }
    }, 650);
  };

  const handleQuickPrompt = (text) => {
    if (!isUserAuthenticated()) {
      addBotMessage(getLoginRequiredMessage());
      return;
    }

    const isContactEmployeePrompt =
      text === (isArabic ? "طھظˆط§طµظ„ ظ…ط¹ ط§ظ„ظ…ظˆط¸ظپ" : "Contact employee") ||
      text === "تواصل مع الموظف";

    if (isContactEmployeePrompt) {
      startEmployeeChat();
      setIsQuickQuestionsOpen(false);
      return;
    }

    setActiveEmployeeThreadId(null);
    localStorage.removeItem(getUserActiveThreadKey());
    setMessages((current) => [
      ...current,
      createMessage("user", text, { channel: "assistant" }),
    ]);
    setIsTyping(true);
    setIsQuickQuestionsOpen(false);
    window.setTimeout(async () => {
      try {
        const responseText = await buildResponse(text);
        if (responseText) addBotMessage(responseText);
      } finally {
        setIsTyping(false);
      }
    }, 450);
  };

  const handleEndEmployeeChat = () => {
    setActiveEmployeeThreadId(null);
    localStorage.removeItem(getUserActiveThreadKey());
  };

  return (
    <div className="phoenix-chatbot" dir={isArabic ? "rtl" : "ltr"}>
      {isOpen && (
        <section
          className={`phoenix-chatbot-window ${isMinimized ? "is-minimized" : ""}`}
          aria-label="Phoenix Assistant chat window"
        >
          <header className="phoenix-chatbot-header">
            <div className="phoenix-chatbot-title">
              <span className="phoenix-chatbot-avatar">
                <FiTruck aria-hidden="true" />
              </span>
              <div>
                <h2>Phoenix Assistant</h2>
                <p>{isTyping ? (isArabic ? "يكتب الآن..." : "Typing...") : isArabic ? "مساعد فينوكس متاح" : "Online support"}</p>
              </div>
            </div>
            <div className="phoenix-chatbot-controls">
              <button
                type="button"
                className="phoenix-chatbot-lang"
                onClick={handleLanguageToggle}
                aria-label="Toggle chat language"
              >
                {isArabic ? "عربي" : "EN"}
              </button>
              <button type="button" onClick={() => setIsMinimized((current) => !current)} aria-label="Minimize chat">
                {isMinimized ? <FiMaximize2 /> : <FiMinus />}
              </button>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">
                <FiX />
              </button>
            </div>
          </header>

          {!isMinimized && (
            <>
              {!isAuthenticated && (
                <div className="phoenix-chatbot-auth-lock">
                  <strong>{isArabic ? "تسجيل الدخول مطلوب" : "Sign in required"}</strong>
                  <span>
                    {isArabic
                      ? "يرجى تسجيل الدخول لاستخدام الشات وتتبع الطلبات والتواصل مع الموظف."
                      : "Please sign in to use chat, track orders, and contact support."}
                  </span>
                  <button type="button" onClick={() => navigate("/login")}>
                    {isArabic ? "تسجيل الدخول" : "Sign in"}
                  </button>
                </div>
              )}

              {isEmployeeChatActive && (
                <div className="phoenix-chatbot-employee-mode">
                  <div>
                    <strong>{isArabic ? "محادثة مع الموظف" : "Employee chat"}</strong>
                    <span>
                      {isArabic
                        ? "أنت الآن تتحدثين مع الموظف المختص."
                        : "You are now chatting with the support employee."}
                    </span>
                  </div>
                  <button type="button" onClick={handleEndEmployeeChat}>
                    {isArabic ? "العودة للمساعد" : "Back to assistant"}
                  </button>
                </div>
              )}

              <div className="phoenix-chatbot-messages" aria-live="polite">
                {visibleMessages.map((message) => (
                  <div
                    className={`phoenix-chatbot-message phoenix-chatbot-message--${message.role}`}
                    key={message.id}
                  >
                    <p>{message.text}</p>
                  </div>
                ))}

                {isTyping && (
                  <div className="phoenix-chatbot-message phoenix-chatbot-message--bot">
                    <div className="phoenix-chatbot-typing" aria-label="Assistant typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="phoenix-chatbot-quick-menu">
                <button
                  type="button"
                  className="phoenix-chatbot-quick-toggle"
                  onClick={() => setIsQuickQuestionsOpen((current) => !current)}
                  aria-expanded={isQuickQuestionsOpen}
                >
                  <span>{isArabic ? "أسئلة سريعة" : "Quick questions"}</span>
                  <FiChevronDown aria-hidden="true" />
                </button>

                {isQuickQuestionsOpen && (
                  <div className="phoenix-chatbot-quick-list">
                    {quickQuestionItems.map((question) => (
                      <button type="button" key={question} onClick={() => handleQuickPrompt(question)}>
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="phoenix-chatbot-prompts">
                <button type="button" onClick={() => handleQuickPrompt(isArabic ? "وين شحنتي؟" : "Where is my shipment?")}>
                  {isArabic ? "وين شحنتي؟" : "Track shipment"}
                </button>
                <button type="button" onClick={() => handleQuickPrompt(isArabic ? "كم سعر التوصيل؟" : "What is the price?")}>
                  {isArabic ? "سعر التوصيل" : "Pricing"}
                </button>
                <button type="button" onClick={startEmployeeChat}>
                  {isArabic ? "تواصل مع الموظف" : "Contact employee"}
                </button>
              </div>

              <form className="phoenix-chatbot-form" onSubmit={handleSend}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder={isArabic ? "اكتب سؤالك هنا..." : "Ask about shipments, orders, or support..."}
                  aria-label="Chat message"
                  disabled={!isAuthenticated || !isEmployeeChatActive}
                />
                <button
                  type="submit"
                  disabled={!isAuthenticated || !isEmployeeChatActive || !inputValue.trim() || isTyping}
                  aria-label="Send message"
                >
                  <FiSend aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </section>
      )}

      <button
        type="button"
        className={`phoenix-chatbot-button ${isOpen ? "is-open" : ""}`}
        onClick={() => {
          setIsOpen((current) => !current);
          setIsMinimized(false);
        }}
        aria-label={isOpen ? "Close Phoenix Assistant" : "Open Phoenix Assistant"}
      >
        {isOpen ? <FiChevronDown aria-hidden="true" /> : <FiMessageCircle aria-hidden="true" />}
        {unreadCount > 0 && !isOpen && (
          <span className="phoenix-chatbot-badge">
            <FiBell aria-hidden="true" />
            {unreadCount}
          </span>
        )}
        <span className="phoenix-chatbot-pulse" />
      </button>

      {!isOpen && (
        <button
          type="button"
          className="phoenix-chatbot-hint"
          onClick={() => setIsOpen(true)}
        >
          <FiNavigation aria-hidden="true" />
          {isArabic ? "تحتاج مساعدة؟" : "Need help?"}
        </button>
      )}
    </div>
  );
};

export default ChatbotWidget;
