"use server";

import { neon } from "@neondatabase/serverless";

export async function fetchAssets() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const assets = await sql`
            SELECT 
                id, 
                code, 
                name, 
                type, 
                value, 
                authenticity, 
                confidentiality, 
                integrity, 
                availability, 
                traceability, 
                created_at
            FROM assets
        `;
    return { success: true, assets };
  } catch (error) {
    console.error("Error fetching assets:", error);
    return { success: false, error: "Failed to fetch assets" };
  }
}

export async function addAsset(asset: {
  code: string;
  name: string;
  type: string;
  value: string;
  authenticity: string;
  confidentiality: string;
  integrity: string;
  availability: string;
  traceability: string;
}) {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const result = await sql`
            INSERT INTO assets (
                code, 
                name, 
                type, 
                value, 
                authenticity, 
                confidentiality, 
                integrity, 
                availability, 
                traceability 
            )
            VALUES (
                ${asset.code}, 
                ${asset.name}, 
                ${asset.type}, 
                ${asset.value}, 
                ${asset.authenticity}, 
                ${asset.confidentiality}, 
                ${asset.integrity}, 
                ${asset.availability}, 
                ${asset.traceability} 
            )
            RETURNING id
        `;
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error("Error adding asset:", error);
    return { success: false, error: "Failed to add asset" };
  }
}

export async function fetchThreats() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const threats = await sql`
              SELECT 
                  id, 
                  code, 
                  name, 
                  "group", 
                  frequency, 
                  frequency_value, 
                  affected_dimensions, 
                  affected_types, 
                  created_at
              FROM threats
          `;
    return {
      success: true,
      threats: threats.map((threat) => ({
        ...threat,
        affectedDimensions: threat.affected_dimensions,
        affectedTypes: threat.affected_types,
      })),
    };
  } catch (error) {
    console.error("Error fetching threats:", error);
    return { success: false, error: "Failed to fetch threats" };
  }
}

export async function addThreat(threat: {
  code: string;
  name: string;
  group: string;
  frequency: string;
  frequencyValue: string;
  affectedDimensions: string[];
  affectedTypes: string[];
}) {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const result = await sql`
            INSERT INTO threats (
                code, 
                name, 
                "group", 
                frequency, 
                frequency_value, 
                affected_dimensions, 
                affected_types 
            )
            VALUES (
                ${threat.code}, 
                ${threat.name}, 
                ${threat.group}, 
                ${threat.frequency}, 
                ${threat.frequencyValue}, 
                ${JSON.stringify(threat.affectedDimensions)}, 
                ${JSON.stringify(threat.affectedTypes)} 
            )
            RETURNING id
        `;
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error("Error adding threat:", error);
    return { success: false, error: "Failed to add threat" };
  }
}
export async function fetchAssessments() {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const assessments = await sql`
            SELECT 
                id, 
                asset_id, 
                threat_id, 
                impact, 
                impact_value, 
                control_effectiveness, 
                intrinsic_risk, 
                residual_risk, 
                date, 
                created_at
            FROM assessments
        `;
    return { success: true, assessments };
  } catch (error) {
    console.error("Error fetching assessments:", error);
    return { success: false, error: "Failed to fetch assessments" };
  }
}

export async function addAssessment(assessment: {
  assetId: string;
  threatId: string;
  impact: string;
  impactValue: string;
  controlEffectiveness: string;
  intrinsicRisk: string;
  residualRisk: string;
  date: string;
}) {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const result = await sql`
            INSERT INTO assessments (
                asset_id, 
                threat_id, 
                impact, 
                impact_value, 
                control_effectiveness, 
                intrinsic_risk, 
                residual_risk, 
                date 
            )
            VALUES (
                ${assessment.assetId}, 
                ${assessment.threatId}, 
                ${assessment.impact}, 
                ${assessment.impactValue}, 
                ${assessment.controlEffectiveness}, 
                ${assessment.intrinsicRisk}, 
                ${assessment.residualRisk}, 
                ${assessment.date} 
            )
            RETURNING id
        `;
    return { success: true, id: result[0].id };
  } catch (error) {
    console.error("Error adding assessment:", error);
    return { success: false, error: "Failed to add assessment" };
  }
}
