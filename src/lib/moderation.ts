// ============================================================
// UniCore – Automated Content Moderation & Abuse Screening
// Protects Indian academic community against harassment,
// phishing, spam flooding, and misconduct.
// ============================================================

export interface ModerationResult {
  isClean: boolean;
  flagged: boolean;
  severity: 'none' | 'low' | 'high';
  reasons: string[];
}

// Regex patterns for spam, phishing, scams, and abusive keywords
const SPAM_PATTERNS = [
  /\b(?:free\s+crypto|airdrop|binance\s+bonus|telegram\s+signal|whatsapp\s+invest)\b/i,
  /\b(?:cash\s+app\s+flip|earn\s+\$\d+|guaranteed\s+profit|click\s+here\s+to\s+claim)\b/i,
  /\b(?:bit\.ly|tinyurl\.com|t\.me\/[a-z0-9_]+|wa\.me\/\d+)\b/i,
];

const ABUSIVE_PATTERNS = [
  /\b(?:idiot|stupid|bastard|retard|scam|loser|kill\s+yourself|go\s+die|shut\s+up|harass)\b/i,
  /\b(?:fuck|shit|asshole|bitch|cunt|nigger|faggot)\b/i,
];

/**
 * Screens text content before publishing to posts or direct messages.
 */
export function screenContent(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isClean: true, flagged: false, severity: 'none', reasons: [] };
  }

  const reasons: string[] = [];
  let severity: 'none' | 'low' | 'high' = 'none';

  // 1. Check for abusive language / severe harassment
  for (const pattern of ABUSIVE_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push('Contains abusive, offensive, or harassing language.');
      severity = 'high';
      break;
    }
  }

  // 2. Check for commercial spam & suspicious phishing links
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push('Contains suspicious links, external redirects, or financial scam patterns.');
      if (severity !== 'high') severity = 'high';
      break;
    }
  }

  // 3. Check for character repetition flooding (e.g. aaaaaaaaaaaaaaa)
  if (/(.)\1{14,}/i.test(text)) {
    reasons.push('Excessive character repetition or flood spam detected.');
    if (severity === 'none') severity = 'low';
  }

  // 4. Check for URL flooding (more than 4 external links in a single message)
  const linkMatches = text.match(/https?:\/\/[^\s]+/g);
  if (linkMatches && linkMatches.length > 4) {
    reasons.push('Excessive URL density (potential link spam).');
    if (severity === 'none') severity = 'low';
  }

  const flagged = reasons.length > 0;
  return {
    isClean: !flagged,
    flagged,
    severity,
    reasons,
  };
}

export type ReportCategory =
  | 'harassment'
  | 'spam'
  | 'academic_misconduct'
  | 'inappropriate_media'
  | 'phishing';

export interface ContentReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  target_type: 'message' | 'post' | 'comment';
  target_id: string;
  category: ReportCategory;
  details?: string;
  content_snippet?: string;
  created_at: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
}

