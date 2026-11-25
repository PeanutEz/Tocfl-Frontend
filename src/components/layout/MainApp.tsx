"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useUser } from "@/components/auth/AuthGate";
import { ArrowUp, BookOpen, ClipboardCheck, Languages, LayoutGrid, Menu, MessagesSquare, Puzzle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { firebaseAuth } from "@/lib/firebase";
import { trackUserAction } from "@/lib/tracking";
import { consumeCacheClearedFlag, loadDialogues, loadDictionary, loadGrammar, loadTopics } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";
import { useScrollY } from "@/hooks/use-scroll-y";
import { glossesOf, searchWords, suggestWords, type SearchDirection } from "@/lib/text";
import { levelOf, searchDialogues } from "@/lib/dialogues";
import { buildRadicalIndex } from "@/lib/radicals";
import { pauseAllAudio, stopSpeaking } from "@/lib/speech";
import { getUnsavedAnswers } from "@/lib/unsaved-work";
import type { Word } from "@/types";
import SearchBox, { type Suggestion } from "@/components/ui/SearchBox";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MobileMenu from "./MobileMenu";
import AccountMenu from "./AccountMenu";
import SettingsDialog from "./SettingsDialog";
import DictionaryTab from "@/components/dictionary/DictionaryTab";
import DialogueTab, { type DialogueFocus } from "@/components/dialogue/DialogueTab";
import ExamTab from "@/components/exam/ExamTab";
import TranslateTab from "@/components/translate/TranslateTab";
import TopicTab, { pageOfTopic } from "@/components/topics/TopicTab";
import GrammarTab from "@/components/grammar/GrammarTab";
import ThemeToggle from "@/components/ui/ThemeToggle";

type TabId = "dict" | "topic" | "grammar" | "speak" | "exam" | "translate";

const TABS: { id: TabId; label: string; icon: LucideIcon; trackDetail: string }[] = [
  { id: "dict", label: "Từ điển", icon: BookOpen, trackDetail: "Chuyển sang tab Từ Điển" },
  { id: "topic", label: "Từ vựng theo chủ đề", icon: LayoutGrid, trackDetail: "Chuyển sang tab Từ Vựng Theo Chủ Đề" },
  { id: "grammar", label: "Ngữ pháp", icon: Puzzle, trackDetail: "Chuyển sang tab Ngữ Pháp" },
  { id: "speak", label: "Hội thoại & đoạn văn", icon: MessagesSquare, trackDetail: "Chuyển sang tab Hội Thoại" },
  { id: "exam", label: "Luyện thi TOCFL", icon: ClipboardCheck, trackDetail: "Chuyển sang tab Luyện Thi TOCFL" },
  { id: "translate", label: "Dịch", icon: Languages, trackDetail: "Chuyển sang tab Dịch" },
];

const INACTIVITY_MS = 30 * 60 * 1000;

/** Ghi nhận đóng tab và treo máy 30 phút (giữ nguyên cách ghi của bản cũ). */
function useSessionTracking() {
  useEffect(() => {
    const onUnload = () => {
      trackUserAction("CloseTab", "Học sinh tắt tab hoặc đóng trình duyệt");
      trackUserAction("Logout", "Học sinh đóng tab hoặc tắt trình duyệt");
    };
    window.addEventListener("beforeunload", onUnload);

    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => trackUserAction("SessionTimeout", "Hệ thống tự động đăng xuất sau 30 phút không thao tác"),
        INACTIVITY_MS,
      );
    };
    const events = ["click", "mousemove", "keydown", "scroll"] as const;
    events.forEach((evt) => document.addEventListener(evt, reset, { passive: true }));
    reset();

    return () => {
      window.removeEventListener("beforeunload", onUnload);
      events.forEach((evt) => document.removeEventListener(evt, reset));
      clearTimeout(timer);
    };
  }, []);
}


export default function MainApp() {
  const user = useUser();
  const [tab, setTab] = useState<TabId>("dict");
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Số câu đã chọn mà chưa nộp khi bấm đăng xuất (null = không hỏi)
  const [logoutUnsaved, setLogoutUnsaved] = useState<number | null>(null);
  const scrollY = useScrollY();
  const scrolled = scrollY > 120; // phần tiêu đề đã cuộn khuất, thanh tìm kiếm đang dính
  const showToTop = scrollY > 500;
  useSessionTracking();

  // Vừa xoá bộ nhớ đệm và tải lại trang: báo cho học viên biết đã xong
  useEffect(() => {
    if (consumeCacheClearedFlag()) toast.success("Đã xoá bộ nhớ đệm", { description: "Dữ liệu bài học đã được tải lại bản mới nhất." });
  }, []);

  // --- Từ điển ---
  const words = useAsync(loadDictionary, []);
  const [dictQuery, setDictQuery] = useState("");
  const [dictDir, setDictDir] = useState<SearchDirection>("zh-vi");
  const [dictResults, setDictResults] = useState<Word[] | null>(null);
  const [dictPage, setDictPage] = useState(1);
  // Lượt tìm đang áp dụng: "q" = tìm theo từ khoá, "w" = chọn đúng một từ từ gợi ý
  const [dictFilter, setDictFilter] = useState<{ kind: "q" | "w"; value: string } | null>(null);
  const [urlRestored, setUrlRestored] = useState(false);

  // --- Từ vựng theo chủ đề ---
  const topics = useAsync(loadTopics, []);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [topicPage, setTopicPage] = useState(1);

  // --- Ngữ pháp ---
  const grammar = useAsync(loadGrammar, []);
  const [grammarId, setGrammarId] = useState<string | null>(null);

  // Khôi phục tab / từ khoá / trang từ URL khi tải lại trang (vd: ?q=ban&page=3)
  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab");
    if (tabParam === "topic" || tabParam === "grammar" || tabParam === "speak" || tabParam === "exam" || tabParam === "translate") setTab(tabParam);
    if (tabParam === "grammar") setGrammarId(new URLSearchParams(window.location.search).get("g")?.trim() || null);
    if (tabParam === "topic") setTopicId(new URLSearchParams(window.location.search).get("topic")?.trim() || null);
  }, []);

  useEffect(() => {
    if (!words.data || urlRestored) return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q")?.trim();
    const w = params.get("w")?.trim();
    let results: Word[] | null = null;

    if (w) {
      results = words.data.filter((item) => item.word === w);
      setDictQuery(w);
      setDictFilter({ kind: "w", value: w });
    } else if (q) {
      const dir: SearchDirection = params.get("dir") === "vi-zh" ? "vi-zh" : "zh-vi";
      setDictDir(dir);
      results = searchWords(words.data, q, dir);
      setDictQuery(q);
      setDictFilter({ kind: "q", value: q });
    }
    if (results) setDictResults(results);

    const total = Math.max(1, Math.ceil((results ?? words.data).length / 10));
    const page = parseInt(params.get("page") ?? "1", 10);
    setDictPage(Number.isFinite(page) ? Math.min(Math.max(page, 1), total) : 1);
    setUrlRestored(true);
  }, [words.data, urlRestored]);

  // Ghi trạng thái hiện tại lên URL (thay thế, không thêm lịch sử)
  useEffect(() => {
    if (!urlRestored) return;
    const params = new URLSearchParams();
    if (tab !== "dict") params.set("tab", tab);
    if (tab === "topic" && topicId) params.set("topic", topicId);
    if (tab === "grammar" && grammarId) params.set("g", grammarId);
    if (dictFilter) params.set(dictFilter.kind, dictFilter.value);
    if (dictFilter?.kind === "q" && dictDir === "vi-zh") params.set("dir", dictDir);
    if (dictPage > 1) params.set("page", String(dictPage));
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`;
    if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      window.history.replaceState(window.history.state, "", url);
    }
  }, [urlRestored, tab, topicId, grammarId, dictFilter, dictDir, dictPage]);

  // --- Hội thoại ---
  const dialogues = useAsync(loadDialogues, []);
  const [diagQuery, setDiagQuery] = useState("");
  const [focus, setFocus] = useState<DialogueFocus | null>(null);

  function switchTab(next: TabId) {
    // Bản gốc ghi nhận mọi lần bấm tab, kể cả bấm lại tab đang mở: giữ nguyên để số liệu luận văn nhất quán
    trackUserAction("SwitchTab", TABS.find((t) => t.id === next)!.trackDetail);
    if (next === tab) return;
    stopSpeaking();
    pauseAllAudio();
    if (next === "speak") {
      // Vào lại tab hội thoại thì bắt đầu từ bài đầu tiên, xoá kết quả tìm cũ
      setDiagQuery("");
      setFocus(null);
    }
    setTab(next);
  }

  // Mở / đóng một chủ đề; quay lại danh sách thì về đúng trang chứa chủ đề vừa xem
  function openTopic(id: string | null) {
    stopSpeaking();
    if (id === null && topicId) setTopicPage(pageOfTopic(topics.data, topicId));
    setTopicId(id);
  }

  function handleLogout() {
    setSigningOut(true);
    trackUserAction("Logout", "Học sinh chủ động bấm nút đăng xuất");
    // Chờ một chút để Firestore kịp ghi trước khi thoát phiên
    setTimeout(() => {
      signOut(firebaseAuth())
        .then(() => toast("Bạn đã đăng xuất", { description: "Hẹn gặp lại ở buổi ôn tập tới!" }))
        .catch(() => {
          setSigningOut(false);
          toast.error("Chưa đăng xuất được, vui lòng thử lại.");
        });
    }, 500);
  }

  // Còn bài thi đang làm dở thì hỏi lại trước khi đăng xuất
  function requestLogout() {
    const unsaved = getUnsavedAnswers();
    if (unsaved > 0) {
      setMenuOpen(false);
      setLogoutUnsaved(unsaved);
    } else handleLogout();
  }

  // Từ điển: gợi ý & tìm kiếm
  const dictSuggestions: Suggestion[] = useMemo(() => {
    if (!words.data) return [];
    return suggestWords(words.data, dictQuery, dictDir).map(({ item, via }, i) => ({
      key: `${item.word}-${i}`,
      primary: (
        <>
          <strong>{item.word}</strong> <span className="text-subtle">({item.pinyin})</span>
        </>
      ),
      // Tìm bằng tiếng Việt thì hiện nghĩa để người dùng thấy vì sao từ này khớp
      secondary: via === "vi" ? glossesOf(item.explanation).slice(0, 2).join(", ") || item.hanViet : item.hanViet,
      onSelect: () => {
        setDictQuery(item.word);
        setDictResults([item]);
        setDictFilter({ kind: "w", value: item.word });
        setDictPage(1);
      },
    }));
  }, [words.data, dictQuery, dictDir]);

  function submitDictSearch(raw: string) {
    trackUserAction("SearchWord", "Tra từ khóa: " + raw.trim());
    if (!words.data) return;
    const results = raw.trim() ? searchWords(words.data, raw, dictDir) : null;
    setDictResults(results);
    setDictFilter(raw.trim() ? { kind: "q", value: raw.trim() } : null);
    setDictPage(1);
    if (results && results.length === 0) {
      toast.info(`Không tìm thấy từ nào khớp với “${raw.trim()}”.`, {
        description: dictDir === "zh-vi" ? "Đang tra Trung → Việt. Gõ tiếng Việt thì đổi sang Việt → Trung." : "Đang tra Việt → Trung. Gõ chữ Hán hoặc pinyin thì đổi sang Trung → Việt.",
      });
    }
  }

  // Bộ thủ chỉ gồm các chữ có trong từ điển, để chọn chữ nào cũng tra ra kết quả
  const radicalIndex = useMemo(() => buildRadicalIndex((words.data ?? []).map((w) => w.word)), [words.data]);

  // Chữ chọn từ bảng vẽ tay / bộ thủ: nối vào từ khoá, chuyển sang chiều Trung → Việt
  function insertDictChar(ch: string) {
    if (dictDir !== "zh-vi") toggleDictDir();
    setDictQuery((q) => (dictDir === "zh-vi" ? q : "") + ch);
  }

  // Đổi chiều tra; đang có kết quả tìm theo từ khoá thì tìm lại theo chiều mới
  function toggleDictDir() {
    const next: SearchDirection = dictDir === "zh-vi" ? "vi-zh" : "zh-vi";
    setDictDir(next);
    if (words.data && dictFilter?.kind === "q") {
      setDictResults(searchWords(words.data, dictFilter.value, next));
      setDictPage(1);
    }
  }

  // Hội thoại: gợi ý & nhảy tới bài
  function jumpToDialogue(idx: number) {
    const d = dialogues.data?.[idx];
    if (!d) return;
    setFocus({ level: levelOf(d), lesson: d.lesson, index: idx, nonce: Date.now() });
  }

  const diagSuggestions: Suggestion[] = useMemo(() => {
    if (!dialogues.data) return [];
    return searchDialogues(dialogues.data, diagQuery).map((idx) => {
      const d = dialogues.data![idx];
      return {
        key: String(idx),
        primary: d.title,
        secondary: `${levelOf(d)} · ${d.lesson}`,
        onSelect: () => jumpToDialogue(idx),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogues.data, diagQuery]);

  function submitDiagSearch(raw: string) {
    if (!raw.trim() || !dialogues.data) return;
    trackUserAction("Search", "Tra hội thoại: " + raw);
    const [first] = searchDialogues(dialogues.data, raw, 1);
    if (first === undefined) toast.info(`Chưa có hội thoại nào chứa “${raw.trim()}”.`);
    else jumpToDialogue(first);
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-lg bg-surface p-2 shadow-[0_5px_15px_rgba(0,0,0,0.1)] sm:w-[96%] sm:p-5">
      <header className="rounded-t-lg bg-brand px-4 pt-3 text-center text-white sm:px-5 sm:pt-4">
        <div className="mb-1 flex items-center justify-center gap-3 sm:justify-between">
          <span className="rounded bg-white/15 px-2.5 py-1 text-xs font-semibold tracking-wide sm:text-sm">國立臺南大學 NUTN</span>
          {/* Màn hình nhỏ dùng menu hamburger nên chỉ hiện từ sm trở lên */}
          <div className="hidden items-center gap-2 sm:flex">
            <ThemeToggle />
            <AccountMenu
              email={user.email ?? ""}
              signingOut={signingOut}
              onLogout={requestLogout}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </div>
        </div>

        <h1 className="text-[22px] font-bold leading-tight sm:text-[28px]">Maomi Chinese Dictionary</h1>
      </header>

      {/* Thanh tìm kiếm + tab: dính lên đầu màn hình khi cuộn xuống.
          Màn hình nhỏ: một hàng gồm nút menu + ô tìm kiếm, các tab nằm trong menu trượt. */}
      <div
        className={`sticky top-0 z-40 rounded-b-lg bg-brand px-2.5 pb-2.5 pt-2.5 text-center text-white transition-shadow sm:px-4 sm:py-2.5 ${
          scrolled ? "shadow-[0_8px_24px_rgba(0,0,0,0.25)]" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 active:scale-95 sm:hidden"
          >
            <Menu size={22} />
          </button>
          <div className="min-w-0 flex-1">
            {tab === "dict" && (
              <SearchBox
                value={dictQuery}
                onChange={setDictQuery}
                onSubmit={submitDictSearch}
                onClear={() => {
                  setDictResults(null);
                  setDictFilter(null);
                  setDictPage(1);
                }}
                suggestions={dictSuggestions}
                direction={{
                  active: dictDir === "zh-vi" ? "zh" : "vi",
                  label: dictDir === "zh-vi" ? "Đang tra Trung sang Việt" : "Đang tra Việt sang Trung",
                  onToggle: toggleDictDir,
                }}
                charTools={{ radicals: radicalIndex, onInsert: insertDictChar }}
                placeholder={dictDir === "zh-vi" ? "Gõ chữ Hán hoặc pinyin: 你好, nihao…" : "Gõ tiếng Việt: xin chào, bạn bè…"}
              />
            )}
            {tab === "speak" && (
              <SearchBox
                value={diagQuery}
                onChange={setDiagQuery}
                onSubmit={submitDiagSearch}
                suggestions={diagSuggestions}
                placeholder="Tìm hội thoại: chữ Hán, pinyin, nghĩa…"
              />
            )}
            {tab === "topic" && (
              <p className="flex items-center gap-2 text-left text-lg font-bold sm:hidden">
                <LayoutGrid size={20} /> Từ vựng theo chủ đề
              </p>
            )}
            {tab === "grammar" && (
              <p className="flex items-center gap-2 text-left text-lg font-bold sm:hidden">
                <Puzzle size={20} /> Ngữ pháp
              </p>
            )}
            {tab === "exam" && (
              <p className="flex items-center gap-2 text-left text-lg font-bold sm:hidden">
                <ClipboardCheck size={20} /> Luyện thi TOCFL
              </p>
            )}
            {tab === "translate" && (
              <p className="flex items-center gap-2 text-left text-lg font-bold sm:hidden">
                <Languages size={20} /> Dịch Trung - Việt
              </p>
            )}
          </div>
        </div>

        <nav
          className={`hidden flex-wrap items-center justify-center gap-2 sm:flex ${tab === "exam" || tab === "translate" || tab === "topic" || tab === "grammar" ? "" : "mt-2"}`}
          aria-label="Chức năng"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => switchTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-[15px] font-bold transition ${
                tab === id ? "bg-surface text-brand" : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        tabs={TABS}
        current={tab}
        onSelect={(id) => {
          setMenuOpen(false);
          switchTab(id as TabId);
          window.scrollTo({ top: 0 });
        }}
        email={user.email ?? ""}
        signingOut={signingOut}
        onLogout={requestLogout}
        onOpenSettings={() => {
          setMenuOpen(false);
          setSettingsOpen(true);
        }}
      />

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="mt-4 sm:mt-5">
        <div hidden={tab !== "dict"}>
          <DictionaryTab
            state={words}
            items={dictResults ?? words.data ?? []}
            page={dictPage}
            onPageChange={setDictPage}
          />
        </div>
        <div hidden={tab !== "topic"}>
          {tab === "topic" && (
            <TopicTab
              topics={topics}
              words={words}
              topicId={topicId}
              page={topicPage}
              onPageChange={setTopicPage}
              onOpenTopic={openTopic}
            />
          )}
        </div>
        <div hidden={tab !== "grammar"}>
          {tab === "grammar" && <GrammarTab state={grammar} pointId={grammarId} onOpen={setGrammarId} />}
        </div>
        <div hidden={tab !== "speak"}>
          {tab === "speak" && <DialogueTab state={dialogues} focus={focus} />}
        </div>
        <div hidden={tab !== "exam"}>
          <ExamTab />
        </div>
        <div hidden={tab !== "translate"}>
          <TranslateTab />
        </div>
      </main>

      <ConfirmDialog
        open={logoutUnsaved !== null}
        title="Đăng xuất khi chưa nộp bài?"
        description={
          <>
            Bạn đã chọn đáp án cho <strong>{logoutUnsaved} câu</strong> trong đề thi nhưng chưa nộp. Đăng xuất thì các đáp án này sẽ bị
            xoá.
          </>
        }
        cancelLabel="Ở lại làm tiếp"
        confirmLabel="Vẫn đăng xuất"
        onCancel={() => setLogoutUnsaved(null)}
        onConfirm={() => {
          setLogoutUnsaved(null);
          handleLogout();
        }}
      />

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Lên đầu trang"
        title="Lên đầu trang"
        className={`fixed bottom-4 right-4 z-30 flex h-11 w-11 cursor-pointer sm:bottom-6 sm:right-6 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-brand text-white shadow-[0_6px_16px_rgba(178,34,34,0.4)] transition-all duration-300 hover:bg-brand-dark active:scale-95 ${
          showToTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
