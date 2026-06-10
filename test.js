function validateUncountableQtyAnswer(text) {
  const t = text.trim().toLowerCase();
  return (
    /\b(a\s+little|a\s+lot|some|not\s+much|much)\b/.test(t) ||
    /\b(a|one|two|three|four|five|six|seven|eight|nine|ten)\s+(bottle|bottles|cup|cups|bag|bags)\b/.test(t) ||
    /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/.test(t) ||
    /\b\d+\b/.test(t) ||
    /\ba\s+(coffee|water|tea)\b/.test(t)
  );
}
console.log(validateUncountableQtyAnswer("Two,please."));
