// Câu cảm hứng học tập hiện ở màn hình chờ: nghĩa tiếng Việt, câu gốc (chữ phồn thể) và pinyin.

export type Quote = { vi: string; zh: string; py: string };

export const STUDY_QUOTES: Quote[] = [
  {
    vi: "Đường xa vạn dặm cũng bắt đầu từ một bước chân.",
    zh: "千里之行，始於足下。",
    py: "Qiān lǐ zhī xíng, shǐ yú zú xià.",
  },
  {
    vi: "Việc học như chèo thuyền ngược nước, không tiến ắt sẽ lùi.",
    zh: "學如逆水行舟，不進則退。",
    py: "Xué rú nì shuǐ xíng zhōu, bú jìn zé tuì.",
  },
  {
    vi: "Có công mài sắt, có ngày nên kim.",
    zh: "只要功夫深，鐵杵磨成針。",
    py: "Zhǐ yào gōngfu shēn, tiě chǔ mó chéng zhēn.",
  },
  {
    vi: "Học rồi thường xuyên ôn lại, chẳng phải vui lắm sao?",
    zh: "學而時習之，不亦說乎？",
    py: "Xué ér shí xí zhī, bú yì yuè hū?",
  },
  {
    vi: "Ôn lại điều cũ, sẽ hiểu thêm điều mới.",
    zh: "溫故而知新。",
    py: "Wēn gù ér zhī xīn.",
  },
  {
    vi: "Góp gió thành bão, tích ít thành nhiều.",
    zh: "積少成多。",
    py: "Jī shǎo chéng duō.",
  },
  {
    vi: "Có chí thì nên.",
    zh: "有志者事竟成。",
    py: "Yǒu zhì zhě shì jìng chéng.",
  },
];
