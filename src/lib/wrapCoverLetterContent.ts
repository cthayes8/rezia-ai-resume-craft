/**
 * Helper to wrap an AI-generated cover letter body with greeting and sign-off.
 */
export type CoverLetterInput = {
  body: string; // AI-generated letter body (no greeting or sign-off)
  hiringManagerName?: string;
  companyName?: string;
  userName: string;
  userLinkedIn?: string;
  userEmail?: string;
  userPhone?: string;
};

export function wrapCoverLetterContent({
  body,
  hiringManagerName,
  companyName,
  userName,
  userLinkedIn,
  userEmail,
  userPhone,
}: CoverLetterInput): string {
  // Greeting
  const greeting = hiringManagerName
    ? `Dear ${hiringManagerName},`
    : companyName
    ? `Dear ${companyName} Hiring Team,`
    : 'Dear Hiring Manager,';

  // Sign-off lines: include only defined contact info, each on its own line
  const contactLines: string[] = [];
  if (userName?.trim()) contactLines.push(userName.trim());
  if (userLinkedIn?.trim()) contactLines.push(userLinkedIn.trim());
  if (userEmail?.trim()) contactLines.push(userEmail.trim());
  if (userPhone?.trim()) contactLines.push(userPhone.trim());
  // Build sign-off: greeting + contact lines, each separated by single newline
  const signOffLines = ['Sincerely,', ...contactLines];
  const signOff = signOffLines.join('\n');

  // Construct full letter
  return `${greeting}\n\n${body.trim()}\n\n${signOff}`;
}