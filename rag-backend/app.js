const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse/lib/pdf-parse");
const cors = require("cors");

const { createEmbedding } = require("./utils/embeddings");
const { cosineSimilarity } = require("./utils/similarity");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

let documentText = "";
let documentChunks = [];
let vectorStore = [];

// -------------------- Helper Functions --------------------

function chunkText(text, chunkSize = 250) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }

  return chunks;
}

function formatAnswer(chunks) {
  if (!chunks || chunks.length === 0) {
    return "No relevant information found in the document.";
  }

  let answer = "Based on this document:\n\n";
  answer += chunks[0].slice(0, 500).trim() + "\n\n";

  if (chunks.length > 1) {
    answer += "Key points:\n";

    chunks.slice(1).forEach((chunk) => {
      const cleanChunk = chunk.replace(/\n+/g, " ").trim();
      answer += "• " + cleanChunk.slice(0, 200) + "...\n";
    });
  }

  answer += "\nConclusion: This information is derived from the uploaded document.";
  return answer;
}

// -------------------- PDF Upload + Embeddings --------------------

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF uploaded" });
    }

    filePath = req.file.path;

    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    documentText = data.text || "";

    if (!documentText.trim()) {
      return res.status(422).json({
        error: "Could not extract text from PDF. It may be scanned/image-based.",
      });
    }

    documentChunks = chunkText(documentText);
    vectorStore = [];

    console.log("Chunks created:", documentChunks.length);
    

    for (const chunk of documentChunks) {
      const embedding = await createEmbedding(chunk);

      vectorStore.push({
        chunk,
        embedding,
      });
    }

    console.log("Vector store size:", vectorStore.length);
    console.log("Embedding dimension:", vectorStore[0]?.embedding?.length);

    res.json({
      message: "PDF uploaded, parsed, chunked, and embedded successfully",
      pages: data.numpages,
      chunks: documentChunks.length,
      vectors: vectorStore.length,
    });
  } catch (error) {
    console.error("PDF Upload Error:", error);

    res.status(500).json({
      error: "Failed to process PDF",
      details: error.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// -------------------- Ask Question Using Embeddings --------------------

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!vectorStore.length) {
      return res.json({ answer: "No document uploaded yet" });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Please provide a question" });
    }

    const queryEmbedding = await createEmbedding(question);

    const scoredChunks = vectorStore.map((item) => {
      const score = cosineSimilarity(queryEmbedding, item.embedding);

      return {
        chunk: item.chunk,
        score,
      };
    });

    const topChunks = scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(
      "Top similarity scores:",
      topChunks.map((item) => item.score)
    );

    const answer = formatAnswer(topChunks.map((item) => item.chunk));

    res.json({
      answer,
      scores: topChunks.map((item) => item.score),
    });
  } catch (error) {
    console.error("Ask Error:", error);

    res.status(500).json({
      error: "Failed to retrieve answer",
      details: error.message,
    });
  }
});

// -------------------- Resume Analyzer --------------------

app.post("/analyse-resume", upload.single("pdf"), async (req, res) => {
  let filePath;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    filePath = req.file.path;

    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const resumeText = data.text || "";

    if (!resumeText.trim()) {
      return res.status(422).json({
        error: "Could not extract text from resume PDF.",
      });
    }

    const lowerText = resumeText.toLowerCase();

    const skillsList = [
      "python",
      "java",
      "javascript",
      "react",
      "angular",
      "node",
      "express",
      "html",
      "css",
      "sql",
      "mongodb",
      "kafka",
      "spring boot",
      "aws",
      "docker",
      "kubernetes",
    ];

    const foundSkills = skillsList.filter((skill) =>
      lowerText.includes(skill.toLowerCase())
    );

    const requiredSections = [
      "projects",
      "experience",
      "education",
      "skills",
      "achievements",
      "leadership",
    ];

    const missingSections = requiredSections.filter(
      (section) => !lowerText.includes(section.toLowerCase())
    );

    res.json({
      skills: foundSkills,
      missing: missingSections,
      suggestion: "Add strong project descriptions and measurable achievements.",
    });
  } catch (error) {
    console.error("Resume Analysis Error:", error);

    res.status(500).json({
      error: "Failed to analyze resume",
      details: error.message,
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// -------------------- JD Analyzer --------------------

app.post("/analyze-JD", upload.array("pdfs", 2), async (req, res) => {
  let resumePath;
  let jdPath;

  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        error: "Please upload both Resume and Job Description.",
      });
    }

    resumePath = req.files[0].path;
    jdPath = req.files[1].path;

    const resumeBuffer = fs.readFileSync(resumePath);
    const jdBuffer = fs.readFileSync(jdPath);

    const [resumeParser, jdParser] = await Promise.all([
      pdfParse(resumeBuffer),
      pdfParse(jdBuffer),
    ]);

    const resumeText = resumeParser.text
      ? resumeParser.text.toLowerCase()
      : "";

    const jdText = jdParser.text ? jdParser.text.toLowerCase() : "";

    if (!resumeText || !jdText) {
      return res.status(422).json({
        error:
          "Could not extract text from one or both PDFs. Please ensure they are not scanned images.",
      });
    }

    const masterSkills = [
      "java",
      "python",
      "javascript",
      "angular",
      "react",
      "node",
      "express",
      "spring boot",
      "aws",
      "sql",
      "mongodb",
      "kafka",
      "docker",
      "kubernetes",
    ];

    const resumeSkills = masterSkills.filter((skill) =>
      resumeText.includes(skill.toLowerCase())
    );

    const jdSkills = masterSkills.filter((skill) =>
      jdText.includes(skill.toLowerCase())
    );

    const matchedSkills = jdSkills.filter((skill) =>
      resumeSkills.includes(skill)
    );

    const missingSkills = jdSkills.filter(
      (skill) => !resumeSkills.includes(skill)
    );

    const matchScore =
      jdSkills.length > 0
        ? Math.round((matchedSkills.length / jdSkills.length) * 100)
        : 0;

    res.json({
      matchScore,
      matchedSkills,
      missingSkills,
      jdSkills,
      verdict:
        matchScore > 75
          ? "Excellent Match"
          : matchScore > 40
          ? "Potential Match"
          : "Low Alignment",
      suggestion:
        missingSkills.length > 0
          ? `To increase your score, highlight experience with: ${missingSkills.join(
              ", "
            )}.`
          : "Your profile is a perfect match for this JD!",
    });
  } catch (error) {
    console.error("JD Comparison Error:", error);

    res.status(500).json({
      error: "Failed to process the documents.",
      details: error.message,
    });
  } finally {
    [resumePath, jdPath].forEach((path) => {
      if (path && fs.existsSync(path)) fs.unlinkSync(path);
    });
  }
});

// -------------------- Server --------------------

app.listen(port, (req,res) => {
  console.log(`Server running on port ${port}`);
});