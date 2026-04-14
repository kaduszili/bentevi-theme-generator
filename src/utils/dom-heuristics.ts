type LogoCandidate = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  id: string;
  areaRole: string;
  textHint: string;
  visible: boolean;
};

function containsBrandHint(value: string): boolean {
  return /(logo|brand|wordmark)/i.test(value);
}

export function scoreLogoCandidate(candidate: LogoCandidate): number {
  let score = 0;

  if (!candidate.visible) {
    return -Infinity;
  }

  if (candidate.src) {
    score += 10;
  }

  if (containsBrandHint(candidate.alt)) {
    score += 30;
  }

  if (containsBrandHint(candidate.className)) {
    score += 25;
  }

  if (containsBrandHint(candidate.id)) {
    score += 20;
  }

  if (/header|nav|hero/.test(candidate.areaRole)) {
    score += 20;
  }

  if (candidate.textHint && containsBrandHint(candidate.textHint)) {
    score += 10;
  }

  const area = candidate.width * candidate.height;
  if (area >= 800 && area <= 50000) {
    score += 15;
  }

  if (area < 100) {
    score -= 20;
  }

  if (/sprite|icon|avatar|favicon/i.test(candidate.src)) {
    score -= 15;
  }

  return score;
}
