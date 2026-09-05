#!/usr/bin/env npx tsx
/**
 * Download official exam syllabus PDFs and publish them in Learn → Syllabus.
 * Requires DATABASE_URL and S3_* in the environment.
 */
import "./normalizeS3Env.js";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { downloadOfficialPdf } from "../src/services/ingest/officialPdfDownload.js";
import { getS3Bucket, listObjectKeys, uploadToS3 } from "../src/services/s3.js";
import { syncOfficialSyllabusFromS3 } from "../src/services/officialSyllabus/sync.js";
import { assertOfficialRedistributionAllowed } from "../src/services/preloaded/copyrightCompliance.js";
import { fetchWithRetry } from "../src/utils/fetchRetry.js";
import prisma from "../src/utils/prisma.js";

type Target = { url: string; key: string };

/** Moves after earlier seed layouts — CSE under Civil Services; ESE with GATE. */
const RELOCATE: { from: string; to: string }[] = [
  {
    from: "admin/official-syllabus/upsc/cse-2026/source.pdf",
    to: "admin/official-syllabus/upsc/cse/cse-2026/source.pdf",
  },
  {
    from: "admin/official-syllabus/upsc/ese/ese-2026/source.pdf",
    to: "admin/official-syllabus/gate/ese/ese-2026/source.pdf",
  },
];

const GATE_CODES = [
  "AE", "AG", "AR", "BM", "BT", "CE", "CH", "CS", "CY", "DA",
  "EC", "EE", "ES", "EY", "GE", "GG", "IN", "MA", "ME", "MN",
  "MT", "NM", "PE", "PH", "PI", "ST", "TF", "GA",
] as const;

const UPSC: Target[] = [
  ["Notif-CSP-2026-Engl-060226Rev.pdf", "upsc/cse/cse-2026"],
  ["Notif-CDSE-I-2026-Engl-101225.pdf", "upsc/cds/cds-i-2026"],
  ["Notif-CDS-II-2026-Engl-200526.pdf", "upsc/cds/cds-ii-2026"],
  ["ExamNotifi_CAPF_AC_Exam_2026_Eng_20022026.pdf", "upsc/capf/capf-2026"],
  ["Notif-NDA-II-2026-Engl-200526.pdf", "upsc/nda/nda-ii-2026"],
  ["Exam_Notification_IES_ISS_Eng_11022026.pdf", "upsc/ies-iss/ies-iss-2026"],
  ["Notification-CMSE-2026-English-110326.pdf", "upsc/cms/cms-2026"],
  ["Notif-IFSP-2026-Engl-060226Rev.pdf", "upsc/ifos/ifos-2026"],
].map(([file, path]) => ({
  url: `https://www.upsc.gov.in/sites/default/files/${file}`,
  key: `admin/official-syllabus/${path}/source.pdf`,
}));

const GATE_ESE: Target = {
  url: "https://www.upsc.gov.in/sites/default/files/Notif-ESEP-26-Engl.pdf",
  key: "admin/official-syllabus/gate/ese/ese-2026/source.pdf",
};

const OTHER: Target[] = [
  {
    url: "https://rpsc.rajasthan.gov.in/Static/Syllabus/68FB17B0-E0F3-4205-85A1-BEC20BEA21BE.pdf",
    key: "admin/official-syllabus/state-pcs/rpsc/rpsc-ras-pre-2024/source.pdf",
  },
  {
    url: "https://rpsc.rajasthan.gov.in/Static/Syllabus/9B51F390-7253-4DE7-9FFD-BE4D8C2F6E2A.pdf",
    key: "admin/official-syllabus/state-pcs/rpsc/rpsc-ras-mains-2024/source.pdf",
  },
  {
    url: "https://delhihighcourt.nic.in/files/2026-02/notifications-and-practice-directions/djs_rules_as_on_09.02.2026_1.pdf",
    key: "admin/official-syllabus/judiciary/djs/djs-rules-2026/source.pdf",
  },
  {
    url: "https://delhihighcourt.nic.in/files/2026-07/recuritment/important_instructions_dhjs-2026_0.pdf",
    key: "admin/official-syllabus/judiciary/dhjs/dhjs-2026/source.pdf",
  },
];

function targets(): Target[] {
  const gate: Target[] = GATE_CODES.map((code) => ({
    url: `https://gate2026.iitg.ac.in/doc/GATE2026_Syllabus/${code}_2026_Syllabus.pdf`,
    key: `admin/official-syllabus/gate/${code.toLowerCase()}/${code.toLowerCase()}-2026/source.pdf`,
  }));
  return [...UPSC, GATE_ESE, ...gate, ...OTHER];
}

function s3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

async function relocateMisplaced(): Promise<string[]> {
  const client = s3Client();
  const bucket = getS3Bucket();
  const movedFrom: string[] = [];
  for (const { from, to } of RELOCATE) {
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: from }));
    } catch {
      continue;
    }
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: to }));
    } catch {
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${from}`,
          Key: to,
          ContentType: "application/pdf",
        })
      );
    }
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: from }));
    movedFrom.push(from);
    console.log("relocated", from, "->", to);
  }
  if (movedFrom.length > 0) {
    await prisma.article.updateMany({
      where: { pdfKey: { in: movedFrom } },
      data: {
        status: "ARCHIVED",
        pdfKey: null,
        archivedAt: new Date(),
      },
    });
  }
  return movedFrom;
}

async function downloadPdf(url: string): Promise<Buffer> {
  assertOfficialRedistributionAllowed(url);
  if (url.includes("gate2026.iitg.ac.in")) {
    return downloadOfficialPdf(url);
  }
  const res = await fetchWithRetry(url, {
    timeoutMs: 120_000,
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "application/pdf,*/*",
      "Accept-Language": "en-IN,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`PDF download failed (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const relocated = await relocateMisplaced();
  console.log("relocated", relocated.length);
  const existing = new Set(
    await listObjectKeys("admin/official-syllabus/", { max: 500 })
  );
  const uploaded: string[] = [];
  for (const item of targets()) {
    if (existing.has(item.key)) continue;
    const pdf = await downloadPdf(item.url);
    if (!pdf.subarray(0, 5).toString("utf8").startsWith("%PDF")) {
      throw new Error(`${item.key} is not a PDF`);
    }
    await uploadToS3(item.key, pdf, "application/pdf");
    uploaded.push(item.key);
    console.log("uploaded", item.key, pdf.length);
  }

  const published = await syncOfficialSyllabusFromS3();
  console.log(JSON.stringify({ uploaded: uploaded.length, relocated, published }));
}

void main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
