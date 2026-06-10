function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') {
    if (Array.isArray(value.auditedClaims)) return value.auditedClaims;
    if (Array.isArray(value.claims)) return value.claims;
    if (Array.isArray(value.claimVerdicts)) return value.claimVerdicts;
    if (Array.isArray(value.verdicts)) return value.verdicts;
    if (Array.isArray(value.items)) return value.items;
    if ('status' in value || 'verdict' in value || 'verdictDigest' in value || 'claimId' in value || 'id' in value) return [value];
    return Object.values(value).flatMap(asArray);
  }
  return [];
}

function collectUrls(value, urls = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/https?:\/\/[^\s)\]}"]+/g)) urls.add(match[0]);
    return urls;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUrls(item, urls);
    return urls;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectUrls(item, urls);
  }
  return urls;
}

function hasFetchedEvidence(value) {
  const text = JSON.stringify(value ?? '');
  return /fetched|inspected|retrieved|get_search_content|fetch_content|sourceurls?|url/i.test(text) && collectUrls(value).size > 0;
}

function hasExactQuantitativeClaim(value) {
  const text = JSON.stringify(value ?? '');
  return /\b\d+(?:\.\d+)?\s*(?:%|percent|ms|s|sec|seconds|minutes|hours|x|×|usd|\$|k|m|b|tokens?|users?|samples?|n\s*=)\b/i.test(text);
}

function verdictOf(claim) {
  return claim?.status ?? claim?.verdict ?? claim?.verdictDigest?.status ?? claim?.verdictDigest?.verdict ?? 'unverified';
}

function withVerdict(claim, verdict, reason) {
  const previous = verdictOf(claim);
  const gate = { previous, verdict, reason };
  return {
    ...claim,
    status: verdict,
    verdict,
    evidenceGate: gate,
    verdictDigest: {
      ...(claim?.verdictDigest ?? {}),
      status: verdict,
      verdict,
      evidenceGate: gate,
    },
  };
}

export default async function claimEvidenceGate({ sources, options = {} }) {
  const claims = Object.entries(sources ?? {}).flatMap(([sourceId, source]) => {
    return asArray(source).map((claim) => ({ sourceId, claim }));
  });

  const auditedClaims = [];
  const remainingGaps = [];
  const gateSummary = { total: 0, unchanged: 0, downgraded: 0 };

  for (const { sourceId, claim } of claims) {
    if (!claim || typeof claim !== 'object') continue;
    gateSummary.total += 1;
    const verdict = verdictOf(claim);
    const urls = [...collectUrls(claim)];
    const exactQuantitative = hasExactQuantitativeClaim(claim);
    const fetched = hasFetchedEvidence(claim);
    let next = { ...claim, sourceId, sourceUrls: urls };

    if (verdict === 'verified' && options.requireFetchedEvidenceForVerified !== false && !fetched) {
      next = withVerdict(next, 'partially_supported', 'verified claim lacked fetched/inspected URL evidence');
    }
    if (verdictOf(next) === 'verified' && options.downgradeExactQuantitativeWithoutSource !== false && exactQuantitative && urls.length === 0) {
      next = withVerdict(next, 'partially_supported', 'exact quantitative claim lacked source URL evidence');
    }

    if (verdictOf(next) !== verdict) {
      gateSummary.downgraded += 1;
      remainingGaps.push({
        claimId: claim.id ?? claim.claimId,
        evidenceState: 'insufficient_for_verified',
        sourceUrls: urls,
        nextStep: 'Fetch or inspect primary source evidence for the exact claim before using it as verified.',
      });
    } else {
      gateSummary.unchanged += 1;
    }
    auditedClaims.push(next);
  }

  return { auditedClaims, gateSummary, remainingGaps };
}
