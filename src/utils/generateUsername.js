const COMBINING_MARKS = /[̀-ͯ]/g;

const removeDiacritics = (str) => str
  .normalize('NFD')
  .replace(COMBINING_MARKS, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D');

// "Nguyễn Tuấn Anh" -> "anh" (tên riêng, bỏ dấu) + "nt" (chữ đầu các từ còn lại) = "anhnt"
export const buildUsernameBase = (fullName) => {
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => removeDiacritics(w).toLowerCase());

  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  const lastWord = words[words.length - 1];
  const initials = words.slice(0, -1).map((w) => w[0]).join('');
  return lastWord + initials;
};

// Trả về username không trùng cho từng base, theo đúng thứ tự đầu vào.
// existingUsernames: danh sách username đã có trong DB.
// Vừa check trùng DB vừa check trùng trong cùng batch (Set được cập nhật dần theo thứ tự xử lý).
export const resolveUniqueUsernames = (bases, existingUsernames) => {
  const taken = new Set(existingUsernames);

  return bases.map((base) => {
    let candidate = base;
    let suffix = 2;
    while (taken.has(candidate)) {
      candidate = `${base}${suffix}`;
      suffix += 1;
    }
    taken.add(candidate);
    return candidate;
  });
};
