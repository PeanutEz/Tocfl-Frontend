import AuthGate from "@/components/auth/AuthGate";
import MainApp from "@/components/layout/MainApp";

/** Trang chủ "/": từ điển, hội thoại, luyện thi. */
export default function HomePage() {
  return (
    <AuthGate>
      <MainApp />
    </AuthGate>
  );
}
