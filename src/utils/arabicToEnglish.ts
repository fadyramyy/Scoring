// Comprehensive Arabic-to-English Name Transliteration Utility

const DICTIONARY: Record<string, string> = {
  // Common Coptic / Biblical / Sunday School Names
  'مينا': 'Mina',
  'مارك': 'Mark',
  'ماركوس': 'Markos',
  'كيرلس': 'Kiro',
  'كيرلّس': 'Kiro',
  'بيتر': 'Peter',
  'يوحنا': 'John',
  'جون': 'John',
  'جرجس': 'George',
  'جورج': 'George',
  'چورچ': 'George',
  'ماريو': 'Mario',
  'مارينا': 'Marina',
  'مريم': 'Mary',
  'سارة': 'Sarah',
  'ساره': 'Sarah',
  'كاراس': 'Karas',
  'توماس': 'Thomas',
  'دانيال': 'Daniel',
  'داود': 'David',
  'داوود': 'David',
  'ديفيد': 'David',
  'يوسف': 'Youssef',
  'ميخائيل': 'Michael',
  'مايكل': 'Michael',
  'أبانوب': 'Abanoub',
  'ابانوب': 'Abanoub',
  'فادي': 'Fady',
  'رامي': 'Ramy',
  'سامح': 'Sameh',
  'أحمد': 'Ahmed',
  'احمد': 'Ahmed',
  'محمد': 'Mohamed',
  'ياسين': 'Yassin',
  'أنطونيوس': 'Antonios',
  'انطونيوس': 'Antonios',
  'بولس': 'Paul',
  'بيشوي': 'Bishoy',
  'بيشوى': 'Bishoy',
  'باتريك': 'Patrick',
  'اندرو': 'Andrew',
  'أندرو': 'Andrew',
  'جونثان': 'Jonathan',
  'ماتياس': 'Matthias',
  'سيمون': 'Simon',
  'فيلوباتير': 'Philopateer',
  'استير': 'Esther',
  'فيرونا': 'Verena',
  'كاترين': 'Catherine',
  'ساندرا': 'Sandra',
  'كريستين': 'Christine',
  'مونيكا': 'Monica',
  'مارتينا': 'Martina',
  'كلارا': 'Clara',
  'جلوريا': 'Gloria',
  'نادين': 'Nadine',
  'جاسمن': 'Jasmine',
  'ياسمين': 'Jasmine',
  'سيلفيا': 'Sylvia',
  'نانسي': 'Nancy',
  'شريف': 'Sherif',
  'أمير': 'Amir',
  'امير': 'Amir',
  'عماد': 'Emad',
  'عادل': 'Adel',
  'عاطف': 'Atef',
  'ماجد': 'Maged',
  'ناجي': 'Nagy',
  'سامي': 'Samy',
  'هاني': 'Hany',
  'مجدي': 'Magdy',
  'سامر': 'Samer',
  'تامر': 'Tamer',
  'رامز': 'Ramez',
  'ماهر': 'Maher',
  'نادر': 'Nader',
  'منير': 'Mounir',
  'كمال': 'Kamal',
  'جميل': 'Gamil',
  'نبيل': 'Nabil',
  'رفيق': 'Rafeek',
  'شادي': 'Shady',
  'طارق': 'Tarek',
  'وليد': 'Waleed',
  'زياد': 'Ziad',
  'يعقوب': 'Jacob',
  'ابراهيم': 'Abraham',
  'إبراهيم': 'Abraham',
  'اسحق': 'Isaac',
  'إسحق': 'Isaac',
  'موسى': 'Moses',
  'إيليا': 'Elijah',
  'ايليا': 'Elijah',
  'صموئيل': 'Samuel',
  'مكاريوس': 'Macarius',
  'جوزيف': 'Joseph',
  'مارتن': 'Martin',
  'ستيفن': 'Steven',
  'اسطفانوس': 'Stephen',
};

const CHAR_MAP: Record<string, string> = {
  'أ': 'a', 'إ': 'a', 'آ': 'a', 'ا': 'a', 'ء': '', 'ئ': 'y', 'ؤ': 'o',
  'ب': 'b',
  'ت': 't', 'ة': 'h',
  'ث': 'th',
  'ج': 'g', 'چ': 'g',
  'ح': 'h',
  'خ': 'kh',
  'د': 'd',
  'ذ': 'z',
  'ر': 'r',
  'ز': 'z',
  'س': 's',
  'ش': 'sh',
  'ص': 's',
  'ض': 'd',
  'ط': 't',
  'ظ': 'z',
  'ع': 'a',
  'غ': 'gh',
  'ف': 'f',
  'ق': 'q',
  'ك': 'k',
  'ل': 'l',
  'م': 'm',
  'ن': 'n',
  'ه': 'h',
  'و': 'w',
  'ي': 'y', 'ى': 'a',
};

function transliterateWord(word: string): string {
  const clean = word.trim().replace(/[ًٌٍَُِّْ]/g, ''); // Remove Arabic diacritics / Tashkeel
  if (!clean) return '';

  // Check dictionary
  if (DICTIONARY[clean]) {
    return DICTIONARY[clean];
  }

  // If word is already English/Latin, preserve it
  if (/^[A-Za-z]+$/.test(clean)) {
    return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  }

  // Letter by letter transliteration
  let result = '';
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    result += CHAR_MAP[char] || char;
  }

  if (!result) return word;
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

export function arabicToEnglishName(arabicText: string): string {
  if (!arabicText) return '';

  // Clean extra spaces
  const words = arabicText.trim().split(/\s+/);
  const englishWords = words.map(transliterateWord).filter(Boolean);

  return englishWords.join(' ');
}
