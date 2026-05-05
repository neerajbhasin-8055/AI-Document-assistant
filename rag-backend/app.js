const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse/lib/pdf-parse');
const cors = require('cors');

const app = express();
const port = 3000;
app.use(cors())
app.use(express.json())// converts incoming JSON to JavaScript Object

const upload = multer({ dest: 'uploads/' })

let documentText = ""
let documentChunks = []


// functions
let chunkText = (text, chunkSize = 250) => {
    const words = text.split(/\s+/)
    const chunks = []
    for (let i = 0; i < words.length; i += chunkSize) {
        const chunk = words.slice(i, i + chunkSize).join(" ")
        chunks.push(chunk)
    }
    return chunks
}


let formatAnswer = (chunks, question) => {
    let answer = "Based on this document.\n\n";
    answer += chunks[0].slice(0, 300) + "\n\n";

    if (chunks.length > 1) {
        answer += "Key points:\n";
        chunks.slice(1).forEach(chunk => {
            // 1. Remove extra spaces or newlines from the start/end
            let cleanChunk = chunk.trim();

            // 2. Check if it already starts with a bullet (•), dash (-), or asterisk (*)
            const hasBullet = /^[-•*]/.test(cleanChunk);

            if (hasBullet) {
                // If it has one, just add a space if needed and use it
                answer += cleanChunk.slice(0, 150) + "...\n";
            } else {
                // If it doesn't have one, add your bullet
                answer += "• " + cleanChunk.slice(0, 150) + "...\n";
            }
        });
    }

    answer += "\nConclusion: This information is derived from the uploaded document.";
    return answer;
};

// routes
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const filePath = req.file.path;

        const buffer = fs.readFileSync(filePath);// Converts file text into binary data(buffer)

        const data = await pdfParse(buffer) // pdf parser process this buffer(binary data) not directly the text

        fs.unlinkSync(filePath); // deletes file after reading

        documentText = data.text
        documentChunks = chunkText(documentText)

        console.log(documentText);
        console.log("Chunks created: ", documentChunks)

        res.json({
            message: "PDF uploaded and processed successfully",
            pages: data.numpages,
            text: data.text
        }); // Sends response back to the client

    } catch (error) {
        res.status(500).json({
            error: "Failed to parse pdf",
            details: error.message
        });
    }
});


app.post("/analyse-resume", upload.single('pdf'), async (req, res) => {
    // 1. Check if file exists before proceeding
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;

    try {
        // 2. Read and Parse the PDF
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        const documentText = data.text;

        // 3. Logic: Extract Skills and Missing Sections
        const skillsList = ['python', 'java', 'javascript', 'react', 'node', 'express', 'html', 'css', 'sql', 'mongodb', 'kafka'];
        const foundSkills = skillsList.filter(skill =>
            documentText.toLowerCase().includes(skill.toLowerCase())
        );

        const requiredSections = ['projects', 'experience', 'education', 'skills', 'achievements', 'leadership'];
        const missingSections = requiredSections.filter(section =>
            !documentText.toLowerCase().includes(section.toLowerCase())
        );

        // 4. Send Success Response
        res.json({
            skills: foundSkills,
            missing: missingSections,
            suggestion: "Add strong project descriptions and measurable achievements."
        });

    } catch (error) {
        console.error("Analysis Error:", error);

        // 5. Send Error Response
        res.status(500).json({
            error: "Failed to analyze resume",
            details: error.message
        });

    } finally {
        // 6. ALWAYS delete the file, whether success or failure
        // This prevents your 'uploads/' folder from filling up and crashing the disk
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

app.post('/analyze-JD', upload.array('pdfs', 2), async (req, res) => {
    // 1. Validate Input
    if (!req.files || req.files.length < 2) {
        return res.status(400).json({ error: "Please upload both Resume and Job Description." });
    }

    const resumePath = req.files[0].path;
    const jdPath = req.files[1].path;

    try {
        // 2. Read and Parse
        const [resumeBuffer, jdBuffer] = [fs.readFileSync(resumePath), fs.readFileSync(jdPath)];
        const [resumeParser, jdParser] = await Promise.all([
            pdfParse(resumeBuffer),
            pdfParse(jdBuffer)
        ]);

        // Normalize text once
        const resumeText = resumeParser.text.toLowerCase();
        const jdText = jdParser.text.toLowerCase();

        const masterSkills = ['java', 'python', 'javascript', 'angular', 'react', 'node', 'spring boot', 'aws', 'sql', 'mongodb', 'kafka', 'docker', 'kubernetes'];

        // 3. Comparison Logic
        const resumeSkills = masterSkills.filter(skill => resumeText.includes(skill.toLowerCase()));
        const jdSkills = masterSkills.filter(skill => jdText.includes(skill.toLowerCase()));

        // Intersection: Skills matched
        const matchedSkills = jdSkills.filter(skill => resumeSkills.includes(skill));

        // Difference: Skills missing from candidate profile
        const missingSkills = jdSkills.filter(skill => !resumeSkills.includes(skill));

        // 4. Scoring
        let matchScore = jdSkills.length > 0 
            ? Math.round((matchedSkills.length / jdSkills.length) * 100) 
            : 0;

        // 5. Response
        res.json({
            matchScore,
            matchedSkills,
            missingSkills,
            jdSkills,
            verdict: matchScore > 75 ? "Excellent Match" : matchScore > 40 ? "Potential Match" : "Low Alignment",
            suggestion: missingSkills.length > 0
                ? `To increase your score, highlight experience with: ${missingSkills.join(", ")}.`
                : "Your profile is a perfect match for this JD!"
        });

    } catch (error) {
        console.error("Comparison Error:", error);
        res.status(500).json({ error: "Failed to process the documents." });
    } finally {
        // 6. Final Cleanup: Always delete files from server
        [resumePath, jdPath].forEach(path => {
            if (fs.existsSync(path)) fs.unlinkSync(path);
        });
    }
});


app.post('/ask', (req, res) => {
    const { question } = req.body; // it is destructing (equivalent to req.body.question )

    if (!documentChunks.length) {
        return res.json({ answer: "No document uploaded yet" });
    }

    if (!question) {
        return res.status(400).json({ error: "Please provide a question" });
    }
    const stopWords = ["what", "is", "the", "an", "a", "of", "in", "to", "for"] // words to ignore

    const words = question.toLowerCase()
        .replace(/[^\w\s]/g, "") // removes punctuation
        .split(" ").filter(word => word && !stopWords.includes(word)) // keeps only valid word

    const scoredChunks = documentChunks.map(chunk => {
        let score = 0;
        words.forEach(word => {
            if (chunk.toLowerCase()
                .includes(word))
                score++
        })
        return { chunk, score }
    })




    const sorted = scoredChunks
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)

    if (sorted.length === 0) {
        return res.json({ answer: "No relevant information found in the document" })
    }

    const topChunks = sorted.slice(0, 3).map(item => item.chunk)
    console.log(topChunks)
    const finalAnswer = formatAnswer(topChunks, question)
    console.log(finalAnswer)
    res.json({
        answer: finalAnswer
    })
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
