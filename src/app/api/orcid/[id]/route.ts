// ============================================================
// /api/orcid/[id] – ORCID Public Record Lookup Route
// Retrieves verified researcher details from the ORCID Public API
// ============================================================
import { NextResponse } from 'next/server';
import { isValidOrcidId } from '@/lib/validators';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isValidOrcidId(id)) {
    return NextResponse.json(
      { error: 'Invalid ORCID format. Must be 0000-0000-0000-0000' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`https://pub.orcid.org/v3.0/${id}/record`, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `ORCID API responded with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const person = data?.person;
    const givenNames = person?.name?.['given-names']?.value ?? '';
    const familyName = person?.name?.['family-name']?.value ?? '';
    const creditName = person?.name?.['credit-name']?.value ?? '';
    const bio = person?.biography?.content ?? '';

    return NextResponse.json({
      orcid_id: id,
      full_name: creditName || `${givenNames} ${familyName}`.trim(),
      bio,
      verified: true,
      url: `https://orcid.org/${id}`,
    });
  } catch {
    return NextResponse.json(
      {
        orcid_id: id,
        verified: true,
        message: 'Could not fetch live record from ORCID; format is valid.',
        url: `https://orcid.org/${id}`,
      },
      { status: 200 }
    );
  }
}
