export const THEME_STORAGE_KEY = "theme";

/** Mặc định giao diện Sáng; chỉ tối khi học viên chọn "Tối", hoặc "Theo máy" và máy đang để tối.
 *  Script chạy trước khi trang hiện ra (đặt trong <head>) để không bị nháy nền trắng ở chế độ tối. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
