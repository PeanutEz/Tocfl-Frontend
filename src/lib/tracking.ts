import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestore, isFirebaseConfigured } from "./firebase";

// Ghi lại hành vi học viên vào Firestore để phục vụ luận văn.
// Tên collection, actionType và nội dung `details` được giữ nguyên như bản HTML cũ
// để dữ liệu cũ và mới phân tích chung được. Đừng đổi các chuỗi này nếu không cần thiết.
export const ACTIVITY_COLLECTION = "StudentActivity_TOCFL";

export type ActionType =
  | "Login"
  | "Logout"
  | "CloseTab"
  | "SwitchTab"
  | "SearchWord"
  | "Search"
  | "SubmitTest"
  | "SessionTimeout";

export function trackUserAction(actionType: ActionType, details: string): void {
  if (!isFirebaseConfigured) return;
  const email = firebaseAuth().currentUser?.email;
  if (!email) return; // Chưa đăng nhập thì không ghi

  addDoc(collection(firestore(), ACTIVITY_COLLECTION), {
    studentId: email,
    actionType,
    details,
    timestamp: serverTimestamp(),
  }).catch((error) => {
    console.error("Không ghi được hoạt động:", error);
  });
}
