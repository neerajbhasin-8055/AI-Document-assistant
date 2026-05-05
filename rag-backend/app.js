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
let chunkText = (text,chunkSize = 250)=>{
    const words = text.split(/\s+/)
    const chunks = []
    for(let i=0;i<words.length;i+=chunkSize){
        const chunk = words.slice(i,i+chunkSize).join(" ")
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
        console.log("Chunks created: ",documentChunks)

        res.json({
            message:"PDF uploaded and processed successfully",
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
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);

    const data = await pdfParse(buffer);
    
    const documentText = data.text; // Create the missing variable

    fs.unlinkSync(filePath);

    const skillsList = ['python', 'java', 'javascript', 'react', 'node', 'express', 'html', 'css', 'sql', 'mongodb','kafka'];

    const foundSkills = skillsList.filter(skill => documentText.toLowerCase().includes(skill))

    const requiredSections = ['projects', 'experience', 'education', 'skills','achievements','leadership'];
    

    const missingSections = requiredSections.filter(section => 
        !documentText.toLowerCase().includes(section)
    );

    res.send(`
        Resume Analysis:

        Detected Skills: 
        ${foundSkills.length > 0 ? foundSkills.map(s => "• " + s).join("\n") : "None detected"}

        Missing Sections: 
        ${missingSections.length > 0 ? missingSections.map(s => "• " + s).join("\n") : "None! Your resume has all required sections."}

        Suggestions:
            • Add Strong Project descriptions
            • Include measurable achievements
            • Keep formatting clean
    `);
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

        const scoredChunks = documentChunks.map(chunk=>{
            let score = 0;
            words.forEach(word=>{
                if(chunk.toLowerCase()
                .includes(word))
                score++
            })
            return {chunk,score}
        })




    const sorted = scoredChunks
    .filter(item => item.score>0)
    .sort((a,b)=>b.score - a.score)

    if(sorted.length===0){
        return res.json({answer:"No relevant information found in the document"})
    }

    const topChunks = sorted.slice(0,3).map(item=>item.chunk)
    console.log(topChunks)
    const finalAnswer = formatAnswer(topChunks,question)
    console.log(finalAnswer)
    res.json({
        answer:finalAnswer
    })
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
