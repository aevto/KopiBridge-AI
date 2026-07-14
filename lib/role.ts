const ROLE_HINT =
  /(engineer|developer|scientist|analyst|specialist|consultant|intern|manager)/i;

export function detectRoleAndCompany(jobDescription: string) {
  const lines = jobDescription
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^#+\s*/, ""))
    .filter(Boolean);
  const roleLine =
    lines.find((line) => ROLE_HINT.test(line) && line.length <= 120) ??
    "Target role";
  const [rolePart, companyPart] = roleLine.split(/\s+(?:at|@)\s+/i, 2);

  return {
    targetRole:
      rolePart
        .replace(/\s*[-|]\s*.+$/, "")
        .trim()
        .slice(0, 120) || "Target role",
    company: companyPart?.trim().slice(0, 120) ?? "",
  };
}
